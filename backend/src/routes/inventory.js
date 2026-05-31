const express = require("express");
const { normalizeBranch, isCentralBranch } = require("../config/branches");
const service = require("../services/store-service");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    const productCode = req.query.productCode ? String(req.query.productCode).trim() : "";
    if (!branch || isCentralBranch(branch)) {
      return res.status(400).json({ message: "branch is required and must be HUE, SAIGON, or HANOI" });
    }
    const result = await service.listInventory(branch, productCode);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:productCode", async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    const productCode = String(req.params.productCode || "").trim();
    const quantity = Number(req.body.quantity || 0);
    if (!branch || isCentralBranch(branch)) {
      return res.status(400).json({ message: "branch is required and must be HUE, SAIGON, or HANOI" });
    }
    if (!productCode || quantity < 0) {
      return res.status(400).json({ message: "productCode is required and quantity must be >= 0" });
    }
    const data = await service.updateInventoryItem(branch, productCode, quantity);
    return res.json({ message: "Inventory updated", data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
