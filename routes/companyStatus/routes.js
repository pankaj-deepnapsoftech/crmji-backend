const express = require("express");
const {
  createCompanyStatus,
  getAllCompanyStatuses,
  updateCompanyStatus,
  deleteCompanyStatus,
} = require("../../controllers/companyStatus/controller");
const { checkAccess } = require("../../helpers/checkAccess");
const { isAuthenticated } = require("../../controllers/auth/controller");
const router = express.Router();

// Company status routes (Admin only)
router.post("/create", isAuthenticated, checkAccess, createCompanyStatus);
router.get("/all", isAuthenticated, checkAccess, getAllCompanyStatuses);
router.put("/update/:statusId", isAuthenticated, checkAccess, updateCompanyStatus);
router.delete("/delete/:statusId", isAuthenticated, checkAccess, deleteCompanyStatus);

module.exports = router;
