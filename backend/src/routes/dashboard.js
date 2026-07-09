const express = require("express");
const controller = require("../controllers/dashboard-controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

router.get("/branch-dashboard", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.getBranchDashboard);

module.exports = router;
