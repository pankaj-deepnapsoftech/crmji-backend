const mongoose = require("mongoose");

const superAdminSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is a required field"],
    },
    email: {
      type: String,
      required: [true, "email is a required field"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "password is a required field"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "phone is a required field"],
    },
    designation: {
      type: String,
      default: "Super Administrator",
    },
    profileimage: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: true, // Super Admin is auto-verified
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one Super Admin can exist
superAdminSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count > 0) {
      throw new Error('Only one Super Admin can exist');
    }
  }
  next();
});

module.exports = mongoose.model("SuperAdmin", superAdminSchema);
