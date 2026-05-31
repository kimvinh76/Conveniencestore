const analyticsService = require("../services/analytics-service");
const employeeService = require("../services/employee-service");
const { normalizeBranch } = require("../config/branches");

exports.getNationalRevenue = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    const report = await analyticsService.getNationalRevenue(branch);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    const report = await analyticsService.getCentralAnalyticsOverview(branch);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listAllEmployees = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (branch !== "CENTRAL") return res.status(400).json({ message: "branch must be CENTRAL" });
    const rows = await employeeService.listAllEmployeesFromCentral();
    res.json({ branch, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};