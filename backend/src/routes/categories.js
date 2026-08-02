const express = require("express");
const router = express.Router();
const controller = require("../controllers/category-controller");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, controller.listCategories);

module.exports = router;
