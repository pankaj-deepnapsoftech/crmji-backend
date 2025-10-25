const express = require('express');
const { createProformaInvoice, editProformaInvoice, deleteProformaInvoice, getAllProformaInvoices, getProformaInvoiceDetails, downloadProformaInvoice } = require('../../controllers/proforma invoice/controller');
const { validateHandler, editProformaInvoiceValidator, deleteProformaInvoiceValidator, createProformaInvoiceValidator, downloadProformaInvoiceValidator } = require('../../validators/proforma invoice/validator');
const { checkAccess } = require('../../helpers/checkAccess');
const router = express.Router();

router.post('/create-proforma-invoice', checkAccess, createProformaInvoiceValidator(), validateHandler, createProformaInvoice);
router.post('/edit-proforma-invoice', checkAccess, editProformaInvoiceValidator(), validateHandler, editProformaInvoice);
router.post('/delete-proforma-invoice', checkAccess, deleteProformaInvoiceValidator(), validateHandler, deleteProformaInvoice);
router.post('/all-proforma-invoices', getAllProformaInvoices);
router.post('/proforma-invoice-details', checkAccess, getProformaInvoiceDetails);
router.post('/download-proforma-invoice', checkAccess, downloadProformaInvoiceValidator(), validateHandler, downloadProformaInvoice);

module.exports = router;