const { isAuthenticated } = require('../../controllers/auth/controller');
const { createSupport, deleteSupport, editSupport, getAllSupport, getSupportDetails, getAllAssignedSupport, supportSummary } = require('../../controllers/support/controller');

const express = require('express');
const { checkAccess } = require('../../helpers/checkAccess');
const { createSupportValidator, validateHandler, deleteSupportValidator, editSupportValidator, supportDetailsValidator } = require('../../validators/support/validator');
const router = express.Router();

router.post('/create-support', createSupportValidator(), validateHandler, createSupport);
router.post('/delete-support', deleteSupportValidator(), validateHandler, isAuthenticated, checkAccess, deleteSupport);
router.post('/edit-support', editSupportValidator(), validateHandler, isAuthenticated, checkAccess, editSupport);
router.post('/get-support', supportDetailsValidator(), validateHandler, getSupportDetails);
router.get('/get-all-support', isAuthenticated, getAllSupport);
router.get('/get-all-assigned-support', isAuthenticated, checkAccess, getAllAssignedSupport);
router.get('/support-summary', isAuthenticated, supportSummary)

module.exports = router;