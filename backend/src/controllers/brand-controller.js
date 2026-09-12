const brandService = require("../services/brand-service");

const { normalizeBranch } = require("../config/branches");

exports.listBrands = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch) || "CENTRAL";
    const data = await brandService.listBrands(branch);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
