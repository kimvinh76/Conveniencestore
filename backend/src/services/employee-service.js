const { sql, isMockMode, getPool } = require("../db/sqlserver");
const mock = require("../data/mock-store");

const PROCS = {
  list: "dbo.usp_Local_DanhSachNhanVien",
  create: "dbo.usp_Local_ThemNhanVien",
  update: "dbo.usp_Local_CapNhatNhanVien",
  delete: "dbo.usp_Local_XoaNhanVien",
};

async function listEmployeesByBranch(branch) {
  if (isMockMode()) return mock.listEmployeesByBranch(branch);
  const pool = await getPool(branch);
  const result = await pool.request().execute(PROCS.list);
  return result.recordset;
}

async function createEmployee(branch, payload) {
  if (isMockMode()) return mock.createEmployee(branch, payload);
  const pool = await getPool(branch);
  const maNV = payload.MaNV || `${branch[0]}${String(Date.now()).slice(-4)}`;
  const rs = await pool
    .request()
    .input("MaNV", sql.VarChar(50), maNV)
    .input("HoTen", sql.NVarChar(120), payload.HoTen)
    .input("ChucVu", sql.NVarChar(80), payload.ChucVu)
    .execute(PROCS.create);
  return rs.recordset[0] || null;
}

async function updateEmployee(branch, maNV, payload) {
  if (isMockMode()) return mock.updateEmployee(branch, maNV, payload);
  const pool = await getPool(branch);
  const rs = await pool
    .request()
    .input("MaNV", sql.VarChar(50), maNV)
    .input("HoTen", sql.NVarChar(120), payload.HoTen || null)
    .input("ChucVu", sql.NVarChar(80), payload.ChucVu || null)
    .execute(PROCS.update);
  return rs.recordset[0];
}

async function deleteEmployee(branch, maNV) {
  if (isMockMode()) return mock.deleteEmployee(branch, maNV);
  const pool = await getPool(branch);
  const beforeDelete = await pool
    .request()
    .input("MaNV", sql.VarChar(50), maNV)
    .query("SELECT TOP 1 * FROM NhanVien WHERE MaNV = @MaNV;");
  
  if (!beforeDelete.recordset.length) throw new Error("Employee not found");
  
  await pool.request().input("MaNV", sql.VarChar(50), maNV).execute(PROCS.delete);
  return beforeDelete.recordset[0];
}

async function listAllEmployeesFromCentral() {
  if (isMockMode()) return mock.listAllEmployees();
  const pool = await getPool("CENTRAL");
  const branches = [
    { code: "HUE", server: "HUE_SERVER", db: "Store_H" },
    { code: "SAIGON", server: "SG_SERVER", db: "Store_SG" },
    { code: "HANOI", server: "HN_SERVER", db: "Store_HN" }
  ];
  const results = [];
  for (const b of branches) {
    const rs = await pool.request().query(`SELECT * FROM [${b.server}].[${b.db}].dbo.NhanVien;`);
    results.push(...(rs.recordset || []));
  }
  return results;
}

module.exports = {
  listEmployeesByBranch,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  listAllEmployeesFromCentral
};