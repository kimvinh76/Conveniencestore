const invoiceService = require("../services/invoice-service");
const { normalizeBranch } = require("../config/branches");

exports.listInvoices = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch) return res.status(400).json({ message: "branch is required" });
    const rows = await invoiceService.listInvoicesByBranch(branch);
    res.json({ branch, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInvoiceDetails = async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    const { invoiceId } = req.params;
    const rows = await invoiceService.getInvoiceDetails(branch, invoiceId);
    res.json({ branch, invoiceId, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const branch = normalizeBranch(req.body.branch);
    const payload = {
      ...req.body,
      branch
    };
    const created = await invoiceService.createInvoice(payload);
    res.status(201).json({ message: "Invoice created successfully", data: created });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};