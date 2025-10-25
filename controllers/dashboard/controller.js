const { TryCatch } = require("../../helpers/error");
const invoiceModel = require("../../models/invoice");
const proformaInvoiceModel = require("../../models/proformaInvoice");
const offerModel = require("../../models/offer");
const customerModel = require("../../models/customer");
const productCategoryModel = require("../../models/productCategory");
const productModel = require("../../models/product");
const leadModel = require("../../models/lead");
const adminModel = require("../../models/admin");
const mongoose = require("mongoose");
const supportModel = require("../../models/support");
const indiamartLeadModel = require("../../models/indiamart_lead");
const peopleModel = require("../../models/people");
const companyModel = require("../../models/company");

const invoiceSummary = TryCatch(async (req, res) => {
  const { fromDate: from, toDate: to, employee } = req.body;

  if (!from || !to) {
    throw new Error("Missing required date fields", 400);
  }

  const query = {
    organization: new mongoose.Types.ObjectId(req.user.organization),
  };
  if (req.user.role !== "Super Admin") {
    query.creator = new mongoose.Types.ObjectId(req.user.id);
  } else {
    if (employee) {
      const isExistingEmployee = await adminModel.findOne({ email: employee });
      if (isExistingEmployee) {
        query.creator = new mongoose.Types.ObjectId(isExistingEmployee._id);
        query.organization = new mongoose.Types.ObjectId(
          isExistingEmployee.organization
        );
      }
    }
  }

  const totalInvoiceStatus = await invoiceModel
    .find({
      ...query,
      $or: [{ status: "Draft" }, { status: "Pending" }, { status: "Sent" }],
    })
    .countDocuments();
  const totalInvoicePaymentStatus = await invoiceModel
    .find({
      ...query,
      $or: [
        { status: "Unpaid" },
        { status: "Partially Paid" },
        { status: "Paid" },
      ],
    })
    .countDocuments();

  const statusValues = await invoiceModel.schema.path("status").enumValues;
  const paymentstatusValues = await invoiceModel.schema.path("paymentstatus")
    .enumValues;

  const invoiceStatusStats = await invoiceModel.aggregate([
    {
      $match: {
        updatedAt: {
          $lte: new Date(to),
          $gte: new Date(from),
        },
        ...query,
      },
    },
    {
      $project: {
        status: 1,
      },
    },
    {
      $group: {
        _id: `$status`,
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const invoicePaymentStatusStats = await invoiceModel.aggregate([
    {
      $match: {
        updatedAt: {
          $lte: new Date(to),
          $gte: new Date(from),
        },
        ...query,
      },
    },
    {
      $project: {
        paymentstatus: 1,
      },
    },
    {
      $group: {
        _id: `$paymentstatus`,
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const modifiedStatus = statusValues.map((status) => {
    const ind = invoiceStatusStats.findIndex(
      (invoice) => invoice._id === status
    );

    if (ind === -1) {
      return {
        status: status,
        count: 0,
      };
    } else {
      return {
        status: status,
        count: invoiceStatusStats[ind].count,
      };
    }
  });

  const modifiedPaymentStatus = paymentstatusValues.map((status) => {
    const ind = invoicePaymentStatusStats.findIndex(
      (invoice) => invoice._id === status
    );

    if (ind === -1) {
      return {
        status: status,
        count: 0,
      };
    } else {
      return {
        status: status,
        count: invoicePaymentStatusStats[ind].count,
      };
    }
  });

  const totalInvoices = await invoiceModel.find({ ...query }).countDocuments();

  res.status(200).json({
    status: 200,
    success: true,
    invoices: [...modifiedStatus, ...modifiedPaymentStatus],
    totalInvoiceStatus,
    totalInvoicePaymentStatus,
    totalInvoices,
  });
});

const offerSummary = TryCatch(async (req, res) => {
  const { fromDate: from, toDate: to, employee } = req.body;

  if (!from || !to) {
    throw new Error("Missing required date fields", 400);
  }

  const query = {
    organization: new mongoose.Types.ObjectId(req.user.organization),
  };
  if (req.user.role !== "Super Admin") {
    query.creator = new mongoose.Types.ObjectId(req.user.id);
  } else {
    if (employee) {
      const isExistingEmployee = await adminModel.findOne({ email: employee });
      if (isExistingEmployee) {
        query.creator = new mongoose.Types.ObjectId(isExistingEmployee._id);
        query.organization = new mongoose.Types.ObjectId(
          isExistingEmployee.organization
        );
      }
    }
  }

  const offerStatusValues = await offerModel.schema.path("status").enumValues;

  const totalOffers = await offerModel.find(query).countDocuments();
  const offerStatusStats = await offerModel.aggregate([
    {
      $match: {
        updatedAt: {
          $lte: new Date(to),
          $gte: new Date(from),
        },
        // creator: query?.creator || { $exists: true },
        ...query,
      },
    },
    {
      $project: {
        status: 1,
      },
    },
    {
      $group: {
        _id: `$status`,
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const modifiedStatus = offerStatusValues.map((status) => {
    const ind = offerStatusStats.findIndex((offer) => offer._id === status);

    if (ind === -1) {
      return {
        status: status,
        count: 0,
      };
    } else {
      return {
        status: status,
        count: offerStatusStats[ind].count,
      };
    }
  });

  res.status(200).json({
    status: 200,
    success: true,
    offers: [...modifiedStatus],
    totalOffers,
  });
});

const proformaInvoiceSummary = TryCatch(async (req, res) => {
  const { fromDate: from, toDate: to, employee } = req.body;

  if (!from || !to) {
    throw new Error("Missing required date fields", 400);
  }

  const query = {
    organization: new mongoose.Types.ObjectId(req.user.organization),
  };
  if (req.user.role !== "Super Admin") {
    query.creator = new mongoose.Types.ObjectId(req.user.id);
  } else {
    if (employee) {
      const isExistingEmployee = await adminModel.findOne({ email: employee });
      if (isExistingEmployee) {
        query.creator = new mongoose.Types.ObjectId(isExistingEmployee._id);
      }
    }
  }

  const totalProformaInvoices = await proformaInvoiceModel
    .find(query)
    .countDocuments();
  const proformaInvoiceStatusValues = await proformaInvoiceModel.schema.path(
    "status"
  ).enumValues;
  const proformaInvoiceStatusStats = await proformaInvoiceModel.aggregate([
    {
      $match: {
        updatedAt: {
          $lte: new Date(to),
          $gte: new Date(from),
        },
        // creator: query?.creator || { $exists: true },
        ...query,
      },
    },
    {
      $project: {
        status: 1,
      },
    },
    {
      $group: {
        _id: `$status`,
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const modifiedStatus = proformaInvoiceStatusValues.map((status) => {
    const ind = proformaInvoiceStatusStats.findIndex((pi) => pi._id === status);

    if (ind === -1) {
      return {
        status: status,
        count: 0,
      };
    } else {
      return {
        status: status,
        count: proformaInvoiceStatusStats[ind].count,
      };
    }
  });

  res.status(200).json({
    status: 200,
    success: true,
    proformaInvoices: [...modifiedStatus],
    totalProformaInvoices,
  });
});

const customerSummary = TryCatch(async (req, res) => {
  const { employee } = req.body;
  const query = {
    organization: new mongoose.Types.ObjectId(req.user.organization),
  };
  if (req.user.role !== "Super Admin") {
    query.creator = new mongoose.Types.ObjectId(req.user.id);
  } else {
    if (employee) {
      const isExistingEmployee = await adminModel.findOne({ email: employee });
      if (isExistingEmployee) {
        query.creator = new mongoose.Types.ObjectId(isExistingEmployee._id);
      }
    }
  }

  const totalCustomers = await customerModel.find(query).countDocuments();

  res.status(200).json({
    status: 200,
    success: true,
    totalCustomers,
  });
});

const amountSummary = TryCatch(async (req, res) => {
  const { fromDate: from, toDate: to, employee } = req.body;

  if (!from || !to) {
    throw new Error("Missing required date fields", 400);
  }

  const query = {
    organization: new mongoose.Types.ObjectId(req.user.organization),
  };
  if (req.user.role !== "Super Admin") {
    query.creator = new mongoose.Types.ObjectId(req.user.id);
  } else {
    if (employee) {
      const isExistingEmployee = await adminModel.findOne({ email: employee });
      if (isExistingEmployee) {
        query.creator = new mongoose.Types.ObjectId(isExistingEmployee._id);
      }
    }
  }

  const totalInvoice = await invoiceModel.aggregate([
    {
      $match: {
        updatedAt: {
          $lte: new Date(to),
          $gte: new Date(from),
        },
        ...query,
      },
    },
    {
      $project: {
        total: 1,
      },
    },
    {
      $group: {
        _id: "invoice",
        count: {
          $sum: "$total",
        },
      },
    },
  ]);

  const totalProformaInvoice = await proformaInvoiceModel.aggregate([
    {
      $match: {
        updatedAt: {
          $lte: new Date(to),
          $gte: new Date(from),
        },
        ...query,
      },
    },
    {
      $project: {
        total: 1,
      },
    },
    {
      $group: {
        _id: "proforma_invoice",
        count: {
          $sum: "$total",
        },
      },
    },
  ]);

  const totalOffer = await offerModel.aggregate([
    {
      $match: {
        updatedAt: {
          $lte: new Date(to),
          $gte: new Date(from),
        },
        ...query,
      },
    },
    {
      $project: {
        total: 1,
      },
    },
    {
      $group: {
        _id: "offer",
        count: {
          $sum: "$total",
        },
      },
    },
  ]);

  const totalUnpaidInvoice = await invoiceModel.aggregate([
    {
      $match: {
        updatedAt: {
          $lte: new Date(to),
          $gte: new Date(from),
        },
        paymentstatus: "Unpaid",
        ...query,
      },
    },
    {
      $project: {
        total: 1,
      },
    },
    {
      $group: {
        _id: "invoice",
        count: {
          $sum: "$total",
        },
      },
    },
  ]);

  res.status(200).json({
    status: 200,
    success: true,
    totalInvoiceAmount: totalInvoice.length > 0 ? totalInvoice[0].count : 0,
    totalInvoices: totalInvoice.length,
    totalProformaInvoiceAmount:
      totalProformaInvoice.length > 0 ? totalProformaInvoice[0].count : 0,
    totalProformaInvoices: totalProformaInvoice.length,
    totalOfferAmount: totalOffer.length > 0 ? totalOffer[0].count : 0,
    totalOffers: totalOffer.length,
    totalUnpaidInvoiceAmount:
      totalUnpaidInvoice.length > 0 ? totalUnpaidInvoice[0].count : 0,
    totalUnpaidInvoices: totalUnpaidInvoice.length,
  });
});

const productSummary = TryCatch(async (req, res) => {
  // let creator = null;
  // if(req.user.role !== 'Super Admin'){
  //   creator = req.user.id;
  // }

  const categories = await productCategoryModel.find({
    organization: req.user.organization,
  });
  const products = await productModel
    .find({ organization: req.user.organization })
    .populate("category");

  res.status(200).json({
    status: 200,
    success: true,
    products,
    categories,
  });
});

const totalFollowUps = TryCatch(async (req, res) => {
  const { fromDate: from, toDate: to } = req.body;

  const query = {
    organization: new mongoose.Types.ObjectId(req.user.organization),
  };
  if (req.user.role !== "Super Admin") {
    query.creator = new mongoose.Types.ObjectId(req.user.id);
  }

  const leads = await leadModel
    .find({
      ...query,
      status: "Follow Up",
      followup_date: {
        $lte: new Date(to),
        $gte: new Date(from),
      },
    })
    .populate("creator people company");

  res.status(200).json({
    status: 200,
    success: true,
    leads,
  });
});

const leadsSummary = TryCatch(async (req, res) => {
  const { fromDate: from, toDate: to, employee } = req.body;

  if (!from || !to) {
    throw new Error("Missing required date fields", 400);
  }

  const query = {
    organization: new mongoose.Types.ObjectId(req.user.organization),
  };
  if (req.user.role !== "Super Admin") {
    query.creator = new mongoose.Types.ObjectId(req.user.id);
  } else {
    if (employee) {
      const isExistingEmployee = await adminModel.findOne({ email: employee });
      if (isExistingEmployee) {
        query.creator = new mongoose.Types.ObjectId(isExistingEmployee._id);
      }
    }
  }

  const totalLeads = await leadModel.find({
    createdAt: {
      $lte: new Date(to),
      $gte: new Date(from),
    },
  }).countDocuments();

  const leads = await leadModel.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(to),
          $gte: new Date(from),
        },
        $or: [
          { status: "Follow Up" },
          { status: "Completed" },
          { status: "Cancelled" },
        ],
        ...query,
      },
    },
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const indiamartleads = await indiamartLeadModel.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(to),
          $gte: new Date(from),
        },
        $or: [
          { status: "Follow Up" },
          { status: "Completed" },
          { status: "Cancelled" },
        ],
        // ...query || { $exists: true },
        ...query,
      },
    },
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  let results = ["Completed", "Cancelled", "Follow Up"].map((status) => {
    const lead = [...leads, ...indiamartleads].filter(
      (lead) => lead._id === status
    );
    let count = 0;
    for (item of lead) {
      count += item.count;
    }
    return {
      [status]: lead.length > 0 ? count : 0,
    };
  });
  results = {
    ...results[0],
    ...results[1],
    ...results[2],
  };

  res.status(200).json({
    status: 200,
    success: true,
    leads: results,
    totalLeads
  });
});

// const employeePerformanceSummary = TryCatch(async (req, res) => {
//   const { fromDate: from, toDate: to } = req.body;

//   let creator = null;
//   if (req.user.role !== "Super Admin") {
//     creator = req.user.id;
//   }

//   const leads = await leadModel.aggregate([
//     {
//       $match: {
//         followup_date: {
//           $lte: new Date(to),
//           $gte: new Date(from),
//         },
//         creator: creator || { $exists: true },
//       },
//     },
//   ]);
// });

const getSupportSummary = TryCatch(async (req, res) => {
  const { fromDate: from, toDate: to } = req.body;

  const query = {
    organization: new mongoose.Types.ObjectId(req.user.organization),
  };
  if (req.user.role !== "Super Admin") {
    query.creator = new mongoose.Types.ObjectId(req.user.id);
  }

  const supports = await supportModel.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(to),
          $gte: new Date(from),
        },
        $or: [
          { status: "new" },
          { status: "assigned" },
          { status: "under process" },
          { status: "completed" },
        ],
        ...query,
      },
    },
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  let results = ["new", "assigned", "under process", "completed"].map(
    (status) => {
      let count = 0;
      const support = supports.filter((lead) => lead._id === status);
      return {
        [status]: support.length > 0 ? support[0]?.count : 0,
      };
    }
  );

  results = {
    ...results[0],
    ...results[1],
    ...results[2],
    ...results[3],
  };

  res.status(200).json({
    status: 200,
    success: true,
    support: results,
  });
});

const getEmployeeSummary = TryCatch(async (req, res) => {
  const totalEmployees = await adminModel.find({role: 'Admin', organization: req.user.organization}).countDocuments();

  res.status(200).json({
    status: 200,
    success: true,
    totalEmployees
  })
})

const getPeopleSummary = TryCatch(async (req, res) => {
  const totalPeople = await peopleModel.find({organization: req.user.organization}).countDocuments();

  res.status(200).json({
    status: 200,
    success: true,
    totalPeople
  })
})

const getCompanySummary = TryCatch(async (req, res) => {
  const totalCompanies = await companyModel.find({organization: req.user.organization}).countDocuments();

  res.status(200).json({
    status: 200,
    success: true,
    totalCompanies
  })
})

module.exports = {
  invoiceSummary,
  offerSummary,
  proformaInvoiceSummary,
  customerSummary,
  amountSummary,
  productSummary,
  leadsSummary,
  getSupportSummary,
  getEmployeeSummary,
  getPeopleSummary,
  getCompanySummary
};
