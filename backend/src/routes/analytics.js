const express = require("express");
const { normalizeBranch } = require("../config/branches");
const service = require("../services/store-service");

const router = express.Router();

router.get("/revenue/national", async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch) {
      return res.status(400).json({ message: "branch is required" });
    }
    const report = await service.getNationalRevenue(branch);
    return res.json(report);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/analytics/overview", async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch) {
      return res.status(400).json({ message: "branch is required" });
    }
    const sourceBranch = req.query.sourceBranch ? String(req.query.sourceBranch).trim().toUpperCase() : undefined;
    const report = await service.getCentralAnalyticsOverview(branch, sourceBranch);
    return res.json(report);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/all-employees", async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (branch !== "CENTRAL") {
      return res.status(400).json({ message: "branch must be CENTRAL" });
    }
    const rows = await service.listAllEmployeesFromCentral();
    return res.json({ branch, count: rows.length, data: rows });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
