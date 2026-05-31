const express = require("express");
const controller = require("../controllers/analytics-controller");
const router = express.Router();

router.get("/revenue/national", controller.getNationalRevenue);
router.get("/analytics/overview", controller.getOverview);
router.get("/all-employees", controller.listAllEmployees);

module.exports = router;
