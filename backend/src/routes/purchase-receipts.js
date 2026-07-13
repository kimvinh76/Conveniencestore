const express = require("express");
const router = express.Router();
const controller = require("../controllers/purchase-receipts-controller");
const { requireAuth, requirePermission } = require("../middleware/auth");

// Cho phép ADMIN hoặc "Nhân viên kho" được thao tác nhập hàng
const canImport = requirePermission(["ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"], ["Nhân viên kho"]);

router.get("/", requireAuth, canImport, controller.listReceipts);
router.get("/:id", requireAuth, canImport, controller.getReceiptDetails);
router.post("/", requireAuth, canImport, controller.createReceipt);

module.exports = router;
