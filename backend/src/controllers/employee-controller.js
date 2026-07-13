const employeeService = require("../services/employee-service");
const { normalizeBranch } = require("../config/branches");

exports.listEmployees = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch) return res.status(400).json({ message: "branch is required" });
    const rows = await employeeService.listEmployeesByBranch(branch);
    res.json({ branch, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch) return res.status(400).json({ message: "Valid branch in query string is required" });
    
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
    res.status(500).json({ message: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch) return res.status(400).json({ message: "Valid branch in query string is required" });
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
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch) return res.status(400).json({ message: "Valid branch in query string is required" });
    const { employeeId } = req.params;
    const data = await employeeService.deleteEmployee(branch, employeeId);
    res.json({ message: "Employee deleted", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
