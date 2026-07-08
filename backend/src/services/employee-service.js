const { sql, isMockMode, getPool } = require("../db/sqlserver");
const { getBranchConfig } = require("../config/branches");
const mock = require("../data/mock-store");

const PROCS = {
  list: "dbo.usp_Local_DanhSachNhanVien",
  create: "dbo.usp_Local_ThemNhanVien",
  update: "dbo.usp_Local_CapNhatNhanVien",
  delete: "dbo.usp_Local_XoaNhanVien",
};

async function listEmployeesByBranch(branchCode) {
  const branch = getBranchConfig(branchCode);
  if (!branch) throw new Error(`Unsupported branch: ${branchCode}`);
  if (isMockMode()) return mock.listEmployeesByBranch(branch.code);
  const pool = await getPool(branch.code);
  const result = await pool.request().execute(PROCS.list);
  return result.recordset;
}

async function createEmployee(branchCode, payload) {
  const branch = getBranchConfig(branchCode);
  if (!branch) throw new Error(`Unsupported branch: ${branchCode}`);
  if (isMockMode()) return mock.createEmployee(branch.code, payload);
  const pool = await getPool(branch.code);
  const maNV = payload.MaNV || `${branch.code[0]}${String(Date.now()).slice(-4)}`;
  const rs = await pool
    .request()
    .input("MaNV", sql.VarChar(50), maNV)
    .input("HoTen", sql.NVarChar(120), payload.HoTen)
    .input("ChucVu", sql.NVarChar(80), payload.ChucVu)
    .input("Email", sql.VarChar(100), payload.Email || null)
    .input("ChiNhanh", sql.VarChar(10), branch.code)
    .execute(PROCS.create);
  return rs.recordset[0] || null;
}

async function updateEmployee(branchCode, maNV, payload) {
  const branch = getBranchConfig(branchCode);
  if (!branch) throw new Error(`Unsupported branch: ${branchCode}`);
  if (isMockMode()) return mock.updateEmployee(branch.code, maNV, payload);
  const pool = await getPool(branch.code);
  const rs = await pool
    .request()
    .input("MaNV", sql.VarChar(50), maNV)
    .input("HoTen", sql.NVarChar(120), payload.HoTen || null)
    .input("ChucVu", sql.NVarChar(80), payload.ChucVu || null)
    .input("Email", sql.VarChar(100), payload.Email || null)
    .input("ChiNhanh", sql.VarChar(10), branch.code)
    .execute(PROCS.update);
  return rs.recordset[0];
}

async function deleteEmployee(branchCode, maNV) {
  const branch = getBranchConfig(branchCode);
  if (!branch) throw new Error(`Unsupported branch: ${branchCode}`);
  if (isMockMode()) return mock.deleteEmployee(branch.code, maNV);
  const pool = await getPool(branch.code);
  const beforeDelete = await pool
    .request()
    .input("MaNV", sql.VarChar(50), maNV)
    .query("SELECT TOP 1 * FROM NhanVien WHERE MaNV = @MaNV;");
  
  if (!beforeDelete.recordset.length) throw new Error("Employee not found");
  
  await pool.request()
    .input("MaNV", sql.VarChar(50), maNV)
    .input("ChiNhanh", sql.VarChar(10), branch.code)
    .execute(PROCS.delete);
  return beforeDelete.recordset[0];
}

async function listAllEmployeesFromCentral() {
  if (isMockMode()) return mock.listAllEmployees();
  const pool = await getPool("CENTRAL");
  const branches = [
    { code: "HUE", server: process.env.LINKED_HUE || "HUE_SERVER", db: process.env.HUE_DB_NAME || "Store_H" },
    { code: "SAIGON", server: process.env.LINKED_SAIGON || "SG_SERVER", db: process.env.SAIGON_DB_NAME || "Store_SG" },
    { code: "HANOI", server: process.env.LINKED_HANOI || "HN_SERVER", db: process.env.HANOI_DB_NAME || "Store_HN" }
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