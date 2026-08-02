const productService = require("../services/product-service");
const { normalizeBranch } = require("../config/branches");

exports.getAllProducts = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch || "CENTRAL");
    if (req.auth?.role !== "ADMIN_TOAN_BO" && req.auth?.branch !== branch) {
      return res.status(403).json({ message: "Lỗi bảo mật: Bạn không có quyền xem dữ liệu của chi nhánh khác!" });
    }
    const data = await productService.listProducts(branch);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch || "CENTRAL");
    if (req.auth?.role !== "ADMIN_TOAN_BO" && req.auth?.branch !== branch) {
      return res.status(403).json({ message: "Lỗi bảo mật: Bạn không có quyền xem dữ liệu của chi nhánh khác!" });
    }
    const product = await productService.getProductByCode(branch, req.params.productCode);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const data = await productService.createProduct(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const data = await productService.updateProduct(req.params.productCode, req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa exports.deleteProduct

exports.toggleStatus = async (req, res) => {
  try {
    if (typeof req.body.active !== 'boolean') {
      return res.status(400).json({ message: "Trường 'active' phải là kiểu boolean (true/false)" });
    }
    const data = await productService.toggleProductStatus(req.params.productCode, req.body.active);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};