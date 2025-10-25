const express = require('express');
const { getAllAdmins, getAdminDetails, getAllPermissions, editAdminAccess, deleteAdmin, assignToEmployee } = require('../../controllers/admin/controller');
const { adminDetails, validateHandler, deleteAdminValidator, editAdminAccessValidator, assignToEmployeeValidator } = require('../../validators/admin/validator');
const { checkAccess } = require('../../helpers/checkAccess');
const router = express.Router();

router.get('/all-admins', getAllAdmins);
router.post('/admin-details', checkAccess, adminDetails(), validateHandler, getAdminDetails);
router.get('/all-permissions', checkAccess, getAllPermissions);
router.post('/edit-admin-permissions', checkAccess, editAdminAccessValidator(), validateHandler, editAdminAccess);
router.post('/delete-admin', checkAccess, deleteAdminValidator(), validateHandler, deleteAdmin);
router.post('/assign-employee', checkAccess, assignToEmployeeValidator(), validateHandler, assignToEmployee);

module.exports = router;