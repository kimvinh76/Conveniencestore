const express = require("express");
const controller = require("../controllers/product-controller");
const router = express.Router();

router.get("/", controller.getAllProducts);
router.get("/:productCode", controller.getProduct);
router.post("/", controller.createProduct);
router.put("/:productCode", controller.updateProduct);
router.delete("/:productCode", controller.deleteProduct);

module.exports = router;
