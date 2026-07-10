const inventoryService = require("../services/inventory-service");
const { normalizeBranch } = require("../config/branches");

exports.listInventory = async (req, res) => {
  try {

    const branch = normalizeBranch(req.query.branch);
    if (!branch) {
      console.log("normalizeBranch returned null for:", req.query.branch);
      return res.status(400).json({ message: "branch is required" });
    }
    const result = await inventoryService.listInventory(branch);
    res.json(result);
  } catch (error) {
    console.error("listInventory Error:", error);
    res.status(500).json({ message: error.message });
  }
};



exports.transferStock = async (req, res) => {
  try {
    const payload = {
      fromBranch: normalizeBranch(req.body.fromBranch),
      toBranch: normalizeBranch(req.body.toBranch),
      productCode: String(req.body.productCode || "").trim(),
      quantity: Number(req.body.quantity || 0),
    };
    if (payload.fromBranch === payload.toBranch) throw new Error("Source and destination must be different");
    const result = await inventoryService.transferStockDistributed(payload);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};