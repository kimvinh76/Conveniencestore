const express = require("express");
const controller = require("../controllers/inventory-controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

router.post("/transfer-stock", requireAuth, requireRole("ADMIN_TOAN_BO"), controller.transferStock);

module.exports = router;
