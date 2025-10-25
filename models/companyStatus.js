const mongoose = require("mongoose");

const companyStatusSchema = mongoose.Schema(
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
    name: {
      type: String,
      required: [true, "Status name is a required field"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Ensure only 6 statuses per organization
companyStatusSchema.index({ organization: 1, isActive: 1 });

const companyStatusModel = mongoose.model("CompanyStatus", companyStatusSchema);

module.exports = companyStatusModel;
