const express = require("express");
const {
  getAllStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
  reorderStatuses,
} = require("../../controllers/status/controller");
const {
  createStatusValidator,
  updateStatusValidator,
  reorderStatusesValidator,
} = require("../../validators/status/validator");
const { validateHandler } = require("../../validators/lead/validator");
const { checkAccess } = require("../../helpers/checkAccess");

const router = express.Router();

// Get all statuses for organization
router.post("/all-statuses", checkAccess, getAllStatuses);

// Create new status (Super Admin only)
router.post(
  "/create-status",
  checkAccess,
  createStatusValidator(),
  validateHandler,
  createStatus
);

// Update status (Super Admin only)
router.post(
  "/update-status/:statusId",
  checkAccess,
  updateStatusValidator(),
  validateHandler,
  updateStatus
);

// Delete status (Super Admin only)
router.post("/delete-status/:statusId", checkAccess, deleteStatus);

// Reorder statuses (Super Admin only)
router.post(
  "/reorder-statuses",
  checkAccess,
  reorderStatusesValidator(),
  validateHandler,
  reorderStatuses
);

module.exports = router;
