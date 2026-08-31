require("dotenv").config({ path: "./.env" });
const { sql, getPool } = require("./src/db/sqlserver");

const BRANCHES = ["HUE", "SAIGON", "HANOI"];

async function main() {
  console.log("Starting Full Sync to Central...");
  const centralPool = await getPool("CENTRAL");

  for (const branch of BRANCHES) {
    console.log(`\n--- Syncing from ${branch} ---`);
    try {
      const branchPool = await getPool(branch);

      // 1. Sync Invoices (HoaDon)
      const hdRes = await branchPool.request().query("SELECT * FROM HoaDon");
      let hdCount = 0;
      for (const row of hdRes.recordset) {
        const check = await centralPool.request()
          .input("MaHD", sql.VarChar(50), row.MaHD)
          .query("SELECT 1 FROM HoaDon WHERE MaHD = @MaHD");
        if (check.recordset.length === 0) {
          await centralPool.request()
            .input("MaHD", sql.VarChar(50), row.MaHD)
            .input("NgayTao", sql.DateTime, row.NgayTao)
            .input("ChiNhanh", sql.VarChar(10), row.ChiNhanh)
            .input("MaNV", sql.VarChar(50), row.MaNV)
            .input("MaKH", sql.VarChar(50), row.MaKH || null)
            .input("GhiChu", sql.NVarChar(255), row.GhiChu || "")
            .input("TongTienGoc", sql.Decimal(18,2), row.TongTienGoc || 0)
            .input("TongSoTienGiam", sql.Decimal(18,2), row.TongSoTienGiam || 0)
            .input("TongTienThanhToan", sql.Decimal(18,2), row.TongTienThanhToan || 0)
            .input("DiemDaDung", sql.Int, row.DiemDaDung || 0)
            .input("SoTienGiamTuDiem", sql.Decimal(18,2), row.SoTienGiamTuDiem || 0)
            .query(`
              INSERT INTO HoaDon (MaHD, NgayTao, ChiNhanh, MaNV, MaKH, GhiChu, TongTienGoc, TongSoTienGiam, TongTienThanhToan, DiemDaDung, SoTienGiamTuDiem)
              VALUES (@MaHD, @NgayTao, @ChiNhanh, @MaNV, @MaKH, @GhiChu, @TongTienGoc, @TongSoTienGiam, @TongTienThanhToan, @DiemDaDung, @SoTienGiamTuDiem)
            `);
          hdCount++;
        }
      }
      console.log(`Synced ${hdCount} Invoices (HoaDon)`);

      // 2. Sync Invoice Details (ChiTietHoaDon)
      const ctRes = await branchPool.request().query("SELECT * FROM ChiTietHoaDon");
      let ctCount = 0;
      for (const row of ctRes.recordset) {
        const check = await centralPool.request()
          .input("MaHD", sql.VarChar(50), row.MaHD)
          .input("MaSP", sql.VarChar(50), row.MaSP)
          .query("SELECT 1 FROM ChiTietHoaDon WHERE MaHD = @MaHD AND MaSP = @MaSP");
        if (check.recordset.length === 0) {
          await centralPool.request()
            .input("MaHD", sql.VarChar(50), row.MaHD)
            .input("MaSP", sql.VarChar(50), row.MaSP)
            .input("SoLuong", sql.Int, row.SoLuong)
            .input("DonGia", sql.Decimal(18,2), row.DonGia)
            .query(`
              INSERT INTO ChiTietHoaDon (MaHD, MaSP, SoLuong, DonGia)
              VALUES (@MaHD, @MaSP, @SoLuong, @DonGia)
            `);
          ctCount++;
        }
      }
      console.log(`Synced ${ctCount} Invoice Details (ChiTietHoaDon)`);

      // 4. Sync Inventory (TonKho)
      const tkRes = await branchPool.request().query("SELECT * FROM TonKho");
      let tkCount = 0;
      for (const row of tkRes.recordset) {
        const check = await centralPool.request()
          .input("MaSP", sql.VarChar(50), row.MaSP)
          .input("ChiNhanh", sql.VarChar(10), branch)
          .query("SELECT 1 FROM TonKho WHERE MaSP = @MaSP AND ChiNhanh = @ChiNhanh");
        
        if (check.recordset.length === 0) {
          await centralPool.request()
            .input("MaSP", sql.VarChar(50), row.MaSP)
            .input("ChiNhanh", sql.VarChar(10), branch)
            .input("SoLuongTon", sql.Int, row.SoLuongTon)
            .query(`
              INSERT INTO TonKho (MaSP, ChiNhanh, SoLuongTon)
              VALUES (@MaSP, @ChiNhanh, @SoLuongTon)
            `);
        } else {
          await centralPool.request()
            .input("MaSP", sql.VarChar(50), row.MaSP)
            .input("ChiNhanh", sql.VarChar(10), branch)
            .input("SoLuongTon", sql.Int, row.SoLuongTon)
            .query(`
              UPDATE TonKho SET SoLuongTon = @SoLuongTon
              WHERE MaSP = @MaSP AND ChiNhanh = @ChiNhanh
            `);
        }
        tkCount++;
      }
      console.log(`Synced & Overwrote ${tkCount} Inventory items (TonKho)`);

    } catch (err) {
      console.error(`Failed to sync from ${branch}:`, err.message);
    }
  }

  console.log("\nFull Sync Complete!");
  process.exit(0);
}

main();
