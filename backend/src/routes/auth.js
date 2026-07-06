const express = require("express");
const controller = require("../controllers/auth-controller");

const router = express.Router();

router.post("/login", controller.login);
router.post("/logout", controller.logout);
router.post("/forgot-password", controller.forgotPassword);
router.get("/me", controller.me);

module.exports = router;
