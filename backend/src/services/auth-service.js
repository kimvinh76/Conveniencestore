const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sql, getPool } = require("../db/sqlserver");
const { isCentralBranch } = require("../config/branches");
const emailService = require("./email-service");

const TOKEN_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "access_token";
const TOKEN_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

async function hashPassword(plainPassword) {
  if (!plainPassword) throw new Error("Password is required");
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]?\$/.test(value);
}

async function verifyPassword(plainPassword, storedPassword) {
  if (!plainPassword || !storedPassword) return false;
  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(plainPassword, storedPassword);
  }
  return plainPassword === storedPassword;
}

function createAuthToken(payload) {
  return jwt.sign(payload, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

function buildAuthUser(record) {
  return {
    username: record.TenDangNhap,
    employeeId: record.MaNV,
    fullName: record.HoTen || null,
    title: record.ChucVu || null,
    role: record.Quyen,
    branch: record.ChiNhanh,
    homeBranch: record.ChiNhanh,
    active: Boolean(record.TrangThai),
  };
}

function normalizeRole(value) {
  return String(value || "").trim().toUpperCase();
}

function canAccessBranch(record, loginBranch) {
  const role = normalizeRole(record.Quyen);
  if (role === "ADMIN_TOAN_BO") {
    return isCentralBranch(loginBranch);
  }

  if (isCentralBranch(loginBranch)) {
    return false;
  }

  return role === "NHAN_VIEN" || role === "ADMIN_CHI_NHANH";
}

async function findAccountInCentral(username) {



  const pool = await getPool("CENTRAL");
  const result = await pool
    .request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .query(`
      SELECT TOP 1
        tk.TenDangNhap,
        tk.MatKhau,
        tk.MaNV,
        tk.Quyen,
        tk.TrangThai,
        nv.HoTen,
        nv.ChucVu,
        nv.Email,
        nv.ChiNhanh
      FROM dbo.TaiKhoan tk
      INNER JOIN dbo.NhanVien nv ON nv.MaNV = tk.MaNV
      WHERE tk.TenDangNhap = @TenDangNhap;
    `);

  return result.recordset[0] || null;
}

async function findAccountForLogin(username) {
  const record = await findAccountInCentral(username);
  return record; // Trả thẳng kết quả từ DB, không bọc thêm { record, branch }
}

async function findAccountByEmail(email) {

  const pool = await getPool("CENTRAL");
  const result = await pool
    .request()
    .input("Email", sql.VarChar(100), email)
    .query(`
      SELECT TOP 1
        tk.TenDangNhap, tk.MatKhau, tk.MaNV, tk.Quyen, tk.TrangThai,
        nv.HoTen, nv.ChucVu, nv.Email, nv.ChiNhanh
      FROM dbo.TaiKhoan tk
      INNER JOIN dbo.NhanVien nv ON nv.MaNV = tk.MaNV
      WHERE nv.Email = @Email;
    `);

  const record = result.recordset[0] || null;
  return record ? { branch: record.ChiNhanh, record } : null;
}

async function createPasswordResetToken(email) {
  const pool = await getPool("CENTRAL");
  const account = await findAccountByEmail(email);
  if (!account || !account.record.Email) {
    // Không throw lỗi để tránh user enumeration, chỉ trả về null
    return null;
  }

  const username = account.record.TenDangNhap;

  // Xóa token cũ nếu có
  await pool.request().input("TenDangNhap", sql.VarChar(50), username).query("DELETE FROM dbo.PasswordResetToken WHERE TenDangNhap = @TenDangNhap");

  // Tạo token mới
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Lưu token vào DB với thời gian hết hạn (ví dụ: 15 phút)
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  await pool.request()
    .input("Token", sql.VarChar(255), hashedToken)
    .input("TenDangNhap", sql.VarChar(50), username)
    .input("NgayHetHan", sql.DateTime2, expires)
    .query("INSERT INTO dbo.PasswordResetToken (Token, TenDangNhap, NgayHetHan) VALUES (@Token, @TenDangNhap, @NgayHetHan)");

  // Trả về token chưa hash để gửi email
  return { email: account.record.Email, token };
}

module.exports = {
  TOKEN_COOKIE_NAME,
  TOKEN_SECRET,
  TOKEN_EXPIRES_IN,
  hashPassword,
  verifyPassword,
  createAuthToken,
  buildAuthUser,
  findAccountForLogin,
  canAccessBranch,
  findAccountByEmail,
  createPasswordResetToken,
  sendPasswordResetEmail: emailService.sendPasswordResetEmail,
};
