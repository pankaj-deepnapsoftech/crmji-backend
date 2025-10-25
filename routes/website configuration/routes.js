const express = require('express');
const { getFacebookApi, getIndiamartApi, updateFacebookApi, updateIndiamartApi, updateSmsApi, getSmsApi, getEmailApi, updateEmailApi } = require('../../controllers/website configuration/controller');
const { checkAccess } = require('../../helpers/checkAccess');
const router = express.Router();

router.get('/facebook-api', checkAccess, getFacebookApi);
router.get('/indiamart-api', checkAccess, getIndiamartApi);
router.get('/sms-api', checkAccess, getSmsApi);
router.get('/email-api', checkAccess, getEmailApi);
router.post('/facebook-api', checkAccess, updateFacebookApi);
router.post('/indiamart-api', checkAccess, updateIndiamartApi);
router.post('/email-api', checkAccess, updateEmailApi);
router.post('/sms-api', checkAccess, updateSmsApi);

module.exports = router;