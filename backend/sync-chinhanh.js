require("dotenv").config({ path: "./.env" });
const { sql, getPool } = require("./src/db/sqlserver");

const ALL_BRANCHES = ["CENTRAL", "HUE", "SAIGON", "HANOI"];
const branchData = [
  { MaChiNhanh: 'CENTRAL', TenChiNhanh: 'Trung Tâm', DiaChi: 'Tòa nhà Central', SoDienThoai: '19001560' },
  { MaChiNhanh: 'HUE', TenChiNhanh: 'Chi nhánh Huế', DiaChi: 'Thành phố Huế', SoDienThoai: '0234123456' },
  { MaChiNhanh: 'SAIGON', TenChiNhanh: 'Chi nhánh Sài Gòn', DiaChi: 'TP. Hồ Chí Minh', SoDienThoai: '0281234567' },
  { MaChiNhanh: 'HANOI', TenChiNhanh: 'Chi nhánh Hà Nội', DiaChi: 'Thủ đô Hà Nội', SoDienThoai: '0241234567' }
];

async function main() {
  console.log("Starting ChiNhanh Sync...");

  for (const branch of ALL_BRANCHES) {
    try {
      const pool = await getPool(branch);
      let added = 0;
      for (const row of branchData) {
        const check = await pool.request()
          .input("MaChiNhanh", sql.VarChar(10), row.MaChiNhanh)
          .query(`SELECT 1 FROM ChiNhanh WHERE MaChiNhanh = @MaChiNhanh`);
        
        if (check.recordset.length === 0) {
          await pool.request()
            .input("MaChiNhanh", sql.VarChar(10), row.MaChiNhanh)
            .input("TenChiNhanh", sql.NVarChar(100), row.TenChiNhanh)
            .input("DiaChi", sql.NVarChar(200), row.DiaChi)
            .query(`
              INSERT INTO ChiNhanh (MaChiNhanh, TenChiNhanh, DiaChi)
              VALUES (@MaChiNhanh, @TenChiNhanh, @DiaChi)
            `);
          added++;
        }
      }
      console.log(`Synced ${added} branches to ${branch} database`);
    } catch (err) {
      console.error(`Failed to sync to ${branch}:`, err.message);
    }
  }
  
  console.log("ChiNhanh Sync Complete!");
  process.exit(0);
}

main();
