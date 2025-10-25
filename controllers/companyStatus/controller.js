const { TryCatch, ErrorHandler } = require("../../helpers/error");
const companyStatusModel = require("../../models/companyStatus");

// Create company status (Admin only)
const createCompanyStatus = TryCatch(async (req, res) => {
  const { name } = req.body;
  const { organization, _id: creator } = req.user;

  // Check if user is admin
  if (req.user.role !== "admin") {
    throw new ErrorHandler("Only admins can create company statuses", 403);
  }

  // Check if organization already has 6 statuses
  const existingStatuses = await companyStatusModel.countDocuments({
    organization,
    isActive: true,
  });

  if (existingStatuses >= 6) {
    throw new ErrorHandler("Maximum 6 statuses allowed per organization", 400);
  }

  // Check if status with same name already exists
  const existingStatus = await companyStatusModel.findOne({
    organization,
    name: { $regex: new RegExp(`^${name}$`, "i") },
    isActive: true,
  });

  if (existingStatus) {
    throw new ErrorHandler("Status with this name already exists", 409);
  }

  const status = await companyStatusModel.create({
    organization,
    creator,
    name: name.trim(),
    order: existingStatuses + 1,
  });

  res.status(201).json({
    success: true,
    message: "Company status created successfully",
    data: status,
  });
});

// Get all company statuses
const getAllCompanyStatuses = TryCatch(async (req, res) => {
  const { organization } = req.user;

  const statuses = await companyStatusModel
    .find({ organization, isActive: true })
    .sort({ order: 1 })
    .populate("creator", "firstname lastname");

  res.status(200).json({
    success: true,
    data: statuses,
  });
});

// Update company status
const updateCompanyStatus = TryCatch(async (req, res) => {
  const { statusId } = req.params;
  const { name } = req.body;
  const { organization, _id: creator } = req.user;

  // Check if user is admin
  if (req.user.role !== "admin") {
    throw new ErrorHandler("Only admins can update company statuses", 403);
  }

  const status = await companyStatusModel.findOne({
    _id: statusId,
    organization,
    isActive: true,
  });

  if (!status) {
    throw new ErrorHandler("Company status not found", 404);
  }

  // Check if status with same name already exists (excluding current status)
  const existingStatus = await companyStatusModel.findOne({
    organization,
    name: { $regex: new RegExp(`^${name}$`, "i") },
    isActive: true,
    _id: { $ne: statusId },
  });

  if (existingStatus) {
    throw new ErrorHandler("Status with this name already exists", 409);
  }

  status.name = name.trim();
  await status.save();

  res.status(200).json({
    success: true,
    message: "Company status updated successfully",
    data: status,
  });
});

// Delete company status
const deleteCompanyStatus = TryCatch(async (req, res) => {
  const { statusId } = req.params;
  const { organization } = req.user;

  // Check if user is admin
  if (req.user.role !== "admin") {
    throw new ErrorHandler("Only admins can delete company statuses", 403);
  }

  const status = await companyStatusModel.findOne({
    _id: statusId,
    organization,
    isActive: true,
  });

  if (!status) {
    throw new ErrorHandler("Company status not found", 404);
  }

  status.isActive = false;
  await status.save();

  res.status(200).json({
    success: true,
    message: "Company status deleted successfully",
  });
});

module.exports = {
  createCompanyStatus,
  getAllCompanyStatuses,
  updateCompanyStatus,
  deleteCompanyStatus,
};
