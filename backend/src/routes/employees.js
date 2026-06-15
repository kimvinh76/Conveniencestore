const express = require("express");
const controller = require("../controllers/employee-controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

// Mọi người có thể xem danh sách nhân viên trong ca trực
router.get("/", requireAuth, controller.listEmployees);

// Nhân viên không được phép quản lý nhân sự (khóa Create/Update/Delete)
router.post("/", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.createEmployee);
router.put("/:employeeId", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.updateEmployee);
router.delete("/:employeeId", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.deleteEmployee);

module.exports = router;
