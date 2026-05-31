const express = require("express");
const { normalizeBranch, isCentralBranch } = require("../config/branches");
const service = require("../services/store-service");

const router = express.Router();

router.post("/transfer-stock", async (req, res) => {
  try {
    const branch = normalizeBranch(req.body.branch);
    if (!branch || !isCentralBranch(branch)) {
      return res.status(400).json({ message: "branch must be CENTRAL" });
    }
    const payload = {
      fromBranch: normalizeBranch(req.body.fromBranch),
      toBranch: normalizeBranch(req.body.toBranch),
      productCode: String(req.body.productCode || "").trim(),
      quantity: Number(req.body.quantity || 0),
    };
    if (!payload.fromBranch || !payload.toBranch || isCentralBranch(payload.fromBranch) || isCentralBranch(payload.toBranch)) {
      return res.status(400).json({ message: "fromBranch and toBranch are required and must be HUE/SAIGON/HANOI" });
    }
    if (payload.fromBranch === payload.toBranch) {
      return res.status(400).json({ message: "fromBranch and toBranch must be different" });
    }
    if (!payload.productCode || payload.quantity <= 0) {
      return res.status(400).json({ message: "productCode and positive quantity are required" });
    }
    const result = await service.transferStockDistributed(payload);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
