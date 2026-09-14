require("dotenv").config({ path: "./.env" });
const { sql, getPool } = require("./src/db/sqlserver");

async function main() {
  console.log("Starting Account Sync from Central to Branches...");
  const centralPool = await getPool("CENTRAL");

  try {
    // Lấy tất cả tài khoản và thông tin chi nhánh của nhân viên đó từ Central
    const accRes = await centralPool.request().query(`
      SELECT t.TenDangNhap, t.MatKhau, t.MaNV, t.Quyen, t.TrangThai, n.ChiNhanh
      FROM TaiKhoan t
      JOIN NhanVien n ON t.MaNV = n.MaNV
    `);

    let syncCount = 0;
    for (const row of accRes.recordset) {
      if (!row.ChiNhanh) continue;
      
      const branchPool = await getPool(row.ChiNhanh);
      
      // Kiểm tra xem chi nhánh đã có tài khoản này chưa
      const check = await branchPool.request()
        .input("TenDangNhap", sql.VarChar(50), row.TenDangNhap)
        .query("SELECT 1 FROM TaiKhoan WHERE TenDangNhap = @TenDangNhap");

      if (check.recordset.length === 0) {
        await branchPool.request()
          .input("TenDangNhap", sql.VarChar(50), row.TenDangNhap)
          .input("MatKhau", sql.VarChar(255), row.MatKhau)
          .input("MaNV", sql.VarChar(50), row.MaNV)
          .input("Quyen", sql.NVarChar(50), row.Quyen)
          .input("TrangThai", sql.Bit, row.TrangThai)
          .query(`
            INSERT INTO TaiKhoan (TenDangNhap, MatKhau, MaNV, Quyen, TrangThai)
            VALUES (@TenDangNhap, @MatKhau, @MaNV, @Quyen, @TrangThai)
          `);
        console.log(`- Synced account ${row.TenDangNhap} to branch ${row.ChiNhanh}`);
        syncCount++;
      }
    }
    
    console.log(`\nAccount Sync Complete! Synced ${syncCount} missing accounts.`);
  } catch (err) {
    console.error("Failed to sync accounts:", err.message);
  }

  process.exit(0);
}

main();
