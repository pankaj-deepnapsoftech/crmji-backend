const express = require('express');
const { createPaymentValidator, validateHandler, editPaymentValidator, deletePaymentValidator, paymentDetailsValidator, downloadPaymentValidator } = require('../../validators/payment/validator');
const { editPayment, createPayment, deletePayment, getAllPayments, paymentDetails, downloadPayment } = require('../../controllers/payment/controller');
const { checkAccess } = require('../../helpers/checkAccess');
const router = express.Router();

router.post('/create-payment', checkAccess, createPaymentValidator(), validateHandler, createPayment);
router.post('/edit-payment', checkAccess, editPaymentValidator(), validateHandler, editPayment);
router.post('/delete-payment', checkAccess,  deletePaymentValidator(), validateHandler, deletePayment);
router.post('/all-payments', getAllPayments);
router.post('/payment-details',checkAccess,  paymentDetailsValidator(), validateHandler, paymentDetails);
router.post('/download-payment',checkAccess,  downloadPaymentValidator(), validateHandler, downloadPayment);

module.exports = router;