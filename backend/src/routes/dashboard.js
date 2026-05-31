const express = require("express");
const { normalizeBranch, isCentralBranch } = require("../config/branches");
const service = require("../services/store-service");

const router = express.Router();

router.get("/branch-dashboard", async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch || isCentralBranch(branch)) {
      return res.status(400).json({ message: "branch is required and must be HUE, SAIGON, or HANOI" });
    }
    const data = await service.getBranchDashboard(branch);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
