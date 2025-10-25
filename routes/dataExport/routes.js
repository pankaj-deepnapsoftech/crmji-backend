const express = require('express');
const { exportAllData, exportSpecificData } = require('../../controllers/dataExport/controller');
const { checkAccess } = require('../../helpers/checkAccess');
const router = express.Router();

// Export all data
router.get('/export-all', checkAccess, exportAllData);

// Export specific data types
router.get('/export/:dataType', checkAccess, exportSpecificData);

module.exports = router;
