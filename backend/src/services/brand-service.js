const { sql, getPool } = require("../db/sqlserver");

async function listBrands() {
  const pool = await getPool("CENTRAL");
  const result = await pool.request().execute("dbo.usp_Chung_DanhSachThuongHieu");
  return result.recordset;
}

module.exports = {
  listBrands
};
