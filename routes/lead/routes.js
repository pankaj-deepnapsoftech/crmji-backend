const express = require("express");
const {
  createLead,
  editLead,
  deleteLead,
  leadDetails,
  allLeads,
  assignedLeads,
  followupReminders,
  seenFollowupReminders,
  getUnseenNotfications,
  leadSummary,
  bulkUpload,
  deleteAllLead,
  bulkAssign,
  bulkDownload,
  dataBank,
  scheduleDemo,
  editScheduleDemo,
  completeDemo,
  saveOrUpdateKYC,
  bulkSms,
  downloadRIFile,
  uploadRIFile,
} = require("../../controllers/Lead/controller");
const {
  createLeadValidator,
  validateHandler,
  editLeadValidator,
  deleteLeadValidator,
  leadDetailsValidator,
  scheduleDemoValidator,
  editScheduleDemoValidator,
} = require("../../validators/lead/validator");
const { checkAccess } = require("../../helpers/checkAccess");
const { upload } = require("../../utils/multer");
const { isAuthenticated } = require("../../controllers/auth/controller");
const router = express.Router();

router.post(
  "/create-lead",
  checkAccess,
  createLeadValidator(),
  validateHandler,
  createLead
);
router.post(
  "/edit-lead",
  upload.single("riFile"),
  checkAccess,
  editLeadValidator(),
  validateHandler,
  editLead
);
router.post(
  "/delete-lead",
  checkAccess,
  deleteLeadValidator(),
  validateHandler,
  deleteLead
);
router.get("/delete-all", checkAccess, deleteAllLead);
router.post(
  "/lead-details",
  checkAccess,
  leadDetailsValidator(),
  validateHandler,
  leadDetails
);

router.post("/bulk-sms", isAuthenticated, bulkSms);

router.post("/all-leads", allLeads);
router.get("/assigned-lead", checkAccess, assignedLeads);
router.get("/lead-summary", checkAccess, leadSummary);
router.post("/bulk-upload", upload.single("excel"), bulkUpload);
router.get("/bulk-download", checkAccess, bulkDownload);
router.post("/bulk-assign", checkAccess, bulkAssign);
router.post("/data/bank", checkAccess, dataBank);
router.post(
  "/schedule-demo",
  isAuthenticated,
  checkAccess,
  scheduleDemoValidator(),
  validateHandler,
  scheduleDemo
);
router.post(
  "/edit-schedule-demo",
  isAuthenticated,
  checkAccess,
  editScheduleDemoValidator(),
  validateHandler,
  editScheduleDemo
);
router.post(
  "/complete-demo",
  isAuthenticated,
  checkAccess,
  validateHandler,
  completeDemo
);
router.post("/kyc", isAuthenticated, saveOrUpdateKYC);
router.get(
  "/download-ri/:leadId",
  isAuthenticated,
  checkAccess,
  downloadRIFile
);
router.post("/upload-ri", isAuthenticated, checkAccess, uploadRIFile);

module.exports = router;
