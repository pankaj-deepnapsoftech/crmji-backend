const mongoose = require("mongoose");

const organizationSchema = mongoose.Schema({
  account: {
    type: mongoose.Types.ObjectId,
    ref: "Account"
  },
  name: {
    type: String,
    required: [true, "name is a required field"],
  },
  email: {
    type: String,
    required: [true, "email is a required field"],
  },
  phone: {
    type: String,
    required: [true, "phone is a required field"],
  },
  password: {
    type: String,
    required: [true, "password is a required field"],
  },
  company: {
    type: String,
    required: [true, "company is a required field"],
  },
  city: {
    type: String,
    required: [true, "city is a required field"],
  },
  employeeCount: {
    type: Number,
    required: [true, "employeeCount is a required field"],
  },
  profileimage: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
  },
}, {timestamps: true});

const organizationModel = mongoose.model("Organization", organizationSchema);

module.exports = organizationModel;
