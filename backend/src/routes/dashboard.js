const express = require("express");
const controller = require("../controllers/dashboard-controller");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.get("/branch-dashboard", requireAuth, controller.getBranchDashboard);

module.exports = router;
