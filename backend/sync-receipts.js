require("dotenv").config({ path: "./.env" });
const { sql, getPool } = require("./src/db/sqlserver");

const BRANCHES = ["HUE", "SAIGON", "HANOI"];

async function main() {
  console.log("Starting Full Receipt Sync to Central...");
  const centralPool = await getPool("CENTRAL");

  for (const branch of BRANCHES) {
    console.log(`\n--- Syncing Receipts from ${branch} ---`);
    try {
      const branchPool = await getPool(branch);

      // 1. Sync PhieuNhap
      const pnRes = await branchPool.request().query("SELECT * FROM PhieuNhap");
      let pnCount = 0;
      for (const row of pnRes.recordset) {
        const check = await centralPool.request()
          .input("MaPN", sql.VarChar(50), row.MaPN)
          .query("SELECT 1 FROM PhieuNhap WHERE MaPN = @MaPN");
        if (check.recordset.length === 0) {
          await centralPool.request()
            .input("MaPN", sql.VarChar(50), row.MaPN)
            .input("NgayNhap", sql.DateTime, row.NgayNhap)
            .input("ChiNhanh", sql.VarChar(10), row.ChiNhanh)
            .input("TongTien", sql.Decimal(18,2), row.TongTien || 0)
            .input("GhiChu", sql.NVarChar(255), row.GhiChu || "")
            .input("MaNCC", sql.VarChar(50), row.MaNCC || null)
            .query(`
              INSERT INTO PhieuNhap (MaPN, NgayNhap, ChiNhanh, TongTien, GhiChu, MaNCC)
              VALUES (@MaPN, @NgayNhap, @ChiNhanh, @TongTien, @GhiChu, @MaNCC)
            `);
          pnCount++;
        }
      }
      console.log(`Synced ${pnCount} Receipts (PhieuNhap)`);

      // 2. Sync ChiTietPhieuNhap
      const ctRes = await branchPool.request().query("SELECT * FROM ChiTietPhieuNhap");
      let ctCount = 0;
      for (const row of ctRes.recordset) {
        const check = await centralPool.request()
          .input("MaPN", sql.VarChar(50), row.MaPN)
          .input("MaSP", sql.VarChar(50), row.MaSP)
          .query("SELECT 1 FROM ChiTietPhieuNhap WHERE MaPN = @MaPN AND MaSP = @MaSP");
        if (check.recordset.length === 0) {
          await centralPool.request()
            .input("MaPN", sql.VarChar(50), row.MaPN)
            .input("MaSP", sql.VarChar(50), row.MaSP)
            .input("SoLuong", sql.Int, row.SoLuong)
            .input("DonGiaNhap", sql.Decimal(18,2), row.DonGiaNhap || 0)
            .query(`
              INSERT INTO ChiTietPhieuNhap (MaPN, MaSP, SoLuong, DonGiaNhap)
              VALUES (@MaPN, @MaSP, @SoLuong, @DonGiaNhap)
            `);
          ctCount++;
        }
      }
      console.log(`Synced ${ctCount} Receipt Details (ChiTietPhieuNhap)`);
      
    } catch (err) {
      console.error(`Failed to sync from ${branch}:`, err.message);
    }
  }

  console.log("\nFull Receipt Sync Complete!");
  process.exit(0);
}

main();
