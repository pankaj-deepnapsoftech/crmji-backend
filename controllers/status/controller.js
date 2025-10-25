const statusModel = require("../../models/status");
const { TryCatch } = require("../../helpers/error");

// Get all statuses for an organization
const getAllStatuses = TryCatch(async (req, res) => {
  const { organization } = req.user;

  const statuses = await statusModel
    .find({ organization, isActive: true })
    .sort({ order: 1, createdAt: 1 });

  res.status(200).json({
    success: true,
    message: "Statuses fetched successfully",
    statuses,
  });
});

// Create a new status (Super Admin only)
const createStatus = TryCatch(async (req, res) => {
  const { organization, role, id } = req.user;
  const { name } = req.body;

  // Check if user is Super Admin
  if (role !== "Super Admin") {
    return res.status(403).json({
      success: false,
      message: "Only Super Admin can create status options",
    });
  }

  // Check if status already exists
  const existingStatus = await statusModel.findOne({
    organization,
    name: { $regex: new RegExp(`^${name}$`, "i") },
    isActive: true,
  });

  if (existingStatus) {
    return res.status(400).json({
      success: false,
      message: "Status already exists",
    });
  }

  // Check if organization already has 6 statuses
  const statusCount = await statusModel.countDocuments({
    organization,
    isActive: true,
  });

  if (statusCount >= 6) {
    return res.status(400).json({
      success: false,
      message: "Maximum 6 status options allowed per organization",
    });
  }

  const status = await statusModel.create({
    organization,
    creator: id,
    name,
    order: statusCount,
  });

  res.status(201).json({
    success: true,
    message: "Status created successfully",
    status,
  });
});

// Update a status (Super Admin only)
const updateStatus = TryCatch(async (req, res) => {
  const { organization, role } = req.user;
  const { statusId } = req.params;
  const { name } = req.body;

  // Check if user is Super Admin
  if (role !== "Super Admin") {
    return res.status(403).json({
      success: false,
      message: "Only Super Admin can update status options",
    });
  }

  // Check if status exists and belongs to organization
  const status = await statusModel.findOne({
    _id: statusId,
    organization,
    isActive: true,
  });

  if (!status) {
    return res.status(404).json({
      success: false,
      message: "Status not found",
    });
  }

  // Check if new name already exists (excluding current status)
  const existingStatus = await statusModel.findOne({
    organization,
    name: { $regex: new RegExp(`^${name}$`, "i") },
    isActive: true,
    _id: { $ne: statusId },
  });

  if (existingStatus) {
    return res.status(400).json({
      success: false,
      message: "Status name already exists",
    });
  }

  status.name = name;
  await status.save();

  res.status(200).json({
    success: true,
    message: "Status updated successfully",
    status,
  });
});

// Delete a status (Super Admin only)
const deleteStatus = TryCatch(async (req, res) => {
  const { organization, role } = req.user;
  const { statusId } = req.params;

  // Check if user is Super Admin
  if (role !== "Super Admin") {
    return res.status(403).json({
      success: false,
      message: "Only Super Admin can delete status options",
    });
  }

  // Check if status exists and belongs to organization
  const status = await statusModel.findOne({
    _id: statusId,
    organization,
    isActive: true,
  });

  if (!status) {
    return res.status(404).json({
      success: false,
      message: "Status not found",
    });
  }

  // Soft delete by setting isActive to false
  status.isActive = false;
  await status.save();

  res.status(200).json({
    success: true,
    message: "Status deleted successfully",
  });
});

// Reorder statuses (Super Admin only)
const reorderStatuses = TryCatch(async (req, res) => {
  const { organization, role } = req.user;
  const { statusIds } = req.body; // Array of status IDs in new order

  // Check if user is Super Admin
  if (role !== "Super Admin") {
    return res.status(403).json({
      success: false,
      message: "Only Super Admin can reorder status options",
    });
  }

  // Update order for each status
  const updatePromises = statusIds.map((statusId, index) =>
    statusModel.updateOne(
      { _id: statusId, organization, isActive: true },
      { order: index }
    )
  );

  await Promise.all(updatePromises);

  res.status(200).json({
    success: true,
    message: "Status order updated successfully",
  });
});

module.exports = {
  getAllStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
  reorderStatuses,
};
