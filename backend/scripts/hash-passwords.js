/**
 * Script hash toàn bộ mật khẩu plain text trong bảng TaiKhoan (CentralDB)
 * thành bcrypt hash.
 * 
 * Cách chạy:
 *   cd backend
 *   node scripts/hash-passwords.js
 */

const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  // Dynamic import để tránh lỗi module loading nếu chưa có pool
  const { sql, getPool } = require("../src/db/sqlserver");

  console.log(" Đang kết nối đến CentralDB...");
  const pool = await getPool("CENTRAL");
  console.log(" Kết nối thành công!");

  // Lấy tất cả tài khoản
  const result = await pool.request().query(`
    SELECT TenDangNhap, MatKhau FROM dbo.TaiKhoan
  `);

  const accounts = result.recordset;
  console.log(`Tìm thấy ${accounts.length} tài khoản.`);

  let hashedCount = 0;
  let skippedCount = 0;

  for (const acc of accounts) {
    const password = acc.MatKhau;

    // Kiểm tra xem đã là bcrypt hash chưa
    if (typeof password === "string" && /^\$2[aby]?\$/.test(password)) {
      console.log(`  ⏭️  ${acc.TenDangNhap}: đã là bcrypt hash, bỏ qua.`);
      skippedCount++;
      continue;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Update vào DB
    await pool
      .request()
      .input("MatKhau", sql.VarChar(255), hash)
      .input("TenDangNhap", sql.VarChar(50), acc.TenDangNhap)
      .query(`UPDATE dbo.TaiKhoan SET MatKhau = @MatKhau WHERE TenDangNhap = @TenDangNhap`);

    console.log(`   ${acc.TenDangNhap}: đã hash thành công.`);
    hashedCount++;
  }

  console.log("═══════════════════════════════════════");
  console.log(` KẾT QUẢ:`);
  console.log(`   - Tổng số tài khoản: ${accounts.length}`);
  console.log(`   - Đã hash: ${hashedCount}`);
  console.log(`   - Đã là bcrypt (bỏ qua): ${skippedCount}`);
  console.log("═══════════════════════════════════════\n");

  if (hashedCount > 0) {
    console.log( "Tất cả mật khẩu đã được hash bằng bcrypt!");
    console.log("   Giờ đây login sẽ dùng bcrypt.compare() để xác thực.");
  } else {
    console.log(" Không có mật khẩu nào cần hash.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Lỗi:", err.message);
  process.exit(1);
});