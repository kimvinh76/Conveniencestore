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
 * @param {Object} payload - { TenDangNhap, MatKhau, MaNV, Quyen, TrangThai }
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
  return { TenDangNhap: payload.TenDangNhap, MaNV: payload.MaNV, Quyen: payload.Quyen };
}



/**
 * Khóa tài khoản (cả CENTRAL và linked branches)
 */
async function lockAccount(username, branch) {
  const pool = await getPool("CENTRAL");
  await pool
    .request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .input("ChiNhanh", sql.VarChar(10), branch)
    .execute("dbo.usp_Central_KhoaTaiKhoan");


  return { TenDangNhap: username, TrangThai: 0 };
}

/**
 * Mở khóa tài khoản (cả CENTRAL và linked branches)
 */
async function unlockAccount(username, branch) {
  const pool = await getPool("CENTRAL");
  await pool
    .request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .input("ChiNhanh", sql.VarChar(10), branch)
    .execute("dbo.usp_Central_MoKhoaTaiKhoan");


  return { TenDangNhap: username, TrangThai: 1 };
}

/**
 * Reset password (Admin Toàn bộ) - Gọi xuống DB chi nhánh hoặc lưu tại Central
 */
async function resetPassword(username, newPassword, branch) {
  const { hashPassword } = require("./auth-service");
  const hashedNewPassword = await hashPassword(newPassword);

  // Sử dụng Stored Procedure mới để cập nhật Central và đẩy xuống Branch qua Linked Server
  const centralPool = await getPool("CENTRAL");
  await centralPool.request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .input("MatKhau", sql.VarChar(255), hashedNewPassword)
    .input("ChiNhanh", sql.VarChar(10), branch)
    .execute("dbo.usp_Central_DoiMatKhau");

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

  // Hash mật khẩu mới và update qua Stored Procedure
  const hashedNewPassword = await hashPassword(newPassword);
  const pool = await getPool("CENTRAL");
  await pool
    .request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .input("MatKhau", sql.VarChar(255), hashedNewPassword)
    .input("ChiNhanh", sql.VarChar(10), account.ChiNhanh)
    .execute("dbo.usp_Central_DoiMatKhau");

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