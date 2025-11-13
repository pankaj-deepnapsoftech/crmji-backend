const mongoose = require("mongoose");
const proformaInvoiceModel = require("./proformaInvoice");
const invoiceModel = require("./invoice");
const leadModel = require("./lead");

const customerSchema = mongoose.Schema(
  {
    customerId: {
      type: String,
      // Not marking unique to avoid index migration issues on existing data
      // Ensure uniqueness in controller while generating
    },
    organization: {
      type: mongoose.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is a required field"],
    },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
      required: [true, "creator is a required field"],
    },
    customertype: {
      type: String,
      default: "Company",
      enum: ["Company", "People"],
      required: true,
    },
    people: {
      type: mongoose.Types.ObjectId,
      ref: "People",
    },
    company: {
      type: mongoose.Types.ObjectId,
      ref: "Company",
    },
    status: {
      type: String,
      enum: [
        "Deal Done",
        "Proforma Invoice Sent",
        "Invoice Sent",
        "Payment Received",
      ],
      default: "Deal Done",
    },
    lastPaymentAmount: {
      type: Number,
    },
    products: {
      type: [
        {
          type: mongoose.Types.ObjectId,
          ref: "Product",
        },
      ],
      // required: true,
    },
  },
  { timestamps: true }
);

customerSchema.pre(
  "deleteOne",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?.people !== undefined) {
      await proformaInvoiceModel.deleteMany({ people: docToDelete.people });
      await invoiceModel.deleteMany({ people: docToDelete.people });
      await leadModel.deleteMany({ people: docToDelete.people });
    } else if (docToDelete?.company !== undefined) {
      await proformaInvoiceModel.deleteMany({ company: docToDelete.company });
      await invoiceModel.deleteMany({ company: docToDelete.company });
      await leadModel.deleteMany({ company: docToDelete.company });
    }
    next();
  }
);

customerSchema.pre(
  "deleteMany",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?.people !== undefined) {
      await proformaInvoiceModel.deleteMany({ people: docToDelete.people });
      await invoiceModel.deleteMany({ customer: docToDelete._id });
      await leadModel.deleteMany({ people: docToDelete.people });
    } else if (docToDelete?.company !== undefined) {
      await proformaInvoiceModel.deleteMany({ company: docToDelete.company });
      await invoiceModel.deleteMany({ customer: docToDelete._id });
      await leadModel.deleteMany({ company: docToDelete.company });
    }
    next();
  }
);

const customerModel = mongoose.model("Customer", customerSchema);

module.exports = customerModel;
