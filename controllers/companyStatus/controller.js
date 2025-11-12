const { TryCatch, ErrorHandler } = require("../../helpers/error");
const companyStatusModel = require("../../models/companyStatus");

// Create company status (Super Admin only)
const createCompanyStatus = TryCatch(async (req, res) => {
  const { name } = req.body;
  const { organization, id: creator, role } = req.user;

  // Only Super Admin can create (match Individual behavior)
  if (role !== "Super Admin") {
    throw new ErrorHandler("Only Super Admin can create company statuses", 403);
  }

  // Check if organization already has 10 statuses
  const existingStatuses = await companyStatusModel.countDocuments({
    organization,
    isActive: true,
  });

  if (existingStatuses >= 10) {
    throw new ErrorHandler("Maximum 10 statuses allowed per organization", 400);
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
  const { organization, id: creator, role } = req.user;

  // Only Super Admin can update (match Individual behavior)
  if (role !== "Super Admin") {
    throw new ErrorHandler("Only Super Admin can update company statuses", 403);
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
  const { organization, role } = req.user;

  // Only Super Admin can delete (match Individual behavior)
  if (role !== "Super Admin") {
    throw new ErrorHandler("Only Super Admin can delete company statuses", 403);
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
