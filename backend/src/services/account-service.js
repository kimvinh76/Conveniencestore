const bcrypt = require("bcryptjs");
const { sql, getPool } = require("../db/sqlserver");

// ========== SERVICE DÀNH CHO CENTRAL (ADMIN_TOAN_BO) ==========

/**
 * Xem toàn bộ tài khoản từ CentralDB qua linked server.
 */
async function listAllAccountsFromCentral() {
  const pool = await getPool("CENTRAL");
  const result = await pool.request().execute("dbo.usp_Central_DanhSachTaiKhoanToanBo");
  return result.recordset;
}

/**
 * Tạo tài khoản mới (INSERT vào CentralDB, replication sẽ đẩy xuống branch)
 * @param {Object} payload - { TenDangNhap, MatKhau, MaNV, Quyen, TrangThai, ChiNhanh }
 */
async function createAccount(payload) {
  const pool = await getPool("CENTRAL");
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(payload.MatKhau, salt);

  const rs = await pool
    .request()
    .input("TenDangNhap", sql.VarChar(50), payload.TenDangNhap)
    .input("MatKhau", sql.VarChar(255), hashedPassword)
    .input("MaNV", sql.VarChar(50), payload.MaNV)
    .input("Quyen", sql.NVarChar(50), payload.Quyen)
    .input("TrangThai", sql.Bit, payload.TrangThai !== undefined ? payload.TrangThai : 1)
    .execute("dbo.usp_Central_ThemTaiKhoan");
    
  // --- REPLICATION TO BRANCH DB ---
  if (payload.ChiNhanh) {
    try {
      const branchPool = await getPool(payload.ChiNhanh);
      await branchPool.request()
        .input("TenDangNhap", sql.VarChar(50), payload.TenDangNhap)
        .input("MatKhau", sql.VarChar(255), hashedPassword)
        .input("MaNV", sql.VarChar(50), payload.MaNV)
        .input("Quyen", sql.NVarChar(50), payload.Quyen)
        .input("TrangThai", sql.Bit, payload.TrangThai !== undefined ? payload.TrangThai : 1)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap)
          BEGIN
            INSERT INTO dbo.TaiKhoan (TenDangNhap, MatKhau, MaNV, Quyen, TrangThai)
            VALUES (@TenDangNhap, @MatKhau, @MaNV, @Quyen, @TrangThai)
          END
        `);
      console.log(`Replicated account ${payload.TenDangNhap} to branch ${payload.ChiNhanh}`);
    } catch (err) {
      console.error(`Failed to replicate account to ${payload.ChiNhanh}:`, err.message);
    }
  }

  return { TenDangNhap: payload.TenDangNhap, MaNV: payload.MaNV, Quyen: payload.Quyen };
}



/**
 * Khóa tài khoản (cả CENTRAL và linked branches)
 */
async function lockAccount(username, branch) {
  // Bỏ qua SP bị lỗi do Linked Server, dùng manual sync
  const centralPool = await getPool("CENTRAL");
  await centralPool.request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .query("UPDATE dbo.TaiKhoan SET TrangThai = 0 WHERE TenDangNhap = @TenDangNhap");

  try {
    const branchPool = await getPool(branch);
    await branchPool.request()
      .input("TenDangNhap", sql.VarChar(50), username)
      .query("UPDATE dbo.TaiKhoan SET TrangThai = 0 WHERE TenDangNhap = @TenDangNhap");
  } catch (err) {
    console.error(`[SYNC ERROR] Khóa tài khoản thất bại ở chi nhánh ${branch}:`, err.message);
  }

  return { TenDangNhap: username, TrangThai: 0 };
}

/**
 * Mở khóa tài khoản (cả CENTRAL và linked branches)
 */
async function unlockAccount(username, branch) {
  const centralPool = await getPool("CENTRAL");
  await centralPool.request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .query("UPDATE dbo.TaiKhoan SET TrangThai = 1 WHERE TenDangNhap = @TenDangNhap");

  try {
    const branchPool = await getPool(branch);
    await branchPool.request()
      .input("TenDangNhap", sql.VarChar(50), username)
      .query("UPDATE dbo.TaiKhoan SET TrangThai = 1 WHERE TenDangNhap = @TenDangNhap");
  } catch (err) {
    console.error(`[SYNC ERROR] Mở khóa tài khoản thất bại ở chi nhánh ${branch}:`, err.message);
  }

  return { TenDangNhap: username, TrangThai: 1 };
}

/**
 * Reset password (Admin Toàn bộ) - Gọi xuống DB chi nhánh hoặc lưu tại Central
 */
async function resetPassword(username, newPassword, branch) {
  const { hashPassword } = require("./auth-service");
  const hashedNewPassword = await hashPassword(newPassword);

  const centralPool = await getPool("CENTRAL");
  await centralPool.request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .input("MatKhau", sql.VarChar(255), hashedNewPassword)
    .query("UPDATE dbo.TaiKhoan SET MatKhau = @MatKhau WHERE TenDangNhap = @TenDangNhap");

  try {
    const branchPool = await getPool(branch);
    await branchPool.request()
      .input("TenDangNhap", sql.VarChar(50), username)
      .input("MatKhau", sql.VarChar(255), hashedNewPassword)
      .query("UPDATE dbo.TaiKhoan SET MatKhau = @MatKhau WHERE TenDangNhap = @TenDangNhap");
  } catch (err) {
    console.error(`[SYNC ERROR] Reset mật khẩu thất bại ở chi nhánh ${branch}:`, err.message);
  }

  return { TenDangNhap: username };
}

// ========== SERVICE DÀNH CHO CHI NHÁNH (ADMIN_CHI_NHANH) ==========

/**
 * Xem danh sách tài khoản của 1 chi nhánh (gọi xuống local DB)
 */
async function listAccountsByBranch(branch) {
  const pool = await getPool(branch);
  const result = await pool.request().execute("dbo.usp_Local_DanhSachTaiKhoan");
  return result.recordset;
}



// ========== SERVICE CHO NHAN_VIEN ==========

/**
 * Đổi mật khẩu cá nhân (gọi lên CENTRAL để đồng bộ)
 * Tìm tài khoản này ở CENTRAL, cập nhật mật khẩu mới
 */
async function changeOwnPassword(username, oldPassword, newPassword) {

  // Xác thực mật khẩu cũ trước
  const { findAccountForLogin, hashPassword, verifyPassword } = require("./auth-service");
  const account = await findAccountForLogin(username);
  if (!account) throw new Error("Account not found");

  const passwordOk = await verifyPassword(oldPassword, account.MatKhau);
  if (!passwordOk) throw new Error("Old password is incorrect");

  const hashedNewPassword = await hashPassword(newPassword);
  
  const centralPool = await getPool("CENTRAL");
  await centralPool.request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .input("MatKhau", sql.VarChar(255), hashedNewPassword)
    .query("UPDATE dbo.TaiKhoan SET MatKhau = @MatKhau WHERE TenDangNhap = @TenDangNhap");

  try {
    const branchPool = await getPool(account.ChiNhanh);
    await branchPool.request()
      .input("TenDangNhap", sql.VarChar(50), username)
      .input("MatKhau", sql.VarChar(255), hashedNewPassword)
      .query("UPDATE dbo.TaiKhoan SET MatKhau = @MatKhau WHERE TenDangNhap = @TenDangNhap");
  } catch (err) {
    console.error(`[SYNC ERROR] Đổi mật khẩu thất bại ở chi nhánh ${account.ChiNhanh}:`, err.message);
  }

  return { message: "Password changed successfully" };
}



module.exports = {
  // Central functions
  listAllAccountsFromCentral,
  createAccount,
  lockAccount,
  unlockAccount,
  resetPassword,

  // Branch functions
  listAccountsByBranch,

  // Personal
  changeOwnPassword,
};