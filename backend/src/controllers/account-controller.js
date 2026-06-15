const accountService = require("../services/account-service");

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
    const { TenDangNhap, MatKhau, MaNV, Quyen, TrangThai } = req.body;

    if (!TenDangNhap || !MatKhau || !MaNV || !Quyen) {
      return res.status(400).json({ message: "TenDangNhap, MatKhau, MaNV, Quyen are required" });
    }

    // ADMIN_TOAN_BO được quyền tạo bất kỳ quyền nào
    const data = await accountService.createAccount({ TenDangNhap, MatKhau, MaNV, Quyen, TrangThai });
    res.status(201).json({ message: "Account created", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { username } = req.params;
    const { Quyen, TrangThai } = req.body;

    const data = await accountService.updateAccount(username, { Quyen, TrangThai });
    res.json({ message: "Account updated", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const { newPassword, branch } = req.body;
    if (!newPassword || !branch) {
      return res.status(400).json({ message: "newPassword and branch are required" });
    }

    const data = await accountService.resetPassword(username, newPassword, branch);
    res.json({ message: "Password reset successfully", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { username } = req.params;
    const data = await accountService.deleteAccount(username);
    res.json({ message: "Account deleted", data });
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

    // Ép quyền thành NHAN_VIEN - Admin chi nhánh không được tự nâng quyền
    const data = await accountService.createAccount({
      TenDangNhap,
      MatKhau,
      MaNV,
      Quyen: "NHAN_VIEN",
      TrangThai: 1
    });

    res.status(201).json({ message: "Branch account created with role NHAN_VIEN", data });
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

exports.deleteAccountLocal = async (req, res) => {
  try {
    const { username } = req.params;
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ message: "branch is required" });

    const data = await accountService.deleteAccountLocal(username, branch);
    res.json({ message: "Account deleted locally", data });
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