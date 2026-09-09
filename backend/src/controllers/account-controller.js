const accountService = require("../services/account-service");

const DEFAULT_RESET_PASSWORD = process.env.DEFAULT_RESET_PASSWORD || "123456";

// ========== HELPER: Xử lý lỗi SP + lỗi nghiệp vụ ==========

function handleAccountError(res, error) {
  // Lỗi bảo mật từ SP (THROW 50003 — chặn khóa Admin)
  if (error.number === 50003) {
    return res.status(403).json({ message: error.message });
  }
  // Lỗi nghiệp vụ khác từ SP (THROW 50000, 50001, 50002...)
  if (error.number && error.number >= 50000) {
    return res.status(400).json({ message: error.message });
  }
  // Lỗi nghiệp vụ từ Service (có statusCode)
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  // Lỗi hệ thống (đứt mạng, sập DB...)
  res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
}

// ========== CENTRAL APIs (ADMIN_TOAN_BO) ==========

exports.listAllAccounts = async (_req, res) => {
  try {
    const data = await accountService.listAllAccountsFromCentral();
    res.json({ count: data.length, data });
  } catch (error) {
    handleAccountError(res, error);
  }
};

exports.createAccount = async (req, res) => {
  try {
    const { TenDangNhap, MatKhau, MaNV, TrangThai } = req.body;

    if (!TenDangNhap || !MatKhau || !MaNV) {
      return res.status(400).json({ message: "TenDangNhap, MatKhau, MaNV are required" });
    }

    // Bảo mật: Chặn hành vi cố tình truyền trường "Quyen" để ép quyền
    if (req.body.Quyen) {
      return res.status(403).json({ message: "Cảnh báo bảo mật: Bạn không được phép tự chỉ định Quyền! Hệ thống sẽ tự động cấp quyền dựa trên chức vụ nhân viên." });
    }

    // Delegate toàn bộ cho Service (resolve NV → map role → tạo account → sync branch)
    // Admin Toàn bộ không truyền targetBranch → Service tìm trên tất cả node
    const data = await accountService.createAccount({ TenDangNhap, MatKhau, MaNV, TrangThai });
    res.status(201).json({ message: `Tạo tài khoản thành công với quyền: ${data.Quyen}`, data });
  } catch (error) {
    handleAccountError(res, error);
  }
};

exports.lockAccount = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    // Delegate cho Service — SP sẽ THROW 50003 nếu là tài khoản Admin
    const data = await accountService.lockAccount(username, branch);
    res.json({ message: "Khóa tài khoản thành công", data });
  } catch (error) {
    handleAccountError(res, error);
  }
};

exports.unlockAccount = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    const data = await accountService.unlockAccount(username, branch);
    res.json({ message: "Mở khóa tài khoản thành công", data });
  } catch (error) {
    handleAccountError(res, error);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    const data = await accountService.resetPassword(username, DEFAULT_RESET_PASSWORD, branch);
    res.json({ message: "Reset mật khẩu thành công", data });
  } catch (error) {
    handleAccountError(res, error);
  }
};


// ========== BRANCH APIs (ADMIN_CHI_NHANH) ==========

exports.listAccountsByBranch = async (req, res) => {
  try {
    const { branch } = req.query;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    // Bảo mật phân tán: Admin Chi Nhánh chỉ được xem danh sách chi nhánh mình
    // ADMIN_TOAN_BO được phép xem tất cả
    if (req.auth.role !== "ADMIN_TOAN_BO" && req.auth.branch !== branch) {
      return res.status(403).json({ message: "Lỗi bảo mật: Admin chi nhánh không được xem tài khoản của chi nhánh khác!" });
    }

    const data = await accountService.listAccountsByBranch(branch);
    res.json({ branch, count: data.length, data });
  } catch (error) {
    handleAccountError(res, error);
  }
};

exports.createBranchAccount = async (req, res) => {
  try {
    const { TenDangNhap, MatKhau, MaNV, ChiNhanh } = req.body;
    if (!TenDangNhap || !MatKhau || !MaNV || !ChiNhanh) {
      return res.status(400).json({ message: "TenDangNhap, MatKhau, MaNV, ChiNhanh are required" });
    }

    // Bảo mật: Chặn hành vi cố tình truyền trường "Quyen" để hack quyền
    if (req.body.Quyen) {
      return res.status(403).json({ message: "Cảnh báo bảo mật: Bạn không được phép tự chỉ định Quyền! Hệ thống sẽ tự động cấp quyền dựa trên chức vụ nhân viên." });
    }

    // Bảo mật phân tán: Admin chi nhánh không được phép tạo tài khoản cho chi nhánh khác
    if (req.auth.branch !== ChiNhanh) {
      return res.status(403).json({ message: "Lỗi bảo mật: Bạn không có quyền tạo tài khoản cho nhân viên của chi nhánh khác!" });
    }

    // Delegate cho Service — truyền targetBranch để chỉ lookup NV ở chi nhánh này
    const data = await accountService.createAccount({
      TenDangNhap,
      MatKhau,
      MaNV,
      TrangThai: 1,
      targetBranch: ChiNhanh
    });

    res.status(201).json({ message: `Tạo tài khoản chi nhánh thành công với quyền: ${data.Quyen}`, data });
  } catch (error) {
    handleAccountError(res, error);
  }
};

exports.lockAccountLocal = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    // Bảo mật: Admin Chi nhánh chỉ thao tác trên chi nhánh mình
    if (req.auth.branch !== branch) {
      return res.status(403).json({ message: "Lỗi bảo mật: Không có quyền thao tác tài khoản của chi nhánh khác!" });
    }

    const data = await accountService.lockAccount(username, branch);
    res.json({ message: "Khóa tài khoản thành công", data });
  } catch (error) {
    handleAccountError(res, error);
  }
};

exports.unlockAccountLocal = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    if (req.auth.branch !== branch) {
      return res.status(403).json({ message: "Lỗi bảo mật: Không có quyền thao tác tài khoản của chi nhánh khác!" });
    }

    const data = await accountService.unlockAccount(username, branch);
    res.json({ message: "Mở khóa tài khoản thành công", data });
  } catch (error) {
    handleAccountError(res, error);
  }
};

exports.resetPasswordLocal = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    if (req.auth.branch !== branch) {
      return res.status(403).json({ message: "Lỗi bảo mật: Không có quyền thao tác tài khoản của chi nhánh khác!" });
    }

    const data = await accountService.resetPassword(username, DEFAULT_RESET_PASSWORD, branch);
    res.json({ message: "Reset mật khẩu thành công", data });
  } catch (error) {
    handleAccountError(res, error);
  }
};


// ========== PERSONAL APIs (NHAN_VIEN) ==========

exports.changeOwnPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const username = req.auth?.username || req.auth?.sub;

    if (!username) return res.status(401).json({ message: "Unauthorized" });
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "oldPassword và newPassword là bắt buộc" });
    }

    const result = await accountService.changeOwnPassword(username, oldPassword, newPassword);
    res.json(result);
  } catch (error) {
    handleAccountError(res, error);
  }
};
