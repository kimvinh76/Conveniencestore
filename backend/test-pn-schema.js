require("dotenv").config({ path: "./.env" });
const { getPool } = require('./src/db/sqlserver');
async function run() {
  try {
    const pool = await getPool('HUE');
    const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PhieuNhap'");
    console.log('PhieuNhap:', res.recordset.map(r => r.COLUMN_NAME));
    const res2 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ChiTietPhieuNhap'");
    console.log('ChiTietPhieuNhap:', res2.recordset.map(r => r.COLUMN_NAME));
  } catch(e) {
    console.error(e.message);
  }
  process.exit(0);
}
run();
