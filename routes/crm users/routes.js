const express = require('express');
const { isAuthenticated } = require('../../controllers/auth/controller');
const { checkAccess } = require('../../helpers/checkAccess');
const {getAllUsers, getUserDetails} = require('../../controllers/crm users/controller');
const router = express.Router();

router.get('/all', getAllUsers);
router.post('/details', getUserDetails);

module.exports = router;