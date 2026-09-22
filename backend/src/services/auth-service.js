const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sql, getPool } = require("../db/sqlserver");
const { isCentralBranch } = require("../config/branches");
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

  if (loginBranch !== record.ChiNhanh) {
    return false;
  }

  return role === "NHAN_VIEN" || role === "ADMIN_CHI_NHANH";
}


async function findAccountForLogin(username, domainBranch = null) {
  // BẮT BUỘC phải có domainBranch (tức là đi qua NGINX). Nếu không có, CHẶN!
  if (!domainBranch) {
    throw new Error("ACCESS_DENIED: Bắt buộc đăng nhập thông qua tên miền ảo của chi nhánh (vd: saigon.ddbms.local). Không hỗ trợ truy cập trực tiếp qua localhost.");
  }

  // Khóa cứng bảo mật: Chỉ quét đúng Database của tên miền đó
  if (["CENTRAL", "HANOI", "HUE", "SAIGON"].includes(domainBranch)) {
    try {
      const pool = await getPool(domainBranch);
      const result = await pool.request()
        .input("TenDangNhap", sql.VarChar(50), username)
        .execute("dbo.usp_Chung_DangNhap");

      if (result.recordset.length > 0) return result.recordset[0];
    } catch (err) {
      console.warn(`[Auth] Lỗi kết nối DB ${domainBranch}:`, err.message);
      if (err.message.includes("Connection") || err.message.includes("Could not find stored procedure") || err.message.includes("network-related")) {
        const error = new Error(`Hệ thống tại chi nhánh ${domainBranch} đang bảo trì hoặc mất kết nối. Vui lòng thử lại sau.`);
        error.statusCode = 503;
        throw error;
      }
    }
  }

  // Trả về luôn, chặn tài khoản đi lạc tên miền
  return null;
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
};
