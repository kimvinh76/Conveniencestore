const express = require("express");
const controller = require("../controllers/inventory-controller");
const router = express.Router();

router.get("/", controller.listInventory);
router.put("/:productCode", controller.updateInventory);

module.exports = router;
