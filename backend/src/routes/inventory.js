const express = require("express");
const controller = require("../controllers/inventory-controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

router.get("/", requireAuth, controller.listInventory);
router.put("/:productCode", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.updateInventory);

module.exports = router;
