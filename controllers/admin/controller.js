const { TryCatch } = require("../../helpers/error");
const adminModel = require("../../models/admin");
const companyModel = require("../../models/company");
const customerModel = require("../../models/customer");
const invoiceModel = require("../../models/invoice");
const leadModel = require("../../models/lead");
const offerModel = require("../../models/offer");
const paymentModel = require("../../models/payment");
const peopleModel = require("../../models/people");
const proformaInvoiceModel = require("../../models/proformaInvoice");

const getAllAdmins = TryCatch(async (req, res) => {
  const admins = await adminModel.find({ organization: req.user.organization, role: "Admin" });
  res.status(200).json({
    status: 200,
    success: true,
    admins: admins,
  });
});

const getAdminDetails = TryCatch(async (req, res) => {
  const { adminId } = req.body;
  const admin = await adminModel.findById(adminId);
  res.status(200).json({
    status: 200,
    success: true,
    admin,
  });
});

const getAllPermissions = TryCatch(async (req, res) => {
  res.status(200).json({
    status: 200,
    success: true,
    permissions: [
      "dashboard",
      "people",
      "company",
      "lead",
      "product",
      "category",
      "expense",
      "expense-category",
      "offer",
      "proforma-invoice",
      "invoice",
      "payment",
      "customer",
      "report",
      "support",
      "emails",
      "renewals",
      "databank"
      
    ],
  });
});

const editAdminAccess = TryCatch(async (req, res) => {
  const { adminId, permissions, designation } = req.body;
  const admin = await adminModel.findById(adminId);
  if (!admin) {
    throw new Error("Admin doesn't exists", 404);
  }

  modifiedPermissions = permissions.filter(
    (permission) => permission !== "admin" && permission !== "website-configuration"
  );

  await adminModel.findOneAndUpdate(
    { _id: adminId },
    { allowedroutes: modifiedPermissions, designation }
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "Employee permissions has been updated successfully",
  });
});

const deleteAdmin = TryCatch(async (req, res) => {
  const { adminId } = req.body;
  const admin = await adminModel.findById(adminId);
  if (!admin) {
    throw new Error("Employee doesn't exists", 404);
  }

  await adminModel.deleteOne({ _id: adminId });

  res.status(200).json({
    status: 200,
    success: true,
    message: "Employee has been deleted successfully",
  });
});

const assignToEmployee = TryCatch(async (req, res) => {
  const { assign_to_id, creator_id } = req.body;

  if (!assign_to_id) {
    throw new Error("Employee id is required", 400);
  }
  const employee = await adminModel.findById(assign_to_id);
  if (!employee) {
    throw new Error("Employee doesn't exist", 404);
  }

  const updatedPeople = await peopleModel.updateMany(
    { creator: creator_id },
    { creator: assign_to_id }
  );
  const updatedCompany = await companyModel.updateMany(
    { creator: creator_id },
    { creator: assign_to_id },
  );
  const updatedCustomer = await customerModel.updateMany(
    { creator: creator_id },
    { creator: assign_to_id },
  );
  const updatedProformaInvoice = await proformaInvoiceModel.updateMany(
    { creator: creator_id },
    { creator: assign_to_id, createdBy: assign_to_id },
  );
  const updatedInvoice = await invoiceModel.updateMany(
    { creator: creator_id },
    { creator: assign_to_id, createdBy: assign_to_id },
  );
  const updatedPayment = await paymentModel.updateMany(
    { creator: creator_id },
    { creator: assign_to_id, createdBy: assign_to_id },
  );
  const updatedLead = await leadModel.updateMany(
    { creator: creator_id },
    { creator: assign_to_id },
  );
  const updatedAssignedLead = await leadModel.updateMany(
    { assigned: creator_id },
    { assigned: assign_to_id },
  );
  const updatedOffer = await offerModel.updateMany(
    { creator: creator_id },
    { creator: assign_to_id, createdBy: assign_to_id },
  );

  if (
    (updatedPeople.modifiedCount === updatedPeople.matchedCount) &&
    (updatedCompany.modifiedCount === updatedCompany.matchedCount) &&
    (updatedCustomer.modifiedCount === updatedCustomer.matchedCount) &&
    (updatedProformaInvoice.modifiedCount ===
      updatedProformaInvoice.matchedCount) &&
    (updatedInvoice.modifiedCount === updatedInvoice.matchedCount) &&
    (updatedPayment.modifiedCount === updatedPayment.matchedCount) &&
    (updatedLead.modifiedCount === updatedLead.matchedCount) &&
    (updatedAssignedLead.modifiedCount === updatedAssignedLead.matchedCount) &&
    (updatedOffer.modifiedCount === updatedOffer.matchedCount)
  ) {
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Assigned successfully",
    });
  }

  res.status(500).json({
    status: 500,
    success: false,
    message: "Something went wrong",
  });
});

module.exports = {
  getAllAdmins,
  getAdminDetails,
  getAllPermissions,
  editAdminAccess,
  deleteAdmin,
  assignToEmployee,
};
