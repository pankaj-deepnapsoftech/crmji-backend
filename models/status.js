const mongoose = require("mongoose");

const statusSchema = mongoose.Schema(
  {
    organization: {
      type: mongoose.Types.ObjectId,
      ref: "Organization",
      required: [true, "organization is a required field"],
    },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
      required: [true, "creator is a required field"],
    },
    name: {
      type: String,
      required: [true, "status name is a required field"],
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
statusSchema.index({ organization: 1, isActive: 1 });

const statusModel = mongoose.model("Status", statusSchema);

module.exports = statusModel;
