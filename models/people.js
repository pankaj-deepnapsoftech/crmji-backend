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

const peopleSchema = mongoose.Schema(
  {
    organization: {
      type: mongoose.Types.ObjectId,
      ref: "Organization",
      required: [true, "organization is a required field"],
    },
    // organization: {
    //   type: mongoose.Types.ObjectId,
    //   ref: "Organization",
    //   required: [true, "Organization is a required field"],
    // },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
      required: [true, "creator is a required field"],
    },
    firstname: {
      type: String,
      required: [true, "firstname is a required field"],
    },
    lastname: {
      type: String,
      // required: [true, "lastname is a required field"],
    },
    email: {
      type: String,
      // required: [true, "email is a required field"],
    },
    phone: {
      type: String,
      // required: [true, "phone is a required field"],
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
    },
    emailSentDate: {
      type: Date,
    },
    whatsappSentDate: {
      type: Date,
    },
    uniqueId: {
      type: String,
    },
    comment: {
      type: String,
      default: "",
    },
    remarksLog: [
      {
        remark: {
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
  },
  { timestamps: true }
);

// Compound unique index: allows same uniqueId for different creators
// but prevents duplicate uniqueId for the same creator
peopleSchema.index({ creator: 1, uniqueId: 1 }, { unique: true });

peopleSchema.pre("save", async function (next) {
  try {
    await dropLegacyUniqueIdIndexIfExists(this.constructor);

    if (!this.isNew || this.uniqueId) return next();
    if (!this.creator)
      return next(new Error("creator is required to generate uniqueId"));

    const prefix = "IND-";
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

peopleSchema.pre(
  "create",
  { document: true, query: true },
  async function (next) {
    const docToCreate = await this.model.create(this.getQuery(), {
      ignoreUndefined: true,
    });
    next();
  }
);

peopleSchema.pre(
  "deleteOne",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?._id !== undefined) {
      await customerModel.deleteMany({ people: docToDelete._id });
      await proformaInvoiceModel.deleteMany({ people: docToDelete._id });
      await leadModel.deleteMany({ people: docToDelete._id });
      await indiamartLeadModel.deleteMany({ people: docToDelete._id });
    }
    next();
  }
);

peopleSchema.pre(
  "deleteMany",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?._id !== undefined) {
      await customerModel.deleteMany({ people: docToDelete._id });
      await proformaInvoiceModel.deleteMany({ people: docToDelete._id });
      await leadModel.deleteMany({ people: docToDelete._id });
      await indiamartLeadModel.deleteMany({ people: docToDelete._id });
    }
    next();
  }
);

const peopleModel = mongoose.model("People", peopleSchema);

module.exports = peopleModel;
