const mongoose = require("mongoose");
const customerModel = require("./customer");
const proformaInvoiceModel = require("./proformaInvoice");
const invoiceModel = require("./invoice");
const leadModel = require("./lead");
const indiamartLeadModel = require("./indiamart_lead");

let dropLegacyUniqueIdIndexPromise;
const dropLegacyUniqueIdIndexIfExists = async (model) => {
  if (!model?.collection || dropLegacyUniqueIdIndexPromise) {
    return dropLegacyUniqueIdIndexPromise;
  }

  dropLegacyUniqueIdIndexPromise = (async () => {
    try {
      const exists = await model.collection.indexExists("uniqueId_1");
      if (exists) {
        await model.collection.dropIndex("uniqueId_1");
      }
    } catch (error) {
      if (error.codeName !== "IndexNotFound") {
        console.error("Failed to drop legacy uniqueId_1 index", error);
      }
    }
  })();

  return dropLegacyUniqueIdIndexPromise;
};

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
        message:
          "GST number must be exactly 15 characters (capital letters and numbers only)",
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
    },
  },
  { timestamps: true }
);

companySchema.index({ creator: 1, uniqueId: 1 }, { unique: true });

// Hook: Generate per-admin sequential uniqueId like COR-001, COR-002
companySchema.pre("save", async function (next) {
  try {
    await dropLegacyUniqueIdIndexIfExists(this.constructor);

    if (!this.isNew || this.uniqueId) return next();
    if (!this.creator)
      return next(new Error("creator is required to generate uniqueId"));

    const prefix = "COR-";
    const latest = await this.constructor
      .findOne({
        creator: this.creator,
        uniqueId: { $regex: `^${prefix}\\d{3}$` },
      })
      .sort({ uniqueId: -1 })
      .select("uniqueId")
      .lean();

    let nextNum = 1;
    if (latest?.uniqueId) {
      const current = parseInt(latest.uniqueId.slice(-3), 10);
      if (!Number.isNaN(current)) nextNum = current + 1;
    }

    const suffix = String(nextNum).padStart(3, "0");
    this.uniqueId = `${prefix}${suffix}`;
    return next();
  } catch (err) {
    return next(err);
  }
});

// Hook 3: Delete related docs on company delete
companySchema.pre(
  "deleteOne",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?._id !== undefined) {
      await customerModel.deleteMany({ company: docToDelete._id });
      await proformaInvoiceModel.deleteMany({ company: docToDelete._id });
      await invoiceModel.deleteMany({ company: docToDelete._id });
      await leadModel.deleteMany({ company: docToDelete._id });
      await indiamartLeadModel.deleteMany({ company: docToDelete._id });
    }
    next();
  }
);

companySchema.pre(
  "deleteMany",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?._id !== undefined) {
      await customerModel.deleteMany({ company: docToDelete._id });
      await proformaInvoiceModel.deleteMany({ company: docToDelete._id });
      await invoiceModel.deleteMany({ company: docToDelete._id });
      await leadModel.deleteMany({ company: docToDelete._id });
      await indiamartLeadModel.deleteMany({ company: docToDelete._id });
    }
    next();
  }
);

// Remove the broken pre("create") hook — it's invalid
// companySchema.pre("create", { document: true, query: true }, async function (next) { ... }

// ==================== MODEL EXPORT ====================
const companyModel = mongoose.model("Company", companySchema);

module.exports = companyModel;
