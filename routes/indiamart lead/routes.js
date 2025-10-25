const express = require('express');
const { allLeads, leadDetails, editLead, deleteLead } = require('../../controllers/indiamart lead/controller');
const { isAuthenticated } = require('../../controllers/auth/controller');
const router = express.Router();

router.get('/all', allLeads);
router.post('/details', leadDetails);
router.post('/edit', isAuthenticated, editLead);
router.post('/delete', isAuthenticated, deleteLead);

module.exports = router;