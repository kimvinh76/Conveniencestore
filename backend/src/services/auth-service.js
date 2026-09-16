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

  return role === "NHAN_VIEN" || role === "ADMIN_CHI_NHANH";
}


async function findAccountForLogin(username, domainBranch = null) {
  // Ưu tiên 1: Chọc thẳng vào nhánh do NGINX định tuyến (Subdomain Routing)
  if (domainBranch && ["CENTRAL", "HANOI", "HUE", "SAIGON"].includes(domainBranch)) {
    try {
      const pool = await getPool(domainBranch);
      const result = await pool.request()
        .input("TenDangNhap", sql.VarChar(50), username)
        .execute("dbo.usp_Chung_DangNhap");

      if (result.recordset.length > 0) {
        return result.recordset[0];
      }
    } catch (err) {
      console.warn(`[Auth] Lỗi kết nối DB ${domainBranch}:`, err.message);
    }
  }

  // Ưu tiên 2 (Dự phòng): Nếu NGINX lỗi hoặc truy cập localhost:3001, quét Central
  try {
    const pool = await getPool("CENTRAL");
    const result = await pool.request()
      .input("TenDangNhap", sql.VarChar(50), username)
      .execute("dbo.usp_Chung_DangNhap");
    if (result.recordset.length > 0) return result.recordset[0];
  } catch (err) {
    console.warn(`[Auth] Không thể kết nối CENTRAL DB (${err.message}). Đang chuyển hướng tìm user '${username}' ở các chi nhánh cục bộ...`);
  }

  // Ưu tiên 3 (Dự phòng cuối cùng): Quét vòng lặp nếu Central sập và mất NGINX
  const branches = ["SAIGON", "HANOI", "HUE"];
  for (const branch of branches) {
    try {
      const pool = await getPool(branch);
      const result = await pool.request()
        .input("TenDangNhap", sql.VarChar(50), username)
        .execute("dbo.usp_Chung_DangNhap");

      if (result.recordset.length > 0) {
        return result.recordset[0];
      }
    } catch (branchErr) {
      console.warn(`[Auth] Lỗi quét nhánh ${branch}:`, branchErr.message);
    }
  }

  return null; // Không tìm thấy ở bất kỳ đâu
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
