const { sql, getPool } = require("../db/sqlserver");

async function listCategories() {
  const pool = await getPool("CENTRAL");
  const result = await pool.request().execute("dbo.usp_Chung_DanhSachDanhMuc");
  return result.recordset;
}

module.exports = {
  listCategories
};
