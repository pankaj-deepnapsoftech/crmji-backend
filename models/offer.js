const mongoose = require("mongoose");

const offerSchema = mongoose.Schema(
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
    offername: {
      type: String,
      required: [true, "Offer name is a required field"],
    },
    lead: {
      type: mongoose.Types.ObjectId,
      ref: "Lead",
    },
    indiamartlead: {
      type: mongoose.Types.ObjectId,
      ref: "Indiamart Lead",
    },
    status: {
      type: String,
      enum: ["Draft", "Pending", "Sent", "Accepted", "Declined"],
      default: "Draft",
    },
    startdate: {
      type: Date,
      default: Date.now,
    },
    expiredate: {
      type: Date,
      required: [true, "Expire date is a required field"],
    },
    remarks: {
      type: String,
    },
    products: {
      type: [
        {
          product: {
            type: mongoose.Types.ObjectId,
            ref: "Product",
            required: [true, "Product Id is a required field"],
          },
          quantity: {
            type: Number,
            required: [true, "Quantity is a required field"],
          },
          price: {
            type: Number,
            required: [true, "Price is a required field"],
          },
          total: {
            type: Number,
            required: [true, "Total is a required field"],
          },
        },
      ],
      required: true,
    },
    subtotal: {
      type: Number,
      required: [true, "Sub total is a required field"],
    },
    tax: {
      type: [
        {
          taxpercentage: Number,
          taxamount: Number,
          taxname: String,
        },
      ],
      default: {
        taxpercentage: 0,
        taxamount: 0,
        taxname: "No tax 0%",
      },
    },
    total: {
      type: Number,
      required: [true, "Total is a required field"],
    },
  },
  { timestamps: true }
);

const offerModel = mongoose.model("Offer", offerSchema);
module.exports = offerModel;
