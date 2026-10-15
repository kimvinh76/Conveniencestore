const { sql, getPool } = require("../db/sqlserver");
const { publishEvent } = require("../utils/rabbitmq");
const PROCS = {
  list: "dbo.usp_Chung_DanhSachNhanVien",
  create: "dbo.usp_Chung_ThemNhanVien",
  update: "dbo.usp_Chung_CapNhatNhanVien",
  delete: "dbo.usp_Chung_XoaNhanVien",
};

async function listEmployeesByBranch(branchCode) {
  const pool = await getPool(branchCode);
  const result = await pool.request().execute(PROCS.list);
  return result.recordset;
}

async function createEmployee(branchCode, payload) {
  const pool = await getPool(branchCode);
  const maNV = payload.MaNV || `${branchCode[0]}${String(Date.now()).slice(-4)}`;
  const rs = await pool
    .request()
    .input("MaNV", sql.VarChar(50), maNV)
    .input("HoTen", sql.NVarChar(120), payload.HoTen)
    .input("ChucVu", sql.NVarChar(80), payload.ChucVu)
    .input("Email", sql.VarChar(100), payload.Email || null)
    .input("ChiNhanh", sql.VarChar(10), branchCode)
    .execute(PROCS.create);
    
  const createdEmployee = rs.recordset[0] || null;

  // Sync to Branches via MQ
  await publishEvent("master_data_sync", {
    event: "employee.created",
    data: { 
      maNV, 
      hoTen: payload.HoTen, 
      chucVu: payload.ChucVu, 
      email: payload.Email, 
      branchCode 
    }
  });

  return createdEmployee;
}

async function updateEmployee(branchCode, maNV, payload) {
  const pool = await getPool(branchCode);
  const rs = await pool
    .request()
    .input("MaNV", sql.VarChar(50), maNV)
    .input("HoTen", sql.NVarChar(120), payload.HoTen !== undefined ? payload.HoTen : null)
    .input("ChucVu", sql.NVarChar(80), payload.ChucVu !== undefined ? payload.ChucVu : null)
    .input("Email", sql.VarChar(100), payload.Email !== undefined ? payload.Email : null)
    .input("ChiNhanh", sql.VarChar(10), branchCode)
    .execute(PROCS.update);
    
  // Sync to Branches via MQ
  await publishEvent("master_data_sync", {
    event: "employee.updated",
    data: { 
      maNV, 
      hoTen: payload.HoTen !== undefined ? payload.HoTen : null, 
      chucVu: payload.ChucVu !== undefined ? payload.ChucVu : null, 
      email: payload.Email !== undefined ? payload.Email : null, 
      branchCode 
    }
  });

  return rs.recordset[0];
}

async function deleteEmployee(branchCode, maNV) {
  const pool = await getPool(branchCode);
  
  const beforeDelete = await pool
    .request()
    .input("MaNV", sql.VarChar(50), maNV)
    .query("SELECT TOP 1 * FROM NhanVien WHERE MaNV = @MaNV;");

  if (!beforeDelete.recordset.length) throw new Error("Employee not found");

  await pool.request()
    .input("MaNV", sql.VarChar(50), maNV)
    .input("ChiNhanh", sql.VarChar(10), branchCode)
    .execute(PROCS.delete);

  // Sync to Branches via MQ
  await publishEvent("master_data_sync", {
    event: "employee.deleted",
    data: { maNV, branchCode }
  });

  const accountService = require("./account-service");
  try {
    const centralPool = await getPool("CENTRAL");
    const accountLookup = await centralPool.request()
      .input("MaNV", sql.VarChar(50), maNV)
      .query("SELECT TOP 1 TenDangNhap FROM TaiKhoan WHERE MaNV = @MaNV");

    if (accountLookup.recordset.length > 0) {
      const username = accountLookup.recordset[0].TenDangNhap;
      await accountService.lockAccount(username, branchCode);
    }
  } catch (err) {
    if (err.number !== 50002 && err.message !== "Account not found") {
      console.error(`Lỗi khi khóa tài khoản liên kết của ${maNV}:`, err.message);
    }
  }

  return beforeDelete.recordset[0];
}

module.exports = {
  listEmployeesByBranch,
  createEmployee,
  updateEmployee,
  deleteEmployee
};