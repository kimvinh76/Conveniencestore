const jwt = require("jsonwebtoken");
const { TOKEN_COOKIE_NAME, TOKEN_SECRET } = require("../services/auth-service");

function getTokenFromRequest(req) {
  const cookieToken = req.cookies ? req.cookies[TOKEN_COOKIE_NAME] : null;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, TOKEN_SECRET);
    req.auth = decoded;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

// Middleware phân quyền theo chức vụ
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // Đảm bảo request đã đi qua requireAuth và có thông tin user
    if (!req.auth || !req.auth.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (allowedRoles.includes(req.auth.role)) {
      return next(); // Cho phép đi tiếp vào Controller
    }

    // Nếu không nằm trong danh sách cho phép -> Chặn lại
    return res.status(403).json({
      message: `Forbidden: Yêu cầu quyền [${allowedRoles.join(', ')}]. Quyền hiện tại của bạn là: ${req.auth.role}`
    });
  };
}

module.exports = {
  requireAuth,
  getTokenFromRequest,
  requireRole,
};
