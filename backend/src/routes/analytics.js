const express = require("express");
const controller = require("../controllers/analytics-controller");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.get("/revenue/national", requireAuth, controller.getNationalRevenue);
router.get("/analytics/overview", requireAuth, controller.getOverview);
router.get("/all-employees", requireAuth, controller.listAllEmployees);

module.exports = router;
