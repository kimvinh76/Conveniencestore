const express = require("express");
const controller = require("../controllers/dashboard-controller");
const router = express.Router();

router.get("/branch-dashboard", controller.getBranchDashboard);

module.exports = router;
