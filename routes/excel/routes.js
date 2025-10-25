const express = require("express");
const {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  DateWiseRecord,
  bulkUpload,
  bulkDeleteRenewals
} = require("../../controllers/excel/controller.js");
const uploadMiddleware = require("../../utils/RenewalMulter.js");
const multer = require("multer");



const router = express.Router();

// Define the route with middleware for file upload
router.post("/create-record", uploadMiddleware, createRecord);
router.get("/all-records", getAllRecords);
router.get("/record/:id", getRecordById);
router.put("/update-record/:id", uploadMiddleware, updateRecord);
router.delete("/delete-record/:id", deleteRecord);
router.delete("/delete-records", bulkDeleteRenewals);
router.get("/date-wise", DateWiseRecord);
router.post("/bulk-upload", uploadMiddleware, bulkUpload);

module.exports = router;
