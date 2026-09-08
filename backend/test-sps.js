require("dotenv").config({ path: "./.env" });
const { getPool } = require('./src/db/sqlserver');
async function run() {
  try {
    const pool = await getPool('CENTRAL');
    const res = await pool.request().query("SELECT name FROM sys.procedures WHERE name LIKE '%TaiKhoan%' OR name LIKE '%MatKhau%'");
    console.log('Central SPs:', res.recordset.map(r => r.name));
  } catch(e) {
    console.error(e.message);
  }
  process.exit(0);
}
run();
