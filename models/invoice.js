const mongoose = require("mongoose");
const paymentModel = require("./payment");

const invoiceSchema = mongoose.Schema(
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
    invoicename: {
      type: String,
      required: [true, "Invoice name is a required field"],
    },
    customer: {
      type: mongoose.Types.ObjectId,
      required: [true, "Customer is a required field"],
      ref: "Customer",
    },
    status: {
      type: String,
      enum: ["Draft", "Pending", "Sent"],
      default: "Draft",
    },
    paymentstatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid"],
      default: "Unpaid",
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
    paid: {
      type: Number,
      default: 0,
      required: [true, "Paid is a required field"],
    },
    balance: {
      type: Number,
      defualt: 0,
      required: [true, "Balance is a required field"],
    },
  },
  { timestamps: true }
);

invoiceSchema.pre(
  "deleteOne",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?._id !== undefined) {
      await paymentModel.deleteMany({ invoice: docToDelete._id });
    }
    next();
  }
);

invoiceSchema.pre(
  "deleteMany",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?._id !== undefined) {
      await paymentModel.deleteMany({ invoice: docToDelete._id });
    }
    next();
  }
);

const invoiceModel = mongoose.model("Invoice", invoiceSchema);

module.exports = invoiceModel;
