const express = require("express");
const router = express.Router();
const controller = require("../controllers/supplier-controller");
const { requireAuth, requireRole } = require("../middleware/auth");



router.get("/", requireAuth, controller.listSuppliers);
router.get("/:id", requireAuth, controller.getSupplier);
router.post("/", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.createSupplier);
router.put("/:id", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.updateSupplier);
router.delete("/:id", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.deleteSupplier);

module.exports = router;
