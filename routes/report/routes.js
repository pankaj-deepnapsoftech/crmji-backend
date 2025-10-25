const express = require('express');
const { getPaymentReport, getExpenseReport, getIndividualReport, getCorporateReport, getLeadsReport, getFollowupLeadsReport } = require('../../controllers/report/controller');
const { checkAccess } = require('../../helpers/checkAccess');
const router = express.Router();

router.post('/get-payment-report', checkAccess, getPaymentReport);
router.post('/get-expense-report', checkAccess, getExpenseReport);
router.post('/get-individual-report', checkAccess, getIndividualReport);
router.post('/get-corporate-report', checkAccess, getCorporateReport);
router.post('/get-lead-report', checkAccess, getLeadsReport);
router.post('/get-followup-lead-report', checkAccess, getFollowupLeadsReport);

module.exports = router;
