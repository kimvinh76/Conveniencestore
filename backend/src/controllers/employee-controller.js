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
    const branch = normalizeBranch(req.body.branch);
    if (!branch) return res.status(400).json({ message: "branch is required" });
    const payload = {
      MaNV: String(req.body.MaNV || "").trim() || null,
      HoTen: String(req.body.HoTen || "").trim(),
      ChucVu: String(req.body.ChucVu || "").trim(),
      Email: req.body.Email ? String(req.body.Email).trim() : null,
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
    const { employeeId } = req.params;
    const payload = {
      HoTen: req.body.HoTen ? String(req.body.HoTen).trim() : null,
      ChucVu: req.body.ChucVu ? String(req.body.ChucVu).trim() : null,
      Email: req.body.Email ? String(req.body.Email).trim() : null,
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
    const { employeeId } = req.params;
    const data = await employeeService.deleteEmployee(branch, employeeId);
    res.json({ message: "Employee deleted", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
