const express = require("express");
const controller = require("../controllers/account-controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// ========== CENTRAL APIs (ADMIN_TOAN_BO) ==========
router.get("/central", requireAuth, requireRole("ADMIN_TOAN_BO"), controller.listAllAccounts);
router.post("/central", requireAuth, requireRole("ADMIN_TOAN_BO"), controller.createAccount);
router.patch("/central/:username/lock", requireAuth, requireRole("ADMIN_TOAN_BO"), controller.lockAccount);
router.patch("/central/:username/unlock", requireAuth, requireRole("ADMIN_TOAN_BO"), controller.unlockAccount);
router.patch("/central/:username/reset-password", requireAuth, requireRole("ADMIN_TOAN_BO"), controller.resetPassword);
// ========== BRANCH APIs (ADMIN_CHI_NHANH) ==========
router.get("/branch", requireAuth, requireRole("ADMIN_CHI_NHANH", "ADMIN_TOAN_BO"), controller.listAccountsByBranch);
router.post("/branch", requireAuth, requireRole("ADMIN_CHI_NHANH"), controller.createBranchAccount);
router.patch("/branch/:username/lock", requireAuth, requireRole("ADMIN_CHI_NHANH"), controller.lockAccountLocal);
router.patch("/branch/:username/unlock", requireAuth, requireRole("ADMIN_CHI_NHANH"), controller.unlockAccountLocal);
router.patch("/branch/:username/reset-password", requireAuth, requireRole("ADMIN_CHI_NHANH"), controller.resetPasswordLocal);

// ========== PERSONAL API (NHAN_VIEN - ai cũng dùng được) ==========
router.patch("/change-password", requireAuth, controller.changeOwnPassword);




module.exports = router;