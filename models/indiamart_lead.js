const mongoose = require("mongoose");
const offerModel = require("./offer");
const notificationModel = require("./notification");

const indiamartLeadSchema = mongoose.Schema(
  {
    organization: {
      type: mongoose.Types.ObjectId,
      ref: "Organization",
      required: [true, 'organization is a required field']
    },
    QUERY_TIME: String,
    UNIQUE_QUERY_ID: String,
    SENDER_NAME: String,
    SENDER_MOBILE: String,
    SENDER_EMAIL: String,
    SENDER_COMPANY: String,
    SENDER_ADDRESS: String,
    SENDER_CITY: String,
    SENDER_STATE: String,
    SENDER_PINCODE: String,
    SENDER_COUNTRY_ISO: String,
    SENDER_MOBILE_ALT: String,
    SENDER_EMAIL_ALT: String,
    QUERY_PRODUCT_NAME: String,
    QUERY_MESSAGE: String,
    status: {
      type: String,
      enum: [
        "Draft",
        "New",
        "In Negotiation",
        "Completed",
        "Loose",
        "Cancelled",
        "Assigned",
        "On Hold",
        "Follow Up",
      ],
      default: "New",
    },
    assigned: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
    },
    followup_date: {
      type: Date,
    },
    followup_reason: {
      type: String,
    },
    remarks: String,
    people: {
      type: mongoose.Types.ObjectId,
      ref: "People",
    },
    company: {
      type: mongoose.Types.ObjectId,
      ref: "Company",
    },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
      required: [true, "creator is a required field"],
    },
  },
  { timestamps: true }
);


indiamartLeadSchema.pre(
  "deleteMany",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?._id !== undefined) {
      await offerModel.deleteMany({ indiamartlead: docToDelete._id });
      await notificationModel.deleteOne({ lead: docToDelete._id });
    }
    next();
  }
);

indiamartLeadSchema.pre(
  "deleteOne",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?._id !== undefined) {
      await offerModel.deleteMany({ indiamartlead: docToDelete._id });
      await notificationModel.deleteOne({ lead: docToDelete._id });
    }
    next();
  }
);
const indiamartLeadModel = mongoose.model(
  "Indiamart Lead",
  indiamartLeadSchema
);

module.exports = indiamartLeadModel;
