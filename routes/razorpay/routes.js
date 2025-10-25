const express = require('express');
const { createSubscription, paymentVerfication, getRazorpayKey, cancelSubscription, webhookHandler, planDetails } = require('../../controllers/razorpay/controller');
const { isAuthenticatedOrganization } = require('../../controllers/organization/controller');
const router = express.Router();

router.get('/key', isAuthenticatedOrganization, getRazorpayKey);
router.post('/create-subscription', isAuthenticatedOrganization, createSubscription);
router.post('/payment-verification', isAuthenticatedOrganization, paymentVerfication);
router.get('/cancel-subscription', isAuthenticatedOrganization, cancelSubscription);
router.post('/webhook', webhookHandler);
router.post('/plan-details', isAuthenticatedOrganization, planDetails);

module.exports = router;