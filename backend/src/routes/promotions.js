const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotion-controller");
const { requireAuth, requireRole } = require("../middleware/auth");

// Các API cho Chi nhánh (Thu ngân) và Central -> Ai đăng nhập cũng xem được
router.get("/", requireAuth, promotionController.listPromotions);
router.get("/active", requireAuth, promotionController.listActivePromotions);
router.get("/check/:id", requireAuth, promotionController.checkPromotion);

// Các API chỉ dành cho Admin (Central) -> Phân quyền ADMIN_TOAN_BO
router.post("/", requireAuth, requireRole("ADMIN_TOAN_BO"), promotionController.createPromotion);
router.put("/:id", requireAuth, requireRole("ADMIN_TOAN_BO"), promotionController.updatePromotion);
router.delete("/:id", requireAuth, requireRole("ADMIN_TOAN_BO"), promotionController.deletePromotion);

module.exports = router;
