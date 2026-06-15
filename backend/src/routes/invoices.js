const express = require("express");
const controller = require("../controllers/invoice-controller");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.get("/", requireAuth, controller.listInvoices);
router.get("/:invoiceId/details", requireAuth, controller.getInvoiceDetails);
router.post("/", requireAuth, controller.createInvoice);

module.exports = router;
