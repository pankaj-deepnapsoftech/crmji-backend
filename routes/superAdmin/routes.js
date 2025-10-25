const express = require("express");
const router = express.Router();
// Super Admin JWT auth
const { isSuperAdminAuthenticated } = require("../../controllers/superAdminAuth/controller");

const {
  getAllAdminsGlobally,
  getAllAdminsWithSubscriptionStatus,
  getAllOrganizations,
  getAdminDetailsWithPassword,
  exportAllAdminData,
  getSuperAdminDashboard,
  deleteAnyAdmin,
  updateAnyAdmin,
  exportIndividualAdminData,
  exportAllSuperAdminRoleData,
  getLeadsByAdmin,
  getPeopleByAdmin,
  getCustomersByAdmin,
  getEmployeesByAdmin,
  getInvoicesByAdmin,
  getPaymentsByAdmin,
  getProductsByAdmin,
  exportLeadsByAdmin,
  exportPeopleByAdmin,
  exportCustomersByAdmin,
  exportInvoicesByAdmin,
  exportPaymentsByAdmin,
  exportProductsByAdmin
} = require("../../controllers/superAdmin/controller");

// Authenticated Super Admin routes
router.get("/dashboard", isSuperAdminAuthenticated, getSuperAdminDashboard);

router.get("/admins", isSuperAdminAuthenticated, getAllAdminsGlobally);

router.get("/admins-subscription-status", isSuperAdminAuthenticated, getAllAdminsWithSubscriptionStatus);

router.get("/organizations", isSuperAdminAuthenticated, getAllOrganizations);

router.get("/admin/:adminId", isSuperAdminAuthenticated, getAdminDetailsWithPassword);

router.get("/export-admins", isSuperAdminAuthenticated, exportAllAdminData);

router.get("/export-admin/:adminId", isSuperAdminAuthenticated, exportIndividualAdminData);

router.get("/export-super-admin-role-users", isSuperAdminAuthenticated, exportAllSuperAdminRoleData);

// Module-specific routes for fetching data by admin
router.get("/leads/:adminId", isSuperAdminAuthenticated, getLeadsByAdmin);
router.get("/people/:adminId", isSuperAdminAuthenticated, getPeopleByAdmin);
router.get("/customers/:adminId", isSuperAdminAuthenticated, getCustomersByAdmin);
router.get("/admin/:adminId/employees", isSuperAdminAuthenticated, getEmployeesByAdmin);
router.get("/invoices/:adminId", isSuperAdminAuthenticated, getInvoicesByAdmin);
router.get("/payments/:adminId", isSuperAdminAuthenticated, getPaymentsByAdmin);
router.get("/products/:adminId", isSuperAdminAuthenticated, getProductsByAdmin);

// Module-specific routes for exporting data by admin
router.get("/export-leads/:adminId", isSuperAdminAuthenticated, exportLeadsByAdmin);
router.get("/export-people/:adminId", isSuperAdminAuthenticated, exportPeopleByAdmin);
router.get("/export-customers/:adminId", isSuperAdminAuthenticated, exportCustomersByAdmin);
router.get("/export-invoices/:adminId", isSuperAdminAuthenticated, exportInvoicesByAdmin);
router.get("/export-payments/:adminId", isSuperAdminAuthenticated, exportPaymentsByAdmin);
router.get("/export-products/:adminId", isSuperAdminAuthenticated, exportProductsByAdmin);

router.delete("/admin/:adminId", isSuperAdminAuthenticated, deleteAnyAdmin);

router.put("/admin/:adminId", isSuperAdminAuthenticated, updateAnyAdmin);

module.exports = router;
