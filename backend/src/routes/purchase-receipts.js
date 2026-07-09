const express = require("express");
const router = express.Router();
const controller = require("../controllers/purchase-receipts-controller");
const { requireAuth, requireRole } = require("../middleware/auth");

// Chỉ cho phép ADMIN_CHI_NHANH hoặc ADMIN_TOAN_BO được truy cập chức năng nhập hàng
router.get("/", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.listReceipts);
router.get("/:id", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.getReceiptDetails);
router.post("/", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.createReceipt);

module.exports = router;
