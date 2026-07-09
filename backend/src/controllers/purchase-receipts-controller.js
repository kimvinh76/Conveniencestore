const service = require("../services/purchase-receipts-service");

class PurchaseReceiptController {
  async listReceipts(req, res) {
    try {
      const branch = req.query.branch || req.auth.branch || req.auth.chiNhanh;
      if (!branch) {
        return res.status(400).json({ message: "Thiếu thông tin chi nhánh" });
      }
      const receipts = await service.getReceipts(branch);
      return res.status(200).json(receipts);
    } catch (error) {
      console.error("[PurchaseReceiptsController.listReceipts] Error:", error);
      return res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

  async getReceiptDetails(req, res) {
    try {
      const branch = req.query.branch || req.auth.branch || req.auth.chiNhanh;
      const maPN = req.params.id;
      if (!branch) {
        return res.status(400).json({ message: "Thiếu thông tin chi nhánh" });
      }
      if (!maPN) {
        return res.status(400).json({ message: "Thiếu mã phiếu nhập" });
      }
      const details = await service.getReceiptDetails(branch, maPN);
      return res.status(200).json(details);
    } catch (error) {
      console.error("[PurchaseReceiptsController.getReceiptDetails] Error:", error);
      return res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

  async createReceipt(req, res) {
    try {
      const branch = req.body.branch || req.auth.branch || req.auth.chiNhanh;
      const { maPN, ghiChu, items } = req.body;

      if (!branch) {
        return res.status(400).json({ message: "Thiếu thông tin chi nhánh" });
      }
      if (!maPN || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Dữ liệu phiếu nhập không hợp lệ" });
      }

      const result = await service.createReceipt(branch, { maPN, ghiChu, items });
      return res.status(201).json(result);
    } catch (error) {
      console.error("[PurchaseReceiptsController.createReceipt] Error:", error);
      return res.status(500).json({ message: error.message || "Internal server error" });
    }
  }
}

module.exports = new PurchaseReceiptController();
