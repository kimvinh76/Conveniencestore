const express = require("express");
const controller = require("../controllers/inventory-controller");
const router = express.Router();

router.post("/transfer-stock", controller.transferStock);

module.exports = router;
