const mongoose = require("mongoose");
const customerModel = require("./customer");
const proformaInvoiceModel=require("./proformaInvoice");
const invoiceModel = require("./invoice");
const leadModel = require("./lead");
const indiamartLeadModel = require("./indiamart_lead");

const companySchema = mongoose.Schema(
  {
    organization: {
      type: mongoose.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is a required field"],
    },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
      required: [true, "creator is a required field"],
    },
    companyname: {
      type: String,
      required: [true, "corporate name is a required field"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    contactPersonName: {
      type: String,
      required: [true, "Contact Person Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: "Phone number must be exactly 10 digits",
      },
    },
    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    gst_no: {
      type: String,
      uppercase: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^[A-Z0-9]{15}$/.test(v);
        },
        message: "GST number must be exactly 15 characters (capital letters and numbers only)",
      },
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    additionalContacts: [
      {
        name: { type: String, trim: true },
        phone: {
          type: String,
          validate: {
            validator: function (v) {
              if (!v) return true;
              return /^\d{10}$/.test(v);
            },
            message: "Phone number must be exactly 10 digits",
          },
        },
        designation: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
      },
    ],
    status: {
      type: String,
      default: "",
    },
    comments: [
      {
        comment: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        createdBy: {
          type: mongoose.Types.ObjectId,
          ref: "Admin",
          required: true,
        },
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    otp: {
      type: Number,
    },
    expiry: {
      type: Date, // Fixed: was String, now Date
    },
    verify: {
      type: Boolean,
      default: false,
    },
    uniqueId: {
      type: String,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

// ==================== ALL HOOKS (UNCHANGED + PRESERVED) ====================

// Hook 1: Generate uniqueId like COR-123
companySchema.pre("save", async function (next) {
  if (!this.isNew || this.uniqueId) return next();
  const gen = () => `COR-${Array.from({ length: 3 }, () => Math.floor(Math.random() * 9) + 1).join("")}`;
  try {
    let attempts = 0;
    let candidate = gen();
    while (attempts < 5) {
      const exists = await this.constructor.exists({ uniqueId: candidate });
      if (!exists) {
        this.uniqueId = candidate;
        break;
      }
      attempts += 1;
      candidate = gen();
    }
    if (!this.uniqueId) {
      return next(new Error("Failed to generate uniqueId for Company after multiple attempts"));
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

// Hook 2: Auto-generate sequential uniqueId like CORP-000001
companySchema.pre("save", async function (next) {
  try {
    if (this.uniqueId || !this.organization) return next();
    const prefix = "CORP-";
    const latest = await this.constructor
      .findOne({
        organization: this.organization,
        uniqueId: { $regex: `^${prefix}\\d{6}$` },
      })
      .sort({ uniqueId: -1 })
      .select("uniqueId")
      .lean();
    let nextNum = 1;
    if (latest?.uniqueId) {
      const current = parseInt(latest.uniqueId.slice(-6), 10);
      if (!Number.isNaN(current)) nextNum = current + 1;
    }
    const suffix = String(nextNum).padStart(6, "0");
    this.uniqueId = `${prefix}${suffix}`;
    next();
  } catch (err) {
    next(err);
  }
});

// Hook 3: Delete related docs on company delete
companySchema.pre("deleteOne", { document: true, query: true }, async function (next) {
  const docToDelete = await this.model.findOne(this.getQuery());
  if (docToDelete?._id !== undefined) {
    await customerModel.deleteMany({ company: docToDelete._id });
    await proformaInvoiceModel.deleteMany({ company: docToDelete._id });
    await invoiceModel.deleteMany({ company: docToDelete._id });
    await leadModel.deleteMany({ company: docToDelete._id });
    await indiamartLeadModel.deleteMany({ company: docToDelete._id });
  }
  next();
});

companySchema.pre("deleteMany", { document: true, query: true }, async function (next) {
  const docToDelete = await this.model.findOne(this.getQuery());
  if (docToDelete?._id !== undefined) {
    await customerModel.deleteMany({ company: docToDelete._id });
    await proformaInvoiceModel.deleteMany({ company: docToDelete._id });
    await invoiceModel.deleteMany({ company: docToDelete._id });
    await leadModel.deleteMany({ company: docToDelete._id });
    await indiamartLeadModel.deleteMany({ company: docToDelete._id });
  }
  next();
});

// Remove the broken pre("create") hook — it's invalid
// companySchema.pre("create", { document: true, query: true }, async function (next) { ... }

// ==================== MODEL EXPORT ====================
const companyModel = mongoose.model("Company", companySchema);

module.exports = companyModel;