const {
  TOKEN_COOKIE_NAME,
  TOKEN_EXPIRES_IN,
  verifyPassword,
  createAuthToken,
  buildAuthUser,
  findAccountForLogin,
  canAccessBranch,
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

    const domainBranch = req.headers["x-branch-name"] || null;
    const account = await findAccountForLogin(username, domainBranch);

    if (!account) {
      return res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
    }

    const branch = account.ChiNhanh; // Lấy trực tiếp từ record SQL
    const passwordOk = await verifyPassword(password, account.MatKhau);
    if (!passwordOk) {
      return res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
    }

    if (!canAccessBranch(account, domainBranch)) {
      return res.status(403).json({ message: "Tài khoản không có quyền truy cập tên miền (chi nhánh) này" });
    }

    if (Number(account.TrangThai) === 0) {
      return res.status(403).json({ message: "Tài khoản đang bị khóa" });
    }

    const user = buildAuthUser(account, branch);
    const token = createAuthToken({
      sub: account.TenDangNhap,
      username: account.TenDangNhap,
      branch: branch,
      employeeId: account.MaNV,
      role: account.Quyen,
      fullName: account.HoTen || null,
      title: account.ChucVu || null,
    });

    res.cookie(TOKEN_COOKIE_NAME, token, cookieOptions());

    return res.json({
      message: "Đăng nhập thành công",
      branch: branch,
      user,
    });
  } catch (error) {
    console.error("[Login Error]", error.message);

    if (error.message.startsWith("ACCESS_DENIED")) {
      return res.status(403).json({ message: error.message.replace("ACCESS_DENIED: ", "") });
    }

    return res.status(500).json({ message: "Hệ thống (Database) đang gặp sự cố kết nối, vui lòng thử lại sau!" });
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



exports.me = [
  requireAuth,
  async (req, res) => {
    return res.json({
      authenticated: true,
      auth: req.auth,
    });
  },
];
