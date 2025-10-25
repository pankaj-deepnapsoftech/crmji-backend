const mongoose = require("mongoose");

const expenseSchema = mongoose.Schema(
  {
    expenseType: {
      type: String,
      enum: ["TA", "DA"],
      required: false,
    },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
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
      required: [true, "Name is a required field"],
    },
    category: {
      type: mongoose.Types.ObjectId,
      ref: "Expense Category",
      required: [true, "Category is a required field"],
    },
    price: {
      type: String,
      required: [true, "Price is a required field"],
    },
    description: {
      type: String,
    },
    ref: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

const expenseModel = mongoose.model("Expense", expenseSchema);

module.exports = expenseModel;
