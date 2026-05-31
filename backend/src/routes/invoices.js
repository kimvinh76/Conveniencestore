const express = require("express");
const { normalizeBranch, isCentralBranch } = require("../config/branches");
const service = require("../services/store-service");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch || isCentralBranch(branch)) {
      return res.status(400).json({ message: "branch is required and must be HUE, SAIGON, or HANOI" });
    }
    const rows = await service.listInvoicesByBranch(branch);
    return res.json({ branch, count: rows.length, data: rows });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:invoiceId/details", async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch || isCentralBranch(branch)) {
      return res.status(400).json({ message: "branch is required and must be HUE, SAIGON, or HANOI" });
    }
    const rows = await service.getInvoiceDetails(branch, req.params.invoiceId);
    return res.json({ branch, invoiceId: req.params.invoiceId, data: rows });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const branch = normalizeBranch(req.body.branch);
    if (!branch || isCentralBranch(branch)) {
      return res.status(400).json({ message: "branch is required and must be HUE, SAIGON, or HANOI" });
    }
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];
    const parsedItems = rawItems
      .map((item) => ({
        productCode: String(item?.productCode || "").trim(),
        productName: item?.productName ? String(item.productName).trim() : "",
        unitPrice: Number(item?.unitPrice || 0),
        quantity: Number(item?.quantity || 0),
        totalAmount: Number(item?.totalAmount || 0),
      }))
      .filter((item) => item.productCode || item.quantity || item.unitPrice);

    const fallbackSingleItem = {
      productCode: String(req.body.productCode || "").trim(),
      productName: req.body.productName ? String(req.body.productName).trim() : "",
      unitPrice: Number(req.body.unitPrice || 0),
      quantity: Number(req.body.quantity || 0),
      totalAmount: Number(req.body.totalAmount || 0),
    };

    const items = parsedItems.length
      ? parsedItems
      : fallbackSingleItem.productCode
        ? [fallbackSingleItem]
        : [];

    if (!items.length) {
      return res.status(400).json({ message: "items is required and must contain at least one line" });
    }
    if (items.some((item) => !item.productCode || item.quantity <= 0)) {
      return res.status(400).json({ message: "Each item must include productCode and quantity > 0" });
    }

    const payload = {
      branch,
      employeeId: req.body.employeeId ? String(req.body.employeeId).trim() : "",
      items,
      totalAmount: Number(req.body.totalAmount || 0),
      note: String(req.body.note || "").trim(),
    };

    const created = await service.createInvoice(payload);
    return res.status(201).json({ message: "Invoice created in local fragment successfully", data: created });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
