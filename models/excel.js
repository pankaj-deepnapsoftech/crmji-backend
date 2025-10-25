const mongoose = require("mongoose");

const excelSchema = mongoose.Schema(
  {
    custumerName: {
      type: String,
      required: true,
    },
    phnNumber: {
      type: String,
      required: true,
    },
    contractType: {
      type: String,
      required: true,
    },
    otherContractType: {
      type: String,
      default: null, // Stores custom contract type if "Other" is selected
    },
    contractNumber: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "renewed"],
      default: "pending",
    },
    doc: {
      type: Date,
    },
    // term: {
    //   type: String,
    // },
    years: {
      type: String,
    },
    months: {
      type: String,
    },
    mode: {
      type: String,
      required: true,
    },
    otherMode: {
      type: String,
      default: null, // Stores custom mode if "Other" is selected
    },
    contractAttachment: {
      type: String,
      default: null,
    },
    renewalDate: {
      type: Date,
    },
    lastRenewalDate: {
      type: Date,
    },

    renewalTimes: {
      type: String,
    },

    remarks: {
      type: String,
    }
  },
  {
    timestamps: true, // Fixed the typo (timeStamps -> timestamps)
  }
);

const excelModel = mongoose.model("Excel", excelSchema);

module.exports = excelModel;
