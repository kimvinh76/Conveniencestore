const accountService = require("../services/account-service");
const { getPool, sql } = require("../db/sqlserver");
const { requireRole } = require("../middleware/auth");

// ========== CENTRAL APIs (ADMIN_TOAN_BO) ==========

exports.listAllAccounts = async (_req, res) => {
  try {
    const data = await accountService.listAllAccountsFromCentral();
    res.json({ count: data.length, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const { TenDangNhap, MatKhau, MaNV, TrangThai } = req.body;

    if (!TenDangNhap || !MatKhau || !MaNV) {
      return res.status(400).json({ message: "TenDangNhap, MatKhau, MaNV are required" });
    }

    // Bảo mật: Chặn đứng hành vi cố tình truyền thêm trường "Quyen" để ép quyền
    if (req.body.Quyen) {
      return res.status(403).json({ message: "Cảnh báo bảo mật: Bạn không được phép tự chỉ định Quyền! Hệ thống sẽ tự động cấp quyền dựa trên chức vụ nhân viên." });
    }

    // Lấy chức vụ từ DB Central để tự động gán Quyền
    const pool = await getPool("CENTRAL");
    const empResult = await pool.request().input("MaNV", sql.VarChar(50), MaNV).query("SELECT ChucVu FROM dbo.NhanVien WHERE MaNV = @MaNV");

    let assignedRole = "NHAN_VIEN";
    if (empResult.recordset.length > 0) {
      const title = empResult.recordset[0].ChucVu;
      if (title === "Quản trị hệ thống") assignedRole = "ADMIN_TOAN_BO";
      if (title === "Quản lý chi nhánh") assignedRole = "ADMIN_CHI_NHANH";
    }

    // ADMIN_TOAN_BO được quyền tạo bất kỳ quyền nào, hệ thống tự ánh xạ
    const data = await accountService.createAccount({ TenDangNhap, MatKhau, MaNV, Quyen: assignedRole, TrangThai });
    res.status(201).json({ message: `Account created with auto-mapped role ${assignedRole}`, data });
  } catch (error) {
    // Bắt lỗi Custom ném ra từ Stored Procedure (THROW 50000, 50001, 50002, 50003...)
    if (error.number && error.number >= 50000) {
      // Đẩy nguyên văn câu chửi bằng tiếng Việt của SQL lên cho Frontend
      return res.status(400).json({ message: error.message });
    }

    // Nếu không phải lỗi nghiệp vụ 50000, mà là lỗi hệ thống (như đứt mạng, sập DB) thì mới văng 500
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};



exports.lockAccount = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    const data = await accountService.lockAccount(username, branch);
    res.json({ message: "Account locked", data });
  } catch (error) {
    if (error.number && error.number >= 50000) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};

exports.unlockAccount = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    const data = await accountService.unlockAccount(username, branch);
    res.json({ message: "Account unlocked", data });
  } catch (error) {
    if (error.number && error.number >= 50000) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) {
      return res.status(400).json({ message: "branch is required" });
    }

    // Force default password
    const newPassword = "123456";

    const data = await accountService.resetPassword(username, newPassword, branch);
    res.json({ message: "Password reset successfully", data });
  } catch (error) {
    if (error.number && error.number >= 50000) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};


// ========== BRANCH APIs (ADMIN_CHI_NHANH) ==========

exports.listAccountsByBranch = async (req, res) => {
  try {
    const { branch } = req.query;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    // Bảo mật phân tán: Admin Chi Nhánh chỉ được xem danh sách của chính chi nhánh mình
    // ADMIN_TOAN_BO thì được phép xem thoải mái tất cả các nhánh
    if (req.auth.role !== "ADMIN_TOAN_BO" && req.auth.branch !== branch) {
      return res.status(403).json({ message: "Lỗi bảo mật: Admin chi nhánh không được xem tài khoản của chi nhánh khác!" });
    }

    const data = await accountService.listAccountsByBranch(branch);
    res.json({ branch, count: data.length, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBranchAccount = async (req, res) => {
  try {
    const { TenDangNhap, MatKhau, MaNV, ChiNhanh } = req.body;
    if (!TenDangNhap || !MatKhau || !MaNV || !ChiNhanh) {
      return res.status(400).json({ message: "TenDangNhap, MatKhau, MaNV, ChiNhanh are required" });
    }

    // Bảo mật: Chặn đứng hành vi cố tình truyền thêm trường "Quyen" để hack quyền
    if (req.body.Quyen) {
      return res.status(403).json({ message: "Cảnh báo bảo mật: Bạn không được phép tự chỉ định Quyền! Hệ thống sẽ tự động cấp quyền dựa trên chức vụ nhân viên." });
    }

    // Bảo mật phân tán: Admin chi nhánh không được phép tạo tài khoản cho chi nhánh khác
    if (req.auth.branch !== ChiNhanh) {
      return res.status(403).json({ message: "Lỗi bảo mật: Bạn không có quyền tạo tài khoản cho nhân viên của chi nhánh khác!" });
    }

    // Lấy chức vụ của nhân viên từ CSDL để tự động gán quyền
    const pool = await getPool(ChiNhanh);
    const empResult = await pool.request()
      .input("MaNV", sql.VarChar(50), MaNV)
      .query("SELECT ChucVu FROM dbo.NhanVien WHERE MaNV = @MaNV");

    let assignedRole = "NHAN_VIEN";
    if (empResult.recordset.length > 0) {
      const title = empResult.recordset[0].ChucVu;
      if (title === "Quản lý chi nhánh") {
        assignedRole = "ADMIN_CHI_NHANH";
      }
    }

    const data = await accountService.createAccount({
      TenDangNhap,
      MatKhau,
      MaNV,
      Quyen: assignedRole,
      TrangThai: 1
    });

    res.status(201).json({ message: `Branch account created with role ${assignedRole}`, data });
  } catch (error) {
    // Bắt lỗi Custom ném ra từ Stored Procedure (THROW 50000...)
    if (error.number && error.number >= 50000) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};
exports.lockAccountLocal = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    // Bảo mật: Đảm bảo Admin Chi nhánh chỉ thao tác trên chi nhánh của họ
    if (req.auth.branch !== branch) {
      return res.status(403).json({ message: "Permission denied: Cannot modify accounts of another branch" });
    }

    // Chuyển sang dùng hàm Central vì Central quản lý Login (SSO)
    const data = await accountService.lockAccount(username, branch);
    res.json({ message: "Account locked successfully", data });
  } catch (error) {
    if (error.number && error.number >= 50000) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};

exports.unlockAccountLocal = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    if (req.auth.branch !== branch) {
      return res.status(403).json({ message: "Permission denied: Cannot modify accounts of another branch" });
    }

    const data = await accountService.unlockAccount(username, branch);
    res.json({ message: "Account unlocked successfully", data });
  } catch (error) {
    if (error.number && error.number >= 50000) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};

exports.resetPasswordLocal = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    if (req.auth.branch !== branch) {
      return res.status(403).json({ message: "Permission denied: Cannot modify accounts of another branch" });
    }

    const newPassword = "123456";
    const data = await accountService.resetPassword(username, newPassword, branch);
    res.json({ message: "Password reset successfully", data });
  } catch (error) {
    if (error.number && error.number >= 50000) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};



// ========== PERSONAL APIs (NHAN_VIEN) ==========

exports.changeOwnPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const username = req.auth?.username || req.auth?.sub;

    if (!username) return res.status(401).json({ message: "Unauthorized" });
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "oldPassword and newPassword are required" });
    }

    const result = await accountService.changeOwnPassword(username, oldPassword, newPassword);
    res.json(result);
  } catch (error) {
    if (error.number && error.number >= 50000) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === "Account not found" || error.message === "Old password is incorrect") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};

