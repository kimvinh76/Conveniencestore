const express = require("express");
const controller = require("../controllers/invoice-controller");
const router = express.Router();

router.get("/", controller.listInvoices);
router.get("/:invoiceId/details", controller.getInvoiceDetails);
router.post("/", controller.createInvoice);

module.exports = router;
