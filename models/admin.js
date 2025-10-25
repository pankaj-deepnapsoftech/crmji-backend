const mongoose = require("mongoose");
const peopleModel = require("./people");
const companyModel = require("./company");
const customerModel = require("./customer");
const invoiceModel = require("./invoice");
const proformaInvoiceModel = require("./proformaInvoice");
const paymentModel = require("./payment");
const leadModel = require("./lead");

const adminSchema = mongoose.Schema(
  {
    organization: {
      type: mongoose.Types.ObjectId,
      ref: "Organization",
      required: [true, 'organization is a required field']
    },
        employeeId: {
        type: String,
        unique: true,
        index: true,
      },
    name: {
      type: String,
      required: [true, "name is a required field"],
    },
    password: {
      type: String,
      required: [true, "password is a required field"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "phone is a required field"],
    },
    email: {
      type: String,
      required: [true, "email is a required field"],
    },
    designation: {
      type: String,
      required: [true, "designation is a required field"],
    },
    profileimage: {
      type: String,
    },
    role: {
      type: String,
      enum: ["Super Admin", "Admin"],
      default: "Admin",
    },
    allowedroutes: {
      type: [String],
      enum: [
        "admin",
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
        "website configuration",
        "emails",
        "renewals",
        "databank",
        "data-export",
        "super-admin"
      ],
      default: [],
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.pre(
  "deleteOne",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?._id !== undefined){
      await peopleModel.deleteMany({ creator: docToDelete._id });
      await companyModel.deleteMany({ creator: docToDelete._id });
      await customerModel.deleteMany({ creator: docToDelete._id });
      // await invoiceModel.deleteMany({ creator: docToDelete._id });
      // await proformaInvoiceModel.deleteMany({ creator: docToDelete._id });
      // await paymentModel.deleteMany({ creator: docToDelete._id });
      // await leadModel.deleteMany({ creator: docToDelete._id });
    }
    next();
  }
);

const adminModel = mongoose.model("Admin", adminSchema);

module.exports = adminModel;
