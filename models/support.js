const mongoose = require("mongoose");

const supportSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is a required field"],
    },
    mobile: {
      type: String,
      required: [true, "mobile is a required field"],
    },
    description: {
      type: String,
      required: [true, "description is a required field"],
    },
    purpose: {
      type: String,
      enum: ["purchase", "support"],
      required: [true, "purpose is a required field"],
    },
    assigned: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
    },
    status: {
      type: String,
      enum: [
        "accepted",
        "rejected",
        "under process",
        "completed",
        "new",
        "assigned",
      ],
      default: "new",
    },
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const supportModel = mongoose.model("Support", supportSchema);

module.exports = supportModel;
