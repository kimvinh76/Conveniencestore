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
    res.status(500).json({ message: error.message });
  }
};

exports.updateAccount = [requireRole("ADMIN_TOAN_BO"), async (req, res) => {
  try {
    const { username } = req.params;
    const { TrangThai } = req.body;

    // Chú ý: Backend hiện tại KHÔNG cho phép sửa Quyền bằng API này nữa.
    // Quyền được đồng bộ hoàn toàn tự động từ Chức vụ (qua DB Trigger / SP).
    const data = await accountService.updateAccount(username, { TrangThai }, req.auth);
    res.json({ message: "Account status updated", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}];

exports.lockAccount = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    const data = await accountService.lockAccount(username, branch);
    res.json({ message: "Account locked", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    const newPassword = "123456aA@";

    const data = await accountService.resetPassword(username, newPassword, branch);
    res.json({ message: "Password reset successfully", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ========== BRANCH APIs (ADMIN_CHI_NHANH) ==========

exports.listAccountsByBranch = async (req, res) => {
  try {
    const { branch } = req.query;
    if (!branch) return res.status(400).json({ message: "branch is required" });

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
    res.status(500).json({ message: error.message });
  }
};

exports.lockAccountLocal = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    const data = await accountService.lockAccountLocal(username, branch);
    res.json({ message: "Account locked locally", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unlockAccountLocal = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    const data = await accountService.unlockAccountLocal(username, branch);
    res.json({ message: "Account unlocked locally", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPasswordLocal = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) {
      return res.status(400).json({ message: "branch is required" });
    }

    const newPassword = "123456aA@";
    const data = await accountService.resetPasswordLocal(username, newPassword, branch);
    res.json({ message: "Password reset successfully (Local)", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
};

exports.updateOwnProfile = async (req, res) => {
  try {
    const { fullName } = req.body;
    const username = req.auth?.username || req.auth?.sub;

    if (!username) return res.status(401).json({ message: "Unauthorized" });
    const result = await accountService.updateOwnProfile(username, { fullName });
    res.json({ message: "Profile updated successfully", data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};