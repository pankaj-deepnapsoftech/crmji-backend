const mongoose = require("mongoose");
const offerModel = require("./offer");
const notificationModel = require("./notification");

const leadSchema = mongoose.Schema(
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
    leadtype: {
      type: String,
      enum: ["Company", "People"],
      default: "Company",
    },
    status: {
      type: String,
      enum: [
        "New",
        "Assigned",
        "Meeting Scheduled",
        "Scheduled Demo",
        "Meeting Completed",
        "Demo Completed",
        "In Negotiation",
        "Deal on Hold",
        "Deal Won",
        "Deal Lost",
        "Deal Done",
      ],
      default: "Meeting Scheduled",
    },
    source: {
      type: String,
      enum: [
        "Linkedin",
        "Social Media",
        "Website",
        "Advertising",
        "Friend",
        "Professionals Network",
        "Customer Referral",
        "Sales",
        "Digital Marketing",
        "Upwork",
        "Gem",
        "Freelancer",
        "IndiaMart",
        "Fiverr",
      ],
      default: "Social Media",
    },
    products: {
      type: [
        {
          type: mongoose.Types.ObjectId,
          ref: "Product",
        },
      ],
      required: true,
    },
    people: {
      type: mongoose.Types.ObjectId,
      ref: "People",
    },
    company: {
      type: mongoose.Types.ObjectId,
      ref: "Company",
    },
    notes: {
      type: String,
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
    location: {
      type: String,
    },
    dataBank: {
      type: Boolean,
      default: false,
      required: true,
    },
    prc_qt: {
      type: String,
    },
    leadCategory: {
      type: String,
      enum: ["Hot", "Cold", "Warm"],
    },
    demo: {
      demoDateTime: Date,
      demoType: {
        type: String,
        enum: ["Physical", "Virtual"],
      },
      notes: String,
      remark: String,
    },
    demoPdf: {
      type: String,
    },
    riFile: {
      type: String,
    },
    kyc: {
      annual_turn_over: String,
      company_type: String,
      company_located: String,
      company_tenure: String,
      kyc_remarks: String,
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
  },

  { timestamps: true }
);

leadSchema.pre(
  "deleteMany",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?._id !== undefined) {
      await offerModel.deleteMany({ lead: docToDelete._id });
      await notificationModel.deleteOne({ lead: docToDelete._id });
    }
    next();
  }
);

leadSchema.pre(
  "deleteOne",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?._id !== undefined) {
      await offerModel.deleteMany({ lead: docToDelete._id });
      await notificationModel.deleteOne({ lead: docToDelete._id });
    }
    next();
  }
);

const leadModel = mongoose.model("Lead", leadSchema);

module.exports = leadModel;
