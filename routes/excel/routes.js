const express = require("express");
const {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  DateWiseRecord,
  bulkUpload,
  bulkDeleteRenewals,
} = require("../../controllers/excel/controller.js");
const uploadMiddleware = require("../../utils/RenewalMulter.js");
const multer = require("multer");
const { isAuthenticated } = require("../../controllers/auth/controller");
const { checkAccess } = require("../../helpers/checkAccess");

const router = express.Router();

// Define the route with middleware for file upload
router.post(
  "/create-record",
  isAuthenticated,
  checkAccess,
  uploadMiddleware,
  createRecord
);
router.get("/all-records", isAuthenticated, checkAccess, getAllRecords);
router.get("/record/:id", isAuthenticated, checkAccess, getRecordById);
router.put(
  "/update-record/:id",
  isAuthenticated,
  checkAccess,
  uploadMiddleware,
  updateRecord
);
router.delete(
  "/delete-record/:id",
  isAuthenticated,
  checkAccess,
  deleteRecord
);
router.delete(
  "/delete-records",
  isAuthenticated,
  checkAccess,
  bulkDeleteRenewals
);
router.get("/date-wise", isAuthenticated, checkAccess, DateWiseRecord);
router.post(
  "/bulk-upload",
  isAuthenticated,
  checkAccess,
  uploadMiddleware,
  bulkUpload
);

module.exports = router;
