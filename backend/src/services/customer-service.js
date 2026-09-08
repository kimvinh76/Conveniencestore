const { sql, getPool } = require("../db/sqlserver");

const PROCS = {
  list: "dbo.usp_Chung_DanhSachKhachHang",
  create: "dbo.usp_Local_ThemKhachHang",
  update: "dbo.usp_Local_CapNhatKhachHang"
};

async function searchCustomers(branch, query) {
  const pool = await getPool(branch);
  const result = await pool.request()
    .input("SearchTerm", sql.NVarChar(100), query || null)
    .execute(PROCS.list);
  return result.recordset || [];
}

async function createCustomer(branch, data) {
  // Bỏ qua điểm tích lũy, hệ thống luôn khởi tạo = 0
  const { customerId, fullName, phoneNumber, branchId } = data;
  const ALL_BRANCHES = ["CENTRAL", "HUE", "SAIGON", "HANOI"];

  for (const b of ALL_BRANCHES) {
    try {
      const pool = await getPool(b);
      const req = pool.request()
        .input("MaKH", sql.VarChar(50), customerId)
        .input("HoTen", sql.NVarChar(120), fullName)
        .input("SoDienThoai", sql.VarChar(15), phoneNumber || null)
        .input("ChiNhanhDK", sql.VarChar(10), branchId);
      
      if (b === branch) {
        await req.execute(PROCS.create); // Execute standard create on origin
      } else {
        await req.execute("dbo.usp_Branch_DongBoThemKhachHang"); // Sync to others
      }
    } catch (err) {
      console.error(`[SYNC ERROR] Could not sync customer ${customerId} to ${b}:`, err.message);
    }
  }

  return { customerId, fullName, phoneNumber, branchId };
}

async function updateCustomer(branch, customerId, data) {
  // KHÔNG có cập nhật điểm tích lũy ở đây!
  const { fullName, phoneNumber } = data;
  const pool = await getPool(branch);

  await pool.request()
    .input("MaKH", sql.VarChar(50), customerId)
    .input("HoTen", sql.NVarChar(120), fullName)
    .input("SoDienThoai", sql.VarChar(15), phoneNumber || null)
    .execute(PROCS.update);

  // Sync to other branches
  const ALL_BRANCHES = ["CENTRAL", "HUE", "SAIGON", "HANOI"];
  for (const b of ALL_BRANCHES) {
    if (b !== branch) {
      try {
        const syncPool = await getPool(b);
        await syncPool.request()
          .input("MaKH", sql.VarChar(50), customerId)
          .input("HoTen", sql.NVarChar(120), fullName)
          .input("SoDienThoai", sql.VarChar(15), phoneNumber || null)
          .execute("dbo.usp_Branch_DongBoCapNhatKhachHang");
      } catch (err) {
        console.error(`[SYNC ERROR] Could not sync customer update ${customerId} to ${b}:`, err.message);
      }
    }
  }

  return { customerId, updated: true };
}

module.exports = {
  searchCustomers,
  createCustomer,
  updateCustomer
};
