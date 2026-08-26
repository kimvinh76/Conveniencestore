const promotionService = require("../services/promotion-service");
const { normalizeBranch } = require("../config/branches");

async function listPromotions(req, res, next) {
  try {
    const branch = req.auth?.branch || req.query.branch || "CENTRAL";
    const data = await promotionService.listPromotions(branch);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function listActivePromotions(req, res, next) {
  try {
    const branch = req.auth?.branch || req.query.branch || "CENTRAL";
    const data = await promotionService.listActivePromotions(branch);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function checkPromotion(req, res, next) {
  try {
    const branch = req.auth?.branch || req.query.branch;
    if (!branch || branch === "CENTRAL") {
      return res.status(400).json({ message: "branch must be a local store (HN, SG, HUE) to check promo" });
    }
    const promoCode = req.params.id;
    const data = await promotionService.checkPromotion(branch, promoCode);
    if (!data) {
      return res.status(404).json({ message: "Mã khuyến mãi không tồn tại!" });
    }
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function createPromotion(req, res, next) {
  try {
    const branch = req.auth?.branch || req.query.branch || "CENTRAL";
    if (branch !== "CENTRAL") {
      return res.status(403).json({ message: "Chỉ admin tại CENTRAL mới được tạo khuyến mãi!" });
    }
    const data = await promotionService.createPromotion(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function updatePromotion(req, res, next) {
  try {
    const branch = req.auth?.branch || req.query.branch || "CENTRAL";
    if (branch !== "CENTRAL") {
      return res.status(403).json({ message: "Chỉ admin tại CENTRAL mới được sửa khuyến mãi!" });
    }
    const promoCode = req.params.id;
    const data = await promotionService.updatePromotion(promoCode, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function deletePromotion(req, res, next) {
  try {
    const branch = req.auth?.branch || req.query.branch || "CENTRAL";
    if (branch !== "CENTRAL") {
      return res.status(403).json({ message: "Chỉ admin tại CENTRAL mới được xóa khuyến mãi!" });
    }
    const promoCode = req.params.id;
    const data = await promotionService.deletePromotion(promoCode);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listPromotions,
  listActivePromotions,
  checkPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion
};
