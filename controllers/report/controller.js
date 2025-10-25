const { TryCatch } = require("../../helpers/error");
const paymentModel = require("../../models/payment");
const expenseModel = require("../../models/expense");
const mongoose = require("mongoose");
const peopleModel = require("../../models/people");
const companyModel = require("../../models/company");
const leadModel = require("../../models/lead");
const moment = require('moment');

const getPaymentReport = TryCatch(async (req, res) => {
  const { from, to } = req.body;

  if (!from || !to) {
    throw new Error("Missing required date fields", 400);
  }

  const query = {
    organization: new mongoose.Types.ObjectId(req.user.organization),
  };
  if (req.user.role !== "Super Admin") {
    query.creator = new mongoose.Types.ObjectId(req.user.id);
  }

  const payments = await paymentModel.aggregate([
    {
      $match: {
        updatedAt: {
          $gte: new Date(from),
          $lte: new Date(to),
        },
        // creator: query?.creator || { $exists: true }
        ...query,
      },
    },
    {
      $project: {
        amount: 1,
        month: { $dateToString: { format: "%m", date: "$createdAt" } },
      },
    },
    {
      $group: {
        _id: "$month",
        total_amount: {
          $sum: "$amount",
        },
      },
    },
  ]);

  res.status(200).json({
    status: 200,
    success: true,
    payments,
  });
});

const getExpenseReport = TryCatch(async (req, res) => {
  const { from, to } = req.body;

  if (!from || !to) {
    throw new Error("Missing required date fields", 400);
  }

  const query = {
    organization: new mongoose.Types.ObjectId(req.user.organization),
  };
  if (req.user.role !== "Super Admin") {
    query.creator = new mongoose.Types.ObjectId(req.user.id);
    query.organization = new mongoose.Types.ObjectId(req.user.organization);
  }

  const expenses = await expenseModel.aggregate([
    {
      $match: {
        updatedAt: {
          $gte: new Date(from),
          $lte: new Date(to),
        },
        // creator: query?.creator || { $exists: true }
        ...query,
      },
    },
    {
      $project: {
        price: {
          $convert: {
            input: "$price",
            to: "int",
          },
        },
        month: { $dateToString: { format: "%m", date: "$createdAt" } },
      },
    },
    {
      $group: {
        _id: "$month",
        total_amount: {
          $sum: "$price",
        },
      },
    },
  ]);

  res.status(200).json({
    status: 200,
    success: true,
    expenses,
  });
});

const getIndividualReport = TryCatch(async (req, res) => {
  const { from, to } = req.body;

  if (!from || !to) {
    throw new Error("Missing required date fields", 400);
  }

  const query = {
    organization: new mongoose.Types.ObjectId(req.user.organization),
  };
  if (req.user.role !== "Super Admin") {
    query.creator = new mongoose.Types.ObjectId(req.user.id);
  }

  let start = moment(new Date(from)).startOf("day");
  let end = moment(new Date(to)).endOf("day");

  const individuals = await peopleModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start.toDate(),
          $lte: end.toDate(),
        },
        // creator: query?.creator || { $exists: true }
        ...query,
      },
    },
    {
      $project: {
        date: { $dateToString: { format: "%d", date: "$createdAt" } },
      },
    },
    {
      $group: {
        _id: "$date",
        total_count: {
          $sum: 1,
        },
      },
    },
  ]);

  const dateInRanges = Array(end.date()).fill(0);
  individuals.forEach(obj => dateInRanges[+obj._id-1] = +obj.total_count)

  res.status(200).json({
    status: 200,
    success: true,
    individuals: dateInRanges,
  });
});

const getCorporateReport = TryCatch(async (req, res) => {
  const { from, to } = req.body;

  if (!from || !to) {
    throw new Error("Missing required date fields", 400);
  }

  const query = {
    organization: new mongoose.Types.ObjectId(req.user.organization),
  };
  if (req.user.role !== "Super Admin") {
    query.creator = new mongoose.Types.ObjectId(req.user.id);
  }

  let start = moment(new Date(from)).startOf("day");
  let end = moment(new Date(to)).endOf("day");

  const corporates = await companyModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start.toDate(),
          $lte: end.toDate(),
        },
        // creator: query?.creator || { $exists: true }
        ...query,
      },
    },
    {
      $project: {
        date: { $dateToString: { format: "%d", date: "$createdAt" } },
      },
    },
    {
      $group: {
        _id: "$date",
        total_count: {
          $sum: 1,
        },
      },
    },
  ]);

  const dateInRanges = Array(end.date()).fill(0);
  corporates.forEach(obj => dateInRanges[+obj._id-1] = +obj.total_count)

  res.status(200).json({
    status: 200,
    success: true,
    corporates: dateInRanges
  });
});

const getLeadsReport = TryCatch(async (req, res) => {
  const { from, to } = req.body;

  if (!from || !to) {
    throw new Error("Missing required date fields", 400);
  }

  const query = {
    organization: new mongoose.Types.ObjectId(req.user.organization),
  };
  if (req.user.role !== "Super Admin") {
    query.creator = new mongoose.Types.ObjectId(req.user.id);
  }

  let start = moment(new Date(from)).startOf("day");
  let end = moment(new Date(to)).endOf("day");

  const leads = await leadModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start.toDate(),
          $lte: end.toDate(),
        },
        // creator: query?.creator || { $exists: true }
        ...query,
      },
    },
    {
      $project: {
        date: { $dateToString: { format: "%d", date: "$createdAt" } },
      },
    },
    {
      $group: {
        _id: "$date",
        total_count: {
          $sum: 1,
        },
      },
    },
  ]);

  const dateInRanges = Array(end.date()).fill(0);
  leads.forEach(obj => dateInRanges[+obj._id-1] = +obj.total_count);

  res.status(200).json({
    status: 200,
    success: true,
    leads: dateInRanges
  });
});

const getFollowupLeadsReport = TryCatch(async (req, res) => {
  const { from, to } = req.body;

  if (!from || !to) {
    throw new Error("Missing required date fields", 400);
  }

  const query = {
    status: "Follow Up",
    organization: new mongoose.Types.ObjectId(req.user.organization),
  };
  if (req.user.role !== "Super Admin") {
    query.creator = new mongoose.Types.ObjectId(req.user.id);
  }

  let start = moment(new Date(from)).startOf("day");
  let end = moment(new Date(to)).endOf("day");

  const leads = await leadModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start.toDate(),
          $lte: end.toDate(),
        },
        // creator: query?.creator || { $exists: true }
        ...query,
      },
    },
    {
      $project: {
        date: { $dateToString: { format: "%d", date: "$createdAt" } },
      },
    },
    {
      $group: {
        _id: "$date",
        total_count: {
          $sum: 1,
        },
      },
    },
  ]);

  const dateInRanges = Array(end.date()).fill(0);
  leads.forEach(obj => dateInRanges[+obj._id-1] = +obj.total_count);

  res.status(200).json({
    status: 200,
    success: true,
    leads: dateInRanges
  });
});

module.exports = {
  getPaymentReport,
  getExpenseReport,
  getIndividualReport,
  getCorporateReport,
  getLeadsReport,
  getFollowupLeadsReport
};
