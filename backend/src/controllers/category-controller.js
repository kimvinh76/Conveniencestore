const categoryService = require("../services/category-service");

exports.listCategories = async (req, res) => {
  try {
    const data = await categoryService.listCategories();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
