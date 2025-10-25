const mongoose = require("mongoose");

const accountSchema = mongoose.Schema(
  {
    organization: {
      type: mongoose.Types.ObjectId,
      ref: "Organization",
      required: [true, "organization is a required field"],
    },
    account_name: {
      type: String,
      enum: ["Trial Plan", "Monthly Plan", "Lifetime Plan"],
      default: "Trial Plan",
    },
    account_type: {
      type: String,
      enum: ["trial", "subscription", "fulltime"],
      default: "trial",
    },
    account_status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    trial_started: {
      type: Boolean,
      default: false,
    },
    trial_start: {
      type: Date,
    },
    // payment_status: {
    //     type: String,
    //     enum: ["success", 'failed'],
    //     required: [true, "payment_status is a required field"]
    // },
    subscription: {
      type: mongoose.Types.ObjectId,
      ref: "Subscription",
    },
  },
  {
    timestamps: true,
  }
);

const accountModel = mongoose.model("Account", accountSchema);

module.exports = accountModel;
