const mongoose = require("mongoose");
const customerModel = require("./customer");
const proformaInvoiceModel = require("./proformaInvoice");
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
    },
    email: {
      type: String,
      // required: [true, "email is a required field"],
    },
    contact: {
      type: String,
    },
    phone: {
      type: String,
    },
    website: {
      type: String,
    },
    gst_no: {
      type: String,
    },
    address: {
      type: String,
    },
    secondPersonName: {
      type: String,
    },
    secondPersonContact: {
      type: String,
    },
    secondPersonDesignation: {
      type: String,
    },
    status: {
      type: String,
      default: "",
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    otp: {
      type: Number,
    },
    expiry: {
      type: String,
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

companySchema.pre("save", async function (next) {
  if (!this.isNew || this.uniqueId) return next();
  const gen = () => `COR-${Array.from({ length: 3 }, () => Math.floor(Math.random() * 9) + 1).join("")}`;
  try {
    let attempts = 0;
    let candidate = gen();
    while (attempts < 5) {
      // eslint-disable-next-line no-await-in-loop
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

companySchema.pre(
  "create",
  { document: true, query: true },
  async function (next) {
    const docToCreate = await this.model.create(this.getQuery(), {
      ignoreUndefined: true,
    });
    next();
  }
);

companySchema.pre(
  "deleteOne",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?._id !== undefined) {
      await customerModel.deleteMany({ company: docToDelete._id });
      await proformaInvoiceModel.deleteMany({ company: docToDelete._id });
      await leadModel.deleteMany({ company: docToDelete._id });
      await indiamartLeadModel.deleteMany({ company: docToDelete._id });
    }
    next();
  }
);

// Auto-generate sequential uniqueId per organization on save if missing
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

companySchema.pre(
  "deleteMany",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?._id !== undefined) {
      await customerModel.deleteMany({ company: docToDelete._id });
      await proformaInvoiceModel.deleteMany({ company: docToDelete._id });
      await leadModel.deleteMany({ company: docToDelete._id });
      await indiamartLeadModel.deleteMany({ company: docToDelete._id });
    }
    next();
  }
);

const companyModel = mongoose.model("Company", companySchema);

module.exports = companyModel;
