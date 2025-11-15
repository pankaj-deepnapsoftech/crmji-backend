const { SendMail, SendBulkMail } = require("../../config/nodeMailer.config");
const { TryCatch, ErrorHandler } = require("../../helpers/error");
const customerModel = require("../../models/customer");
const invoiceModel = require("../../models/invoice");
const leadModel = require("../../models/lead");
const offerModel = require("../../models/offer");
const paymentModel = require("../../models/payment");
const peopleModel = require("../../models/people");
const proformaInvoiceModel = require("../../models/proformaInvoice");
const { generateOTP } = require("../../utils/generateOtp");
const generateUniqueId = require('../../utils/generateUniqueId');


// Add remark to a person
const addRemarkToPerson = TryCatch(async (req, res) => {
  const { peopleId, remark } = req.body;
  const userId = req.user?.id || req.user?._id;

  if (!peopleId || !remark) {
    return res
      .status(400)
      .json({ success: false, message: "People ID and remark are required" });
  }

  const person = await peopleModel.findById(peopleId);
  if (!person) {
    throw new ErrorHandler("Person not found", 404);
  }

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (
    req.user.role !== "Super Admin" &&
    person.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error(
      "You are not allowed to add remarks to this individual",
      401
    );
  }

  person.remarksLog.push({ remark, createdBy: userId });
  await person.save();

  res
    .status(200)
    .json({ success: true, message: "Remark added", data: person.remarksLog });
});

// Get remarks for a person
const getRemarksForPerson = TryCatch(async (req, res) => {
  const { peopleId } = req.params;

  const person = await peopleModel.findById(peopleId).populate({
    path: "remarksLog.createdBy",
    select: "firstname lastname name",
  });

  if (!person) {
    throw new ErrorHandler("Person not found", 404);
  }

  if (
    req.user.role !== "Super Admin" &&
    person.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error(
      "You are not allowed to access this individual's remarks",
      401
    );
  }

  res.status(200).json({ success: true, data: person.remarksLog || [] });
});

const createPeople = TryCatch(async (req, res) => {
  const { firstname, lastname, email, phone, status, comment } = req.body;

  // ────── prospect-cap check ──────
  try {
    const creatorId = req.user.id || req.user._id;
    const [peopleCount, companyCount] = await Promise.all([
      peopleModel.countDocuments({ creator: creatorId }),
      require("../../models/company").countDocuments({ creator: creatorId }),
    ]);
    if (peopleCount + companyCount >= 1000) {
      return res.status(403).json({
        success: false,
        message: "Prospect limit reached for your plan. Please upgrade to add more.",
      });
    }
  } catch (e) {}

  // ────── duplicate email / phone ──────
  if (await peopleModel.findOne({ email }))
    throw new Error("Person with this email id already exists", 409);
  if (await peopleModel.findOne({ phone }))
    throw new Error("Person with this phone no. already exists", 409);

  // ────── format names ──────
  const formatName = (n = "") =>
    n.trim() ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : "";
  const formattedFirstname = formatName(firstname);
  const formattedLastname  = formatName(lastname);

  // ────── OTP ──────
  const { otp, expiresAt } = generateOTP();

  // ────── **GENERATE IND-xxx** ──────
  // Generate uniqueId based on creator - each admin starts from IND-001
  const creatorId = req.user.id || req.user._id;
  const uniqueId = await generateUniqueId(creatorId);   // <-- async!

  // ────── send OTP mail ──────
  SendMail(
    "OtpVerification.ejs",
    { userName: formattedFirstname, otp },
    { email, subject: "OTP Verification" }
  );

  // ────── create document ──────
  const person = await peopleModel.create({
    organization: req.user.organization,
    creator: req.user.id,
    firstname: formattedFirstname,
    lastname: formattedLastname,
    email,
    phone,
    status,
    comment: comment || "",
    isArchived: status === "Not Interested",
    otp,
    expiry: expiresAt,
    verify: false,
    uniqueId,                 // <-- IND-001, IND-002, …
  });

  res.status(201).json({
    success: true,
    message: "Person has been created successfully",
    person,
  });
});

const editPeople = TryCatch(async (req, res) => {
  //   const { peopleId, firstname, lastname, email, phone, company } = req.body;
  const { peopleId, firstname, lastname, email, phone, status, comment } =
    req.body;

  const isExistingPerson = await peopleModel.findById(peopleId);

  if (!isExistingPerson) {
    throw new Error("Person not found", 404);
  }
  if (
    req.user.role !== "Super Admin" &&
    isExistingPerson.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to edit this individual", 401);
  }

  const isEmailTaken = await peopleModel.findOne({ email: email });
  if (isEmailTaken && isExistingPerson.email !== email) {
    throw new Error("Email id is already registered with us.");
  }

  const isPhoneTaken = await peopleModel.findOne({ phone: phone });
  if (isPhoneTaken && isExistingPerson.phone !== phone) {
    throw new Error("Phone no. is already registered with us.");
  }

  const updatedPerson = await peopleModel.findOneAndUpdate(
    { _id: peopleId },
    {
      firstname,
      lastname,
      email,
      phone,
      status,
      comment: comment || "",
      ...(status ? { isArchived: status === "Not Interested" } : {}),
    },
    { new: true }
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "Person's details has been updated successfully",
    updatedPerson: updatedPerson,
  });
});

const deletePeople = TryCatch(async (req, res) => {
  const { peopleId } = req.body;

  const isExistingPeople = await peopleModel.findById(peopleId);

  if (!isExistingPeople) {
    throw new ErrorHandler("Person not found", 404);
  }

  if (
    req.user.role !== "Super Admin" &&
    isExistingPeople.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to delete this individual", 401);
  }

  const deletedPerson = await peopleModel.deleteOne({ _id: peopleId });

  res.status(200).json({
    status: 200,
    success: true,
    message: "Person has been deleted successfully",
    deletedPerson: deletedPerson,
  });
});

const personDetails = TryCatch(async (req, res) => {
  const { peopleId } = req.body;

  let person = await peopleModel.findById(peopleId).populate("creator", "name");
  // .populate("company", "companyname");
  if (!person) {
    throw new ErrorHandler("Person doesn't exists", 400);
  }

  if (
    req.user.role !== "Super Admin" &&
    person.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to access this individual", 401);
  }

  person = {
    _id: person._id,
    firstname: person.firstname,
    lastname: person.lastname,
    email: person.email,
    phone: person.phone,
    status: person.status,
    verify: person.verify,
    uniqueId: person.uniqueId,
    createdAt: person.createdAt,
    creator: person?.creator?.name || "",
    // company: person?.company ? person.company.companyname : "",
  };

  res.status(200).json({
    status: 200,
    success: true,
    person: person,
  });
});

const allPersons = TryCatch(async (req, res) => {
  let people = [];
  const { archivedOnly = false } = req.body || {};

  const archivedFilter = archivedOnly
    ? { isArchived: true }
    : { isArchived: false };

  if (req.user.role === "Super Admin") {
    people = await peopleModel
      .find({ organization: req.user.organization, ...archivedFilter })
      .sort({ createdAt: -1 })
      .populate("creator", "name");
  } else {
    people = await peopleModel
      .find({ creator: req.user.id, ...archivedFilter })
      .sort({ createdAt: -1 })
      .populate("creator", "name");
  }

  const results = people.map((p) => {
    return {
      _id: p._id,
      uniqueId: p.uniqueId,
      firstname: p.firstname,
      lastname: p.lastname,
      phone: p.phone,
      email: p.email,
      status: p.status,
      verify: p.verify,
      creator: p.creator.name,
      createdAt: p.createdAt,
    };
  });

  res.status(200).json({
    status: 200,
    success: true,
    people: results,
  });
});

const OtpVerification = TryCatch(async (req, res) => {
  const { otp } = req.body;
  const { id } = req.params;

  const find = await peopleModel.findById(id);
  if (!find) {
    return res.status(404).json({
      message: "user not found",
    });
  }
  const date = Date.now();
  if (date > find.expiry) {
    return res.status(400).json({
      message: "OTP expired",
    });
  }

  if (otp !== find.otp) {
    return res.status(404).json({
      message: "Wrong OTP",
    });
  }

  await peopleModel.findByIdAndUpdate(id, { verify: true });
  return res.status(200).json({
    message: "OTP Verifyed Successful",
    success: true,
  });
});

const ResendOTP = TryCatch(async (req, res) => {
  const { id } = req.params;
  const find = await peopleModel.findById(id);
  if (!find) {
    return res.status(404).json({
      message: "Wrong User",
    });
  }

  const { otp, expiresAt } = generateOTP();

  SendMail(
    "OtpVerification.ejs",
    { userName: find.firstname, otp },
    { email: find.email, subject: "OTP Verification" }
  );

  await peopleModel.findByIdAndUpdate(id, { otp, expiry: expiresAt });
  return res.status(200).json({
    message: "Resend OTP",
  });
});

const VerifyedPeople = TryCatch(async (_req, res) => {
  const data = await peopleModel
    .find({ verify: true })
    .sort({ _id: -1 })
    .populate("creator", "name");

  const verified = data.map((item) => ({
    _id: item._id,
    firstname: item.firstname,
    lastname: item.lastname,
    email: item.email,
    phone: item.phone,
    verify: item.verify,
    creator: item.creator.name,
    createdAt: item.createdAt,
  }));

  return res.status(200).json({
    message: "data",
    data: verified,
  });
});

const SendBulkEmailVerifiedUser = TryCatch(async (req, res) => {
  const { message, subject } = req.body;
  const data = await peopleModel
    .find({ verify: true })
    .sort({ _id: -1 })
    .populate("creator", "name");

  for (let person of data) {
    // Set the emailSentDate for each person
    person.emailSentDate = Date.now();

    // Save the updated document
    await person.save();
  }

  console.log(data);

  const email = data.map((item) => [item?.email]);
  await SendBulkMail({ email, message, subject });
  return res.status(200).json({
    message: "Mail send successful",
  });
});

const getAllEmailSentData = TryCatch(async (req, res) => {
  const data = await peopleModel
    .find({ emailSentDate: { $exists: true } }) // This ensures the field exists
    .populate("creator", "name");

  return res.status(200).json({
    data,
  });
});
const getAllWhatsappSentData = TryCatch(async (req, res) => {
  const data = await peopleModel
    .find({ whatsappSentDate: { $exists: true } })
    .populate("creator", "name");

  return res.status(200).json({
    data,
  });
});

module.exports = {
  createPeople,
  editPeople,
  deletePeople,
  personDetails,
  allPersons,
  OtpVerification,
  ResendOTP,
  VerifyedPeople,
  SendBulkEmailVerifiedUser,
  getAllEmailSentData,
  getAllWhatsappSentData,
  addRemarkToPerson,
  getRemarksForPerson,
};
