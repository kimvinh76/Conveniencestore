const express = require("express");
const { normalizeBranch, isCentralBranch } = require("../config/branches");
const service = require("../services/store-service");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const branch = req.query.branch ? normalizeBranch(req.query.branch) : "CENTRAL";
    if (!branch) {
      return res.status(400).json({ message: "branch is invalid" });
    }
    const data = await service.listProducts(branch);
    return res.json(data);
  } catch (error) {
    if (String(error.message || "").includes("Login failed")) {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:productCode", async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    const productCode = String(req.params.productCode || "").trim();
    if (!branch || isCentralBranch(branch)) {
      return res.status(400).json({ message: "branch is required and must be HUE, SAIGON, or HANOI" });
    }
    if (!productCode) {
      return res.status(400).json({ message: "productCode is required" });
    }
    const product = await service.getProductByCode(branch, productCode);
    if (!product) {
      return res.status(404).json({ message: `Product ${productCode} not found in ${branch}` });
    }
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const branch = normalizeBranch(req.body?.branch || req.query?.branch);
    if (!branch || !isCentralBranch(branch)) {
      return res.status(403).json({ message: "Only CENTRAL can create products" });
    }
    const payload = { productCode: req.body.productCode, productName: req.body.productName, unitPrice: req.body.unitPrice };
    if (!payload.productCode) {
      return res.status(400).json({ message: "productCode is required" });
    }
    const data = await service.createProduct(payload);
    return res.status(201).json({ message: "Product created", data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:productCode", async (req, res) => {
  try {
    const branch = normalizeBranch(req.body?.branch || req.query?.branch);
    if (!branch || !isCentralBranch(branch)) {
      return res.status(403).json({ message: "Only CENTRAL can update products" });
    }
    const code = req.params.productCode;
    const payload = { productName: req.body.productName, unitPrice: req.body.unitPrice };
    const data = await service.updateProduct(code, payload);
    return res.json({ message: "Product updated", data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/:productCode", async (req, res) => {
  try {
    const branch = normalizeBranch(req.body?.branch || req.query?.branch);
    if (!branch || !isCentralBranch(branch)) {
      return res.status(403).json({ message: "Only CENTRAL can delete products" });
    }
    const code = req.params.productCode;
    const data = await service.deleteProduct(code);
    return res.json({ message: "Product deleted", data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
