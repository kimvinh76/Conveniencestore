require("dotenv").config({ path: "./.env" });
const { sql, getPool } = require("./src/db/sqlserver");

const ALL_BRANCHES = ["CENTRAL", "HUE", "SAIGON", "HANOI"];

async function main() {
  console.log("Starting Customer Sync...");
  const allCustomers = new Map();

  // 1. Fetch all customers from all branches
  for (const branch of ALL_BRANCHES) {
    try {
      const pool = await getPool(branch);
      const result = await pool.request().query(`SELECT * FROM KhachHang`);
      for (const row of result.recordset) {
        if (!allCustomers.has(row.MaKH)) {
          allCustomers.set(row.MaKH, row);
        }
      }
      console.log(`Fetched ${result.recordset.length} customers from ${branch}`);
    } catch (err) {
      console.error(`Failed to fetch from ${branch}:`, err.message);
    }
  }

  console.log(`Total unique customers found: ${allCustomers.size}`);

  // 2. Insert missing customers into all branches
  for (const branch of ALL_BRANCHES) {
    try {
      const pool = await getPool(branch);
      let added = 0;
      for (const [maKh, row] of allCustomers.entries()) {
        const check = await pool.request()
          .input("MaKH", sql.VarChar(50), maKh)
          .query(`SELECT 1 FROM KhachHang WHERE MaKH = @MaKH`);
        
        if (check.recordset.length === 0) {
          let finalChiNhanhDK = row.ChiNhanhDK || 'CENTRAL';
          const validBranches = ['CENTRAL', 'HUE', 'SAIGON', 'HANOI'];
          if (!validBranches.includes(finalChiNhanhDK)) {
            finalChiNhanhDK = 'CENTRAL';
          }

          await pool.request()
            .input("MaKH", sql.VarChar(50), row.MaKH)
            .input("HoTen", sql.NVarChar(120), row.HoTen)
            .input("SoDienThoai", sql.VarChar(15), row.SoDienThoai || null)
            .input("DiemTichLuy", sql.Int, row.DiemTichLuy || 0)
            .input("NgayDangKy", sql.DateTime, row.NgayDangKy || new Date())
            .input("ChiNhanhDK", sql.VarChar(10), finalChiNhanhDK)
            .query(`
              INSERT INTO KhachHang (MaKH, HoTen, SoDienThoai, DiemTichLuy, NgayDangKy, ChiNhanhDK)
              VALUES (@MaKH, @HoTen, @SoDienThoai, @DiemTichLuy, @NgayDangKy, @ChiNhanhDK)
            `);
          added++;
        }
      }
      console.log(`Synced ${added} missing customers to ${branch}`);
    } catch (err) {
      console.error(`Failed to sync to ${branch}:`, err.message);
    }
  }
  
  console.log("Sync Complete!");
  process.exit(0);
}

main();
