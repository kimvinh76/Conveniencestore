const express = require("express");
const controller = require("../controllers/employee-controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

// Chỉ quản lý/admin mới được phép xem danh sách nhân viên đầy đủ
router.get("/", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.listEmployees);

// API riêng cho Central để load toàn bộ danh sách
router.get("/all", requireAuth, requireRole("ADMIN_TOAN_BO"), controller.listAllEmployees);


router.post("/", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.createEmployee);
router.put("/:employeeId", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.updateEmployee);
router.delete("/:employeeId", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.deleteEmployee);

module.exports = router;
