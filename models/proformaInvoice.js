const mongoose = require("mongoose");

const proformaInvoiceSchema = mongoose.Schema(
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
    proformainvoicename: {
      type: String,
      required: [true, "Proforma invoice name is a required field"],
    },
    // customer: {
    //     type: mongoose.Types.ObjectId,
    //     required: [true, 'Customer is a required field'],
    //     ref: "Customer"
    // },
    people: {
      type: mongoose.Types.ObjectId,
      // required: [true, 'Customer is a required field'],
      ref: "People",
    },
    company: {
      type: mongoose.Types.ObjectId,
      // required: [true, 'Customer is a required field'],
      ref: "Company",
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
      // required: [true, 'Expire date is a required field']
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

const proformaInvoiceModel = mongoose.model(
  "Proforma Invoice",
  proformaInvoiceSchema
);

module.exports = proformaInvoiceModel;
