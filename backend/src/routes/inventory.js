const express = require("express");
const controller = require("../controllers/inventory-controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

router.get("/", requireAuth, controller.listInventory);

module.exports = router;
