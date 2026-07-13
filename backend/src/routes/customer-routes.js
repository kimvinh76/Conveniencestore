const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer-controller");
const { requireAuth, requireRole } = require("../middleware/auth");

// Tất cả API của khách hàng đều cần đăng nhập
router.use(requireAuth);

// Lấy danh sách hoặc tìm kiếm khách hàng (Thu ngân cần tìm khách)
router.get("/", requireRole("NHAN_VIEN", "ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), customerController.listCustomers);

// Thêm khách hàng mới (Thu ngân làm thẻ thành viên tại quầy)
router.post("/", requireRole("NHAN_VIEN", "ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), customerController.createCustomer);

// Cập nhật thông tin khách hàng (CHỈ Central mới được phép sửa để quản lý tập trung và tránh gian lận)
router.put("/:id", requireRole("ADMIN_TOAN_BO"), customerController.updateCustomer);


module.exports = router;
