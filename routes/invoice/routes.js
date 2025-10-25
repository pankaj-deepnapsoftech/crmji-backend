const express = require('express');
const { createInvoice, editInvoice, deleteInvoice, getAllInvoices, getInvoiceDetails, downloadInvoice } = require('../../controllers/invoice/controller');
const { validateHandler, editInvoiceValidator, deleteInvoiceValidator, createInvoiceValidator, downloadInvoiceValidator } = require('../../validators/invoice/validator');
const { checkAccess } = require('../../helpers/checkAccess');
const router = express.Router();

router.post('/create-invoice', checkAccess, createInvoiceValidator(), validateHandler, createInvoice);
router.post('/edit-invoice', checkAccess, editInvoiceValidator(), validateHandler, editInvoice);
router.post('/delete-invoice', checkAccess, deleteInvoiceValidator(), validateHandler, deleteInvoice);
router.post('/all-invoices', getAllInvoices);
router.post('/invoice-details', checkAccess, getInvoiceDetails);
router.post('/download-invoice', checkAccess, downloadInvoiceValidator(), validateHandler, downloadInvoice);

module.exports = router;