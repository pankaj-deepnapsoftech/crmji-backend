const { omitUndefined } = require("mongoose");
const { TryCatch, ErrorHandler } = require("../../helpers/error");
const companyModel = require("../../models/company");
const { SendMail } = require("../../config/nodeMailer.config");
const { generateOTP } = require("../../utils/generateOtp");

const createCompany = TryCatch(async (req, res) => {
  const { companyname, email, website, contact, phone, gst_no, address, secondPersonName, secondPersonContact, secondPersonDesignation, status } = req.body;

  let isExistingCompany = await companyModel.findOne({ email });
  if (isExistingCompany) {
    throw new ErrorHandler(
      "A corporate with this email id is already registered",
      409
    );
  }

  isExistingCompany = await companyModel.findOne({ phone });
  if (isExistingCompany) {
    throw new ErrorHandler(
      "A corporate with this phone no. is already registered",
      409
    );
  }

  const formatName = (name = "") =>
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  const formattedCompanyName = formatName(companyname.trim());
  const formattedContact = formatName(contact?.trim());

  // Generate OTP for email verification
  const { otp, expiresAt } = generateOTP();

  const company = await companyModel.create({
    organization: req.user.organization,
    creator: req.user.id,
    companyname: formattedCompanyName,
    email,
    contact: formattedContact,
    phone,
    website,
    gst_no,
    address,
    secondPersonName,
    secondPersonContact,
    secondPersonDesignation,
    status,
    isArchived: status === 'Not Interested',
    otp,
    expiry: expiresAt,
    verify: false,
  });

  // Send OTP email if email is provided
  if (email) {
    SendMail(
      "OtpVerification.ejs",
      { userName: formattedContact || formattedCompanyName, otp },
      { email, subject: "OTP Verification" }
    );
  }

  res.status(200).json({
    status: 200,
    success: true,
    message: "Corporate has been created successfully",
    company,
  });
});


const editCompany = TryCatch(async (req, res) => {
  const { companyId, companyname, name, email, website, contact, phone, gst_no, address, secondPersonName, secondPersonContact, secondPersonDesignation, status } = req.body;

  const company = await companyModel.findById(companyId);

  if (!company) {
    throw new ErrorHandler("Corporate not found", 404);
  }

  let isExistingCompany = await companyModel.findOne({ email });
  if (isExistingCompany && company.email !== email) {
    throw new ErrorHandler(
      "A corporate with this email id is already registered",
      409
    );
  }
  isExistingCompany = await companyModel.findOne({ phone });
  if (isExistingCompany && company.phone !== phone) {
    throw new ErrorHandler(
      "A corparate with this phone no. id is already registered",
      409
    );
  }

  if (
    req.user.role !== "Super Admin" &&
    isExistingCompany.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to edit this corporate", 401);
  }

  const updatedCompany = await companyModel.findOneAndUpdate(
    { _id: companyId },
    { companyname: companyname || name, email, phone, contact, website, gst_no, address, secondPersonName, secondPersonContact, secondPersonDesignation, status, ...(status ? { isArchived: status === 'Not Interested' } : {}) },
    { new: true }
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "Corporate details has been updated successfully.",
    company: updatedCompany,
  });
});

const deleteCompany = TryCatch(async (req, res) => {
  const { companyId } = req.body;

  const company = await companyModel.findById(companyId);

  if (!company) {
    throw new ErrorHandler("Corporate not found", 404);
  }

  if (
    req.user.role !== "Super Admin" &&
    company.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to delete this corporate", 401);
  }

  const deletedCompany = await companyModel.deleteOne({ _id: companyId });

  res.status(200).json({
    status: 200,
    success: true,
    message: "Corporate has been deleted successfully",
    company: deletedCompany,
  });
});

// Verify Company OTP
const CompanyOtpVerification = TryCatch(async (req, res) => {
  const { otp } = req.body;
  const { id } = req.params;

  const company = await companyModel.findById(id);
  if (!company) {
    return res.status(404).json({ message: "Corporate not found" });
  }
  const now = Date.now();
  if (now > company.expiry) {
    return res.status(400).json({ message: "OTP expired" });
  }
  if (otp !== company.otp) {
    return res.status(404).json({ message: "Wrong OTP" });
  }
  await companyModel.findByIdAndUpdate(id, { verify: true });
  return res.status(200).json({ message: "OTP Verified Successfully", success: true });
});

// Resend Company OTP
const CompanyResendOTP = TryCatch(async (req, res) => {
  const { id } = req.params;
  const company = await companyModel.findById(id);
  if (!company) {
    return res.status(404).json({ message: "Wrong Corporate" });
  }

  const { otp, expiresAt } = generateOTP();
  if (company.email) {
    SendMail(
      "OtpVerification.ejs",
      { userName: company.contact || company.companyname, otp },
      { email: company.email, subject: "OTP Verification" }
    );
  }
  await companyModel.findByIdAndUpdate(id, { otp, expiry: expiresAt });
  return res.status(200).json({ message: "Resent OTP" });
});

const companyDetails = TryCatch(async (req, res) => {
  const { companyId } = req.body;

  const company = await companyModel.findById(companyId);
  if (!company) {
    throw new ErrorHandler("Corporate doesn't exists", 400);
  }
  if (
    req.user.role !== "Super Admin" &&
    company.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to access this corporate", 401);
  }

  res.status(200).json({
    status: 200,
    success: true,
    company: company,
  });
});

const allCompanies = TryCatch(async (req, res) => {
  const { page = 1, archivedOnly = false } = req.body;

  const archivedFilter = archivedOnly ? { isArchived: true } : { isArchived: false };

  let companies = [];
  if (req.user.role === "Super Admin") {
    companies = await companyModel.find({organization: req.user.organization, ...archivedFilter}).sort({ createdAt: -1 }).populate('creator', 'name');
  } else {
    companies = await companyModel
      .find({ creator: req.user.id, ...archivedFilter })
      .sort({ createdAt: -1 }).populate('creator', 'name');
  }

  res.status(200).json({
    status: 200,
    success: true,
    companies: companies,
  });
});

module.exports = {
  createCompany,
  editCompany,
  deleteCompany,
  companyDetails,
  allCompanies,
  CompanyOtpVerification,
  CompanyResendOTP,
};
