const mongoose = require("mongoose");

const otpSchema = mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: [true, "Email is a required field"],
  },
  otp: {
    type: String,
    required: [true, "Reset token is a required field"],
  },
  createdAt: {
    type: Date,
    expires: "5m",
    default: Date.now,
  },
});

const otpModel = mongoose.model("OTP", otpSchema);

module.exports = otpModel;
