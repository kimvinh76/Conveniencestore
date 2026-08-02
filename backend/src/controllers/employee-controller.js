const employeeService = require("../services/employee-service");
const { normalizeBranch } = require("../config/branches");

exports.listEmployees = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch) return res.status(400).json({ message: "branch is required" });

    // Lỗi bảo mật: Chặn Admin chi nhánh thao tác trên chi nhánh khác
    if (req.auth?.role !== "ADMIN_TOAN_BO" && req.auth?.branch !== branch) {
      return res.status(403).json({ message: "Lỗi bảo mật: Admin chi nhánh không được thao tác trên chi nhánh khác!" });
    }

    const rows = await employeeService.listEmployeesByBranch(branch);
    res.json({ branch, count: rows.length, data: rows });
  } catch (error) {
    if (error.number && error.number >= 50000) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};

exports.listAllEmployees = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (branch !== "CENTRAL") return res.status(400).json({ message: "branch must be CENTRAL" });
    const rows = await employeeService.listAllEmployeesFromCentral();
    res.json({ branch, count: rows.length, data: rows });
  } catch (error) {
    if (error.number && error.number >= 50000) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch) return res.status(400).json({ message: "Valid branch in query string is required" });
    
    if (req.auth?.role !== "ADMIN_TOAN_BO" && req.auth?.branch !== branch) {
      return res.status(403).json({ message: "Lỗi bảo mật: Admin chi nhánh không được thao tác trên chi nhánh khác!" });
    }

    const MaNV = req.body.MaNV ? String(req.body.MaNV).trim() : "";
    const HoTen = req.body.HoTen ? String(req.body.HoTen).trim() : "";
    const ChucVu = req.body.ChucVu ? String(req.body.ChucVu).trim() : "";
    const Email = req.body.Email ? String(req.body.Email).trim() : "";

    if (!MaNV) {
      return res.status(400).json({ message: "Mã nhân viên không được để trống" });
    }
    if (!HoTen) {
      return res.status(400).json({ message: "Họ tên không được để trống" });
    }
    const validTitles = ["Quản trị hệ thống", "Quản lý chi nhánh", "Nhân viên bán hàng", "Nhân viên kho"];
    const branchAdminAllowedTitles = ["Nhân viên bán hàng", "Nhân viên kho"];

    if (!ChucVu) {
      return res.status(400).json({ message: "Chức vụ không được để trống" });
    }
    if (!validTitles.includes(ChucVu)) {
      return res.status(400).json({ message: `Chức vụ không hợp lệ. Phải là một trong: ${validTitles.join(", ")}` });
    }
    if (req.auth?.role === "ADMIN_CHI_NHANH" && !branchAdminAllowedTitles.includes(ChucVu)) {
      return res.status(403).json({ message: "Quản lý chi nhánh chỉ được cấp quyền Nhân viên bán hàng hoặc Nhân viên kho" });
    }
    if (Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email)) {
      return res.status(400).json({ message: "Định dạng email không hợp lệ" });
    }

    const payload = {
      MaNV,
      HoTen,
      ChucVu,
      Email: Email || null
    };
    
    const data = await employeeService.createEmployee(branch, payload);
    res.status(201).json({ message: "Employee created", data });
  } catch (error) {
    if (error.number && error.number >= 50000) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch) return res.status(400).json({ message: "Valid branch in query string is required" });

    if (req.auth?.role !== "ADMIN_TOAN_BO" && req.auth?.branch !== branch) {
      return res.status(403).json({ message: "Lỗi bảo mật: Admin chi nhánh không được thao tác trên chi nhánh khác!" });
    }

    const { employeeId } = req.params;

    const HoTen = req.body.HoTen !== undefined ? String(req.body.HoTen).trim() : undefined;
    const ChucVu = req.body.ChucVu !== undefined ? String(req.body.ChucVu).trim() : undefined;
    const Email = req.body.Email !== undefined ? String(req.body.Email).trim() : undefined;

    // Chặn rỗng (nếu truyền lên mà chỉ có dấu cách/rỗng)
    if (HoTen === "") {
      return res.status(400).json({ message: "Họ tên không được để trống" });
    }
    const validTitles = ["Quản trị hệ thống", "Quản lý chi nhánh", "Nhân viên bán hàng", "Nhân viên kho"];
    const branchAdminAllowedTitles = ["Nhân viên bán hàng", "Nhân viên kho"];

    if (ChucVu === "") {
      return res.status(400).json({ message: "Chức vụ không được để trống" });
    }
    if (ChucVu !== undefined) {
      if (!validTitles.includes(ChucVu)) {
        return res.status(400).json({ message: `Chức vụ không hợp lệ. Phải là một trong: ${validTitles.join(", ")}` });
      }
      if (req.auth?.role === "ADMIN_CHI_NHANH" && !branchAdminAllowedTitles.includes(ChucVu)) {
        return res.status(403).json({ message: "Quản lý chi nhánh chỉ được cấp quyền Nhân viên bán hàng hoặc Nhân viên kho" });
      }
    }
    if (Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email)) {
      return res.status(400).json({ message: "Định dạng email không hợp lệ" });
    }

    const payload = {
      HoTen,
      ChucVu,
      Email
    };
    
    const data = await employeeService.updateEmployee(branch, employeeId, payload);
    res.json({ message: "Employee updated", data });
  } catch (error) {
    if (error.number && error.number >= 50000) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch) return res.status(400).json({ message: "Valid branch in query string is required" });

    if (req.auth?.role !== "ADMIN_TOAN_BO" && req.auth?.branch !== branch) {
      return res.status(403).json({ message: "Lỗi bảo mật: Admin chi nhánh không được thao tác trên chi nhánh khác!" });
    }

    const { employeeId } = req.params;
    const data = await employeeService.deleteEmployee(branch, employeeId);
    res.json({ message: "Employee deleted", data });
  } catch (error) {
    if (
      error.message.includes("not found") || 
      error.message.includes("không tìm thấy") || 
      (error.number && error.number >= 50000)
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};
