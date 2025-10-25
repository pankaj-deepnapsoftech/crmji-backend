const express = require('express');
const { createCustomer, editCustomer, deleteCustomer, allCustomers, customerDetails } = require('../../controllers/customer/controller');
const { createCustomerValidator, validateHandler, deleteCustomerValidator, editCustomerValidator, customerDetailsValidator } = require('../../validators/customer/validator');
const { checkAccess } = require('../../helpers/checkAccess');
const router = express.Router();

router.post('/create-customer', checkAccess, createCustomerValidator(), validateHandler, createCustomer);
router.post('/edit-customer', checkAccess, editCustomerValidator(), validateHandler, editCustomer);
router.post('/delete-customer', checkAccess, deleteCustomerValidator(), validateHandler, deleteCustomer);
router.post('/customer-details', checkAccess, customerDetailsValidator(), validateHandler, customerDetails);
router.post('/all-customers', allCustomers);

module.exports = router;