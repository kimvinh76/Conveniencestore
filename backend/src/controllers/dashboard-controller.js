const analyticsService = require("../services/analytics-service");
const { normalizeBranch } = require("../config/branches");

exports.getBranchDashboard = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch || branch === "CENTRAL") {
      return res.status(400).json({ message: "branch is required and must be HUE, SAIGON, or HANOI" });
    }
    const data = await analyticsService.getBranchDashboard(branch);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};