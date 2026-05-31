const productService = require("../services/product-service");
const { normalizeBranch } = require("../config/branches");

exports.getAllProducts = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch || "CENTRAL");
    const data = await productService.listProducts(branch);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
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

exports.deleteProduct = async (req, res) => {
  try {
    const data = await productService.deleteProduct(req.params.productCode);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};