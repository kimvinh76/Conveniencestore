const { sql, getPool } = require("../db/sqlserver");

async function listCategories(branch) {
  const pool = await getPool(branch);
  const result = await pool.request().execute("dbo.usp_Chung_DanhSachDanhMuc");
  return result.recordset;
}

module.exports = {
  listCategories
};
