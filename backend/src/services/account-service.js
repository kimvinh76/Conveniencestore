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
 * Cập nhật tài khoản CENTRAL (quyền, trạng thái, mật khẩu)
 */
async function updateAccount(username, payload, requestingUserAuth) {
  const pool = await getPool("CENTRAL");

  const accountInfoResult = await pool.request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .query(`
      SELECT tk.MaNV, nv.ChiNhanh
      FROM dbo.TaiKhoan tk
      INNER JOIN dbo.NhanVien nv ON nv.MaNV = tk.MaNV
      WHERE tk.TenDangNhap = @TenDangNhap
    `);

  if (!accountInfoResult.recordset.length) {
    throw new Error("Account not found for update.");
  }
  const accountBranch = accountInfoResult.recordset[0].ChiNhanh;

  // Lấy thông tin tài khoản hiện tại từ CentralDB để kiểm tra quyền
  const currentAccountResult = await pool.request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .query(`SELECT Quyen FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap`);
  const currentAccountRole = currentAccountResult.recordset[0]?.Quyen;

  // Logic bảo mật:
  // 1. Không được phép thay đổi quyền của tài khoản ADMIN_TOAN_BO
  if (currentAccountRole === "ADMIN_TOAN_BO" && payload.Quyen && payload.Quyen !== currentAccountRole) {
    throw new Error("Không được phép thay đổi quyền của tài khoản ADMIN_TOAN_BO.");
  }
  // 2. Không được phép nâng cấp tài khoản lên ADMIN_TOAN_BO qua chức năng này
  if (payload.Quyen === "ADMIN_TOAN_BO" && currentAccountRole !== "ADMIN_TOAN_BO") {
    throw new Error("Không được phép nâng cấp tài khoản lên ADMIN_TOAN_BO qua chức năng này.");
  }
  // 3. ADMIN_TOAN_BO không thể tự hạ cấp hoặc khóa/mở khóa tài khoản của chính mình
  if (requestingUserAuth.username === username && (payload.Quyen || payload.TrangThai !== undefined)) {
    throw new Error("Không được phép thay đổi quyền hoặc trạng thái của tài khoản ADMIN_TOAN_BO đang đăng nhập.");
  }

  await pool
    .request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .input("MatKhau", sql.VarChar(255), null)
    .input("Quyen", sql.NVarChar(50), payload.Quyen || null)
    .input("TrangThai", sql.Bit, payload.TrangThai !== undefined ? payload.TrangThai : null)
    .execute("dbo.usp_Central_CapNhatTaiKhoan");


    if (accountBranch !== 'CENTRAL') {
    let linkedServerUpdateSql = '';
    let linkedServerName = '';
    let linkedDbName = '';

    if (accountBranch === 'HUE') {
      linkedServerName = process.env.LINKED_HUE || 'HUE_SERVER';
      linkedDbName = process.env.HUE_DB_NAME || 'Store_H';
    } else if (accountBranch === 'SAIGON') {
      linkedServerName = process.env.LINKED_SAIGON || 'SG_SERVER';
      linkedDbName = process.env.SAIGON_DB_NAME || 'Store_SG';
    } else if (accountBranch === 'HANOI') {
      linkedServerName = process.env.LINKED_HANOI || 'HN_SERVER';
      linkedDbName = process.env.HANOI_DB_NAME || 'Store_HN';
    }

    if (linkedServerName) {
      linkedServerUpdateSql = `
        UPDATE [${linkedServerName}].[${linkedDbName}].dbo.TaiKhoan
        SET Quyen = COALESCE(@Quyen, Quyen), TrangThai = COALESCE(@TrangThai, TrangThai)
        WHERE TenDangNhap = @TenDangNhap;
      `;
      await pool.request()
        .input("TenDangNhap", sql.VarChar(50), username)
        .input("Quyen", sql.NVarChar(50), payload.Quyen || null)
        .input("TrangThai", sql.Bit, payload.TrangThai !== undefined ? payload.TrangThai : null)
        .query(linkedServerUpdateSql);
    }
  }
  return { TenDangNhap: username };
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

// ========== SERVICE DÀNH CHO CHI NHÁNH (ADMIN_CHI_NHANH) ==========

/**
 * Xem danh sách tài khoản của 1 chi nhánh (gọi xuống local DB)
 */
async function listAccountsByBranch(branch) {
  const pool = await getPool(branch);
  const result = await pool.request().execute("dbo.usp_Local_DanhSachTaiKhoan");
  return result.recordset;
}

/**
 * Tạo tài khoản ở chi nhánh (ép quyền = NHAN_VIEN)

 */

/**
 * Khóa tài khoản ở chi nhánh (gọi local proc)
 */
async function lockAccountLocal(username, branch) {
  const pool = await getPool(branch);
  await pool
    .request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .execute("dbo.usp_Local_KhoaTaiKhoan");

  //  Cập nhật ngay lên CentralDB để chặn luồng Đăng nhập
  const centralPool = await getPool("CENTRAL");
  await centralPool.request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .query("UPDATE dbo.TaiKhoan SET TrangThai = 0 WHERE TenDangNhap = @TenDangNhap");

  return { TenDangNhap: username, TrangThai: 0 };
}

/**
 * Mở khóa tài khoản ở chi nhánh (gọi local proc)
 */
async function unlockAccountLocal(username, branch) {
  const pool = await getPool(branch);
  await pool
    .request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .execute("dbo.usp_Local_MoKhoaTaiKhoan");

  // Cập nhật ngay lên CentralDB để cho phép đăng nhập lại( giảm độ trễ)
  const centralPool = await getPool("CENTRAL");
  await centralPool.request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .query("UPDATE dbo.TaiKhoan SET TrangThai = 1 WHERE TenDangNhap = @TenDangNhap");

  return { TenDangNhap: username, TrangThai: 1 };
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

  const passwordOk = await verifyPassword(oldPassword, account.record.MatKhau);
  if (!passwordOk) throw new Error("Old password is incorrect");

  // Hash mật khẩu mới và update
  const hashedNewPassword = await hashPassword(newPassword);
  const pool = await getPool("CENTRAL");
  await pool
    .request()
    .input("MatKhau", sql.VarChar(255), hashedNewPassword)
    .input("TenDangNhap", sql.VarChar(50), username)
    .query(`UPDATE dbo.TaiKhoan SET MatKhau = @MatKhau WHERE TenDangNhap = @TenDangNhap`);

  return { message: "Password changed successfully" };
}

/**
 * Cập nhật thông tin hồ sơ cá nhân (Dành cho nhân viên tự sửa)
 */
async function updateOwnProfile(username, payload) {
  const pool = await getPool("CENTRAL");
  
  // Lấy MaNV từ username trước
  const user = await pool.request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .query("SELECT MaNV FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap");
  
  if (!user.recordset.length) throw new Error("User not found");
  const maNV = user.recordset[0].MaNV;

  // Cập nhật thông tin ở bảng NhanVien
  await pool.request()
    .input("MaNV", sql.VarChar(50), maNV)
    .input("HoTen", sql.NVarChar(120), payload.fullName)
    .query("UPDATE dbo.NhanVien SET HoTen = @HoTen WHERE MaNV = @MaNV");

  return { username, fullName: payload.fullName };
}

module.exports = {
  // Central functions
  listAllAccountsFromCentral,
  createAccount,
  updateAccount,
  lockAccount,
  unlockAccount,

  // Branch functions
  listAccountsByBranch,
  lockAccountLocal,
  unlockAccountLocal,

  // Personal
  changeOwnPassword,
  updateOwnProfile,
};