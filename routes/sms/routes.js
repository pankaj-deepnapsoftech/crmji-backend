const express = require('express');
const { sendBulkSms, getBulkSms } = require('../../controllers/sms/controller.js');

const { isAuthenticated } = require("../../controllers/auth/controller.js"); // From existing
const { checkAccess } = require("../../helpers/checkAccess.js"); // From existing
const { createTemplate, getTemplates } = require("../../controllers/template/smsTem.js"); 


const router = express.Router();

router.post('/send-bulk-sms', sendBulkSms);
router.get('/get-bulk-sms', getBulkSms);

router.post("/template", isAuthenticated, checkAccess, createTemplate);
router.get("/templates", isAuthenticated, checkAccess, getTemplates);

module.exports = router; 

