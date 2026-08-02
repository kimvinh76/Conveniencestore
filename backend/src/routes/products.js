const express = require("express");
const controller = require("../controllers/product-controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

// Bất kỳ ai đăng nhập (requireAuth) cũng có thể XEM danh sách sản phẩm để bán hàng
router.get("/", requireAuth, controller.getAllProducts);
router.get("/:productCode", requireAuth, controller.getProduct);

// NHƯNG CHỈ Admin Tổng mới được THÊM/SỬA/XÓA sản phẩm (Nhân bản toàn phần)
router.post("/", requireAuth, requireRole("ADMIN_TOAN_BO"), controller.createProduct);
router.put("/:productCode", requireAuth, requireRole("ADMIN_TOAN_BO"), controller.updateProduct);
router.patch("/:productCode/status", requireAuth, requireRole("ADMIN_TOAN_BO"), controller.toggleStatus);

module.exports = router;
