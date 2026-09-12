require("dotenv").config({ path: require("path").resolve(__dirname, "../backend/.env") });
const { getPool, sql } = require("../backend/src/db/sqlserver");

async function syncEmployeesToCentral() {
  const branches = ["HANOI", "HUE", "SAIGON"];
  const centralPool = await getPool("CENTRAL");

  console.log("Starting manual employee sync to CENTRAL...");

  for (const branch of branches) {
    try {
      console.log(`\nChecking branch: ${branch}`);
      const branchPool = await getPool(branch);
      const branchEmployees = await branchPool.request().query("SELECT * FROM NhanVien");
      
      const employees = branchEmployees.recordset;
      console.log(`Found ${employees.length} employees in ${branch}`);

      let syncedCount = 0;
      for (const emp of employees) {
        // Check if exists in Central
        const check = await centralPool.request()
          .input("MaNV", sql.VarChar(50), emp.MaNV)
          .query("SELECT 1 FROM NhanVien WHERE MaNV = @MaNV");
          
        if (check.recordset.length === 0) {
          console.log(`Syncing missing employee: ${emp.MaNV} - ${emp.HoTen}`);
          await centralPool.request()
            .input("MaNV", sql.VarChar(50), emp.MaNV)
            .input("HoTen", sql.NVarChar(120), emp.HoTen)
            .input("ChucVu", sql.NVarChar(80), emp.ChucVu)
            .input("Email", sql.VarChar(100), emp.Email || null)
            .input("ChiNhanh", sql.VarChar(10), emp.ChiNhanh)
            .query(`
              INSERT INTO NhanVien (MaNV, HoTen, ChucVu, Email, ChiNhanh)
              VALUES (@MaNV, @HoTen, @ChucVu, @Email, @ChiNhanh)
            `);
          syncedCount++;
        }
      }
      console.log(`Synced ${syncedCount} missing employees from ${branch} to CENTRAL.`);
    } catch (err) {
      console.error(`Error syncing from ${branch}:`, err.message);
    }
  }
  
  console.log("\nSync complete!");
  process.exit(0);
}

syncEmployeesToCentral();
