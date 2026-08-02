const inventoryService = require("../services/inventory-service");
const { normalizeBranch } = require("../config/branches");

exports.listInventory = async (req, res) => {
  try {

    const branch = normalizeBranch(req.query.branch);
    if (!branch) {
      console.log("normalizeBranch returned null for:", req.query.branch);
      return res.status(400).json({ message: "branch is required" });
    }
    if (req.auth?.role !== "ADMIN_TOAN_BO" && req.auth?.branch !== branch) {
      return res.status(403).json({ message: "Lỗi bảo mật: Bạn không có quyền xem tồn kho của chi nhánh khác!" });
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
      nguoiChuyen: req.auth?.username || "SYSTEM"
    };
    if (payload.fromBranch === payload.toBranch) {
      return res.status(400).json({ message: "Source and destination must be different" });
    }
    const result = await inventoryService.transferStockDistributed(payload);
    res.json(result);
  } catch (error) {
    if (error.number && error.number >= 50000) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Lỗi hệ thống không xác định" });
  }
};