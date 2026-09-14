const { sql, getPool } = require("../db/sqlserver");

async function listBrands(branch) {
  const pool = await getPool(branch);
  const result = await pool.request().execute("dbo.usp_Chung_DanhSachThuongHieu");
  return result.recordset;
}

module.exports = {
  listBrands
};
