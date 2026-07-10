const service = require("../services/supplier-service");

class SupplierController {
  async listSuppliers(req, res) {
    try {
      const branch = req.query.branch || req.auth.branch || req.auth.chiNhanh;
      if (!branch) {
        return res.status(400).json({ message: "Thiếu thông tin chi nhánh" });
      }
      const data = await service.listSuppliers(branch);
      return res.json(data);
    } catch (error) {
      console.error("[SupplierController.listSuppliers] Error:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  async getSupplier(req, res) {
    try {
      const branch = req.query.branch || req.auth.branch || req.auth.chiNhanh;
      if (!branch) {
        return res.status(400).json({ message: "Thiếu thông tin chi nhánh" });
      }
      const supplier = await service.getSupplier(branch, req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: "Không tìm thấy nhà cung cấp" });
      }
      return res.json(supplier);
    } catch (error) {
      console.error("[SupplierController.getSupplier] Error:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  async createSupplier(req, res) {
    try {
      const branch = req.body.branch || req.auth.branch || req.auth.chiNhanh;
      const { maNCC, tenNCC, dienThoai, diaChi, email } = req.body;

      if (!branch) {
        return res.status(400).json({ message: "Thiếu thông tin chi nhánh" });
      }
      if (!maNCC || !tenNCC) {
        return res.status(400).json({ message: "Mã và Tên nhà cung cấp là bắt buộc" });
      }

      const result = await service.createSupplier(branch, { maNCC, tenNCC, dienThoai, diaChi, email });
      return res.status(201).json(result);
    } catch (error) {
      console.error("[SupplierController.createSupplier] Error:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  async updateSupplier(req, res) {
    try {
      const branch = req.body.branch || req.auth.branch || req.auth.chiNhanh;
      const { tenNCC, dienThoai, diaChi, email } = req.body;

      if (!branch) {
        return res.status(400).json({ message: "Thiếu thông tin chi nhánh" });
      }
      if (!tenNCC) {
        return res.status(400).json({ message: "Tên nhà cung cấp là bắt buộc" });
      }

      const result = await service.updateSupplier(branch, req.params.id, { tenNCC, dienThoai, diaChi, email });
      return res.json(result);
    } catch (error) {
      console.error("[SupplierController.updateSupplier] Error:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  async deleteSupplier(req, res) {
    try {
      const branch = req.query.branch || req.auth.branch || req.auth.chiNhanh;
      if (!branch) {
        return res.status(400).json({ message: "Thiếu thông tin chi nhánh" });
      }
      const result = await service.deleteSupplier(branch, req.params.id);
      return res.json(result);
    } catch (error) {
      console.error("[SupplierController.deleteSupplier] Error:", error);
      return res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new SupplierController();
