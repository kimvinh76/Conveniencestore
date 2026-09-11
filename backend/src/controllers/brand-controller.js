const brandService = require("../services/brand-service");

exports.listBrands = async (req, res) => {
  try {
    const data = await brandService.listBrands(req.branch);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
