const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema(
  {
    organization: {
      type: mongoose.Types.ObjectId,
      ref: "Organization",
      required: [true, 'organization is a required field']
    },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
      required: [true, "creator is a required field"],
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
      required: [true, "created by is a required field"],
    },
    invoice: {
      type: mongoose.Types.ObjectId,
      ref: "Invoice",
      required: [true, "Invoice is a required field"],
    },
    paymentname: {
      type: String,
      required: [true, "Payment name is a required field"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is a required field"],
    },
    mode: {
      type: String,
      enum: ["Cash", "UPI", "NEFT", "RTGS", "Cheque"],
    },
    reference: String,
    description: String,
  },
  { timestamps: true }
);

const paymentModel = mongoose.model("Payment", paymentSchema);

module.exports = paymentModel;
