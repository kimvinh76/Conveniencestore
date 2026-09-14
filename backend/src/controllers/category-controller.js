const categoryService = require("../services/category-service");

const { normalizeBranch } = require("../config/branches");

exports.listCategories = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch) || "CENTRAL";
    const data = await categoryService.listCategories(branch);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
