const { omitUndefined } = require("mongoose");
const { TryCatch, ErrorHandler } = require("../../helpers/error");
const companyModel = require("../../models/company");
const peopleModel = require("../../models/people");
const { SendMail } = require("../../config/nodeMailer.config");
const { generateOTP } = require("../../utils/generateOtp");

const createCompany = TryCatch(async (req, res) => {
  const {
    companyname,
    email,
    website,
    contactPersonName,
    phone,
    gst_no,
    address,
    designation,
    additionalContacts = [],
    status,
    comment,
  } = req.body;

  // Enforce per-admin total prospect cap (People + Company) <= 1000
  try {
    const creatorId = req.user.id || req.user._id;
    const [peopleCount, companyCount] = await Promise.all([
      peopleModel.countDocuments({ creator: creatorId }),
      companyModel.countDocuments({ creator: creatorId }),
    ]);
    if (peopleCount + companyCount >= 1000) {
      return res.status(403).json({
        status: 403,
        success: false,
        message:
          "Prospect limit reached for your plan. Please upgrade to add more.",
      });
    }
  } catch (e) {
    // ignore count errors; don't block creation due to counting failure
  }

  // === VALIDATION: Email & Phone Duplicate ===
  if (email) {
    const existingByEmail = await companyModel.findOne({
      email: email.trim().toLowerCase(),
    });
    if (existingByEmail) {
      throw new ErrorHandler(
        "A corporate with this email id is already registered",
        409
      );
    }
  }

  if (phone) {
    const existingByPhone = await companyModel.findOne({ phone });
    if (existingByPhone) {
      throw new ErrorHandler(
        "A corporate with this phone no. is already registered",
        409
      );
    }
  }

  // === FORMAT NAMES ===
  const formatName = (name = "") => {
    if (!name || !name.trim()) return "";
    return (
      name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase()
    );
  };

  const formattedCompanyName = formatName(companyname);
  const formattedContactPersonName = formatName(contactPersonName);

  // === GENERATE OTP ===
  const { otp, expiresAt } = generateOTP();

  // === CLEAN & FORMAT ADDITIONAL CONTACTS ===
  const cleanedAdditionalContacts = additionalContacts.map((contact) => ({
    name: contact.name?.trim() || "",
    phone: contact.phone || "",
    designation: contact.designation?.trim() || "",
    email: contact.email?.trim().toLowerCase() || "",
  }));

  // === CREATE COMPANY ===
  const company = await companyModel.create({
    organization: req.user.organization,
    creator: req.user.id,
    companyname: formattedCompanyName,
    email: email?.trim().toLowerCase(),
    contactPersonName: formattedContactPersonName,
    phone,
    designation: designation?.trim(),
    website: website?.trim(),
    gst_no: gst_no?.toUpperCase(),
    address: address?.trim(),
    additionalContacts: cleanedAdditionalContacts,
    status: status || "",
    isArchived: status === "Not Interested",
    otp,
    expiry: expiresAt,
    verify: false,
    // Only add comment if it's not empty
    ...(comment?.trim() && {
      comments: [
        {
          comment: comment.trim(),
          createdBy: req.user.id,
        },
      ],
    }),
  });

  // === SEND OTP EMAIL ===
  if (email) {
    const userName = formattedContactPersonName || formattedCompanyName;
    SendMail(
      "OtpVerification.ejs",
      { userName, otp },
      { email: email.trim(), subject: "OTP Verification" }
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
  const {
    companyId,
    companyname,
    address,
    contactPersonName,
    phone,
    designation,
    email,
    website,
    gst_no,
    status,
    additionalContacts = [],
    comment,
  } = req.body;

  // === 1. Find Company ===
  const company = await companyModel.findById(companyId);
  if (!company) {
    throw new ErrorHandler("Corporate not found", 404);
  }

  // === 2. Permission Check ===
  if (
    req.user.role !== "Super Admin" &&
    company.creator.toString() !== req.user.id.toString()
  ) {
    throw new ErrorHandler("You are not allowed to edit this corporate", 401);
  }

  // === 3. Duplicate Check (only if changed) ===
  if (email && email.trim().toLowerCase() !== company.email) {
    const exists = await companyModel.findOne({
      email: email.trim().toLowerCase(),
    });
    if (exists) {
      throw new ErrorHandler(
        "A corporate with this email id is already registered",
        409
      );
    }
  }

  if (phone && phone !== company.phone) {
    const exists = await companyModel.findOne({ phone });
    if (exists) {
      throw new ErrorHandler(
        "A corporate with this phone no. is already registered",
        409
      );
    }
  }

  // === 4. Clean Additional Contacts ===
  const cleanedAdditionalContacts = additionalContacts.map((contact) => ({
    name: contact.name?.trim() || "",
    phone: contact.phone || "",
    designation: contact.designation?.trim() || "",
    email: contact.email?.trim().toLowerCase() || "",
  }));

  // === 5. Prepare Update Object ===
  const updates = {
    companyname: companyname?.trim() || company.companyname,
    address: address?.trim() || company.address,
    contactPersonName: contactPersonName?.trim() || company.contactPersonName,
    phone: phone || company.phone,
    designation: designation?.trim() || company.designation,
    email: email?.trim().toLowerCase() || company.email,
    website: website?.trim() || company.website,
    gst_no: gst_no?.toUpperCase() || company.gst_no,
    status: status || company.status,
    additionalContacts: cleanedAdditionalContacts,
    isArchived: status === "Not Interested",
  };

  // === 6. Add Comment if provided ===
  if (comment?.trim()) {
    updates.$push = {
      comments: {
        comment: comment.trim(),
        createdBy: req.user.id,
      },
    };
  }

  // === 7. Update in DB ===
  const updatedCompany = await companyModel
    .findByIdAndUpdate(companyId, updates, { new: true })
    .populate("comments.createdBy", "firstname lastname");

  res.status(200).json({
    status: 200,
    success: true,
    message: "Corporate details have been updated successfully.",
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
  return res
    .status(200)
    .json({ message: "OTP Verified Successfully", success: true });
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

  const company = await companyModel
    .findById(companyId)
    .populate("comments.createdBy", "firstname lastname");
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

  const archivedFilter = archivedOnly
    ? { isArchived: true }
    : { isArchived: false };

  let companies = [];
  if (req.user.role === "Super Admin") {
    companies = await companyModel
      .find({ organization: req.user.organization, ...archivedFilter })
      .sort({ createdAt: -1 })
      .populate("creator", "name");
  } else {
    companies = await companyModel
      .find({ creator: req.user.id, ...archivedFilter })
      .sort({ createdAt: -1 })
      .populate("creator", "name");
  }

  res.status(200).json({
    status: 200,
    success: true,
    companies: companies,
  });
});

// Add comment to company
const addComment = async (req, res) => {
  try {
    const { companyId, comment } = req.body;
    const { _id: userId } = req.user;

    if (!companyId || !comment) {
      return res.status(400).json({
        success: false,
        message: "Company ID and comment are required",
      });
    }

    const company = await companyModel.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Add comment to the company
    company.comments.push({
      comment,
      createdBy: userId,
    });

    await company.save();

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      data: company.comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get company comments
const getComments = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await companyModel
      .findById(companyId)
      .populate("comments.createdBy", "firstname lastname");
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      data: company.comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCompany,
  editCompany,
  deleteCompany,
  companyDetails,
  allCompanies,
  CompanyOtpVerification,
  CompanyResendOTP,
  addComment,
  getComments,
};
