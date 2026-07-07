const {
  TOKEN_COOKIE_NAME,
  TOKEN_EXPIRES_IN,
  verifyPassword,
  createAuthToken,
  buildAuthUser,
  findAccountForLogin,
  canAccessBranch,
  createPasswordResetToken,
  sendPasswordResetEmail,
  hashPassword,
} = require("../services/auth-service");
const { requireAuth } = require("../middleware/auth");
const { getPool, sql } = require("../db/sqlserver");

function toCookieMaxAge(expiresIn) {
  const match = String(expiresIn || "").trim().match(/^(\d+)([smhd])$/i);
  if (!match) return 8 * 60 * 60 * 1000;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * (unitMs[unit] || 1000);
}

function cookieOptions() {
  const isProduction = String(process.env.NODE_ENV || "").toLowerCase() === "production";
  const sameSite = String(process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
  const secure = String(process.env.COOKIE_SECURE || (isProduction ? "true" : "false")).toLowerCase() === "true";
  const domain = String(process.env.COOKIE_DOMAIN || "").trim();
  return {
    httpOnly: true,
    secure,
    sameSite: ["lax", "strict", "none"].includes(sameSite) ? sameSite : "lax",
    path: "/",
    maxAge: toCookieMaxAge(TOKEN_EXPIRES_IN),
    ...(domain ? { domain } : {}),
  };
}

exports.login = async (req, res) => {
  try {
    const username = String(req.body.username || req.body.TenDangNhap || "").trim();
    const password = String(req.body.password || req.body.MatKhau || "").trim();

    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required" });
    }

    const account = await findAccountForLogin(username);

    if (!account) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const { record, branch: matchedBranch } = account;
    const passwordOk = await verifyPassword(password, record.MatKhau);
    if (!passwordOk) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (!canAccessBranch(record, matchedBranch)) {
      return res.status(403).json({ message: "This account cannot access the resolved branch" });
    }

    if (Number(record.TrangThai) === 0) {
      return res.status(403).json({ message: "Account is locked" });
    }

    const user = buildAuthUser(record, matchedBranch);
    const token = createAuthToken({
      sub: record.TenDangNhap,
      username: record.TenDangNhap,
      branch: matchedBranch,
      employeeId: record.MaNV,
      role: record.Quyen,
      fullName: record.HoTen || null,
    });

    res.cookie(TOKEN_COOKIE_NAME, token, cookieOptions());

    return res.json({
      message: "Login successful",
      branch: matchedBranch,
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.logout = async (_req, res) => {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    sameSite: String(process.env.COOKIE_SAME_SITE || "lax").toLowerCase(),
    secure: String(process.env.COOKIE_SECURE || "false").toLowerCase() === "true",
    path: "/",
    ...(String(process.env.COOKIE_DOMAIN || "").trim() ? { domain: String(process.env.COOKIE_DOMAIN).trim() } : {}),
  });
  return res.json({ message: "Logged out" });
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const tokenData = await createPasswordResetToken(email);

    if (tokenData) {
      await sendPasswordResetEmail(tokenData.email, tokenData.token);
    }

    // Luôn trả về thông báo thành công chung chung để tránh user enumeration
    return res.json({ message: "If your account exists, a password reset link has been sent to your email." });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    const hashedToken = require("crypto").createHash("sha256").update(token).digest("hex");

    const pool = await getPool("CENTRAL");
    const tokenRecord = await pool.request()
      .input("Token", sql.VarChar(255), hashedToken)
      .query("SELECT * FROM dbo.PasswordResetToken WHERE Token = @Token AND NgayHetHan > GETDATE()");

    if (!tokenRecord.recordset.length) {
      return res.status(400).json({ message: "Invalid or expired password reset token." });
    }

    const { TenDangNhap } = tokenRecord.recordset[0];
    const hashedNewPassword = await hashPassword(newPassword);

    // Cập nhật mật khẩu và xóa token
    await pool.request()
      .input("TenDangNhap", sql.VarChar(50), TenDangNhap)
      .input("MatKhau", sql.VarChar(255), hashedNewPassword)
      .query("UPDATE dbo.TaiKhoan SET MatKhau = @MatKhau WHERE TenDangNhap = @TenDangNhap");

    await pool.request().input("Token", sql.VarChar(255), hashedToken).query("DELETE FROM dbo.PasswordResetToken WHERE Token = @Token");

    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.me = [
  requireAuth,
  async (req, res) => {
    return res.json({
      authenticated: true,
      auth: req.auth,
    });
  },
];
