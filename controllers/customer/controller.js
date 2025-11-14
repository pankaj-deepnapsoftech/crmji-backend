const { TryCatch, ErrorHandler } = require("../../helpers/error");
const mongoose = require("mongoose");
const peopleModel = require("../../models/people");
const customerModel = require("../../models/customer");
const companyModel = require("../../models/company");
const invoiceModel = require("../../models/invoice");

const createCustomer = TryCatch(async (req, res) => {
  const { type, peopleId, companyId } = req.body;

  // Helper to generate next customerId per organization in format CUST-001
  const generateNextCustomerId = async (organizationId) => {
    // Find latest customerId for the organization
    const latest = await customerModel
      .find({ organization: organizationId, customerId: { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!latest.length || !latest[0].customerId) {
      return "CUST-001";
    }

    const lastId = latest[0].customerId; // e.g., CUST-007
    const match = lastId.match(/^(CUST-)(\d{3})$/);
    if (!match) {
      // Fallback if existing format deviates
      return "CUST-001";
    }
    const prefix = match[1];
    const num = parseInt(match[2], 10) + 1;
    const nextNum = String(num).padStart(3, "0");
    return `${prefix}${nextNum}`;
  };

  if (peopleId) {
    const isExistingPeople = await peopleModel.findById(peopleId);

    if (!isExistingPeople) {
      throw new ErrorHandler("Person doesn't exist", 404);
    }

    const isCustomerExists = await customerModel.findOne({
      people: peopleId,
    });

    if (isCustomerExists) {
      throw new ErrorHandler("Customer already exists", 400);
    }

    const customer = await customerModel.create({
      organization: req.user.organization,
      creator: req.user.id,
      customertype: type,
      people: peopleId,
      customerId: await generateNextCustomerId(req.user.organization),
    });

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Customer has been created successfully",
      customer: customer,
    });
  } else if (companyId) {
    const isExistingCompany = await companyModel.findById(companyId);

    if (!isExistingCompany) {
      throw new ErrorHandler("Company doesn't exist", 404);
    }

    const isCustomerExists = await companyModel.findOne({
      _id: companyId,
    });

    if (!isCustomerExists) {
      throw new ErrorHandler("Customer already exists", 400);
    }

    const customer = await customerModel.create({
      organization: req.user.organization,
      customertype: type,
      company: companyId,
      creator: req.user.id,
      customerId: await generateNextCustomerId(req.user.organization),
    });

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Customer has been created successfully",
      customer: customer,
    });
  }

  throw new ErrorHandler("People or Company must be specified", 400);
});

const editCustomer = TryCatch(async (req, res) => {
  const { customerId, status } = req.body;
  const isCustomerExists = await customerModel.findById(customerId);

  if (!isCustomerExists) {
    throw new ErrorHandler("Customer doesn't exists", 400);
  }

  if (
    req.user.role !== "Super Admin" &&
    isCustomerExists.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to edit this customer", 401);
  }

  const customer = await customerModel.findOneAndUpdate(
    { _id: customerId },
    { status },
    { new: true }
  );

  return res.status(200).json({
    status: 200,
    success: true,
    message: "Customer has been updated successfully",
    customer: customer,
  });

  // const { customerId, type, peopleId, companyId } = req.body;

  // if (peopleId && type === "People") {
  //   const isExistingPeople = await peopleModel.findById(peopleId);

  //   if (!isExistingPeople) {
  //     throw new ErrorHandler("Person doesn't exist", 404);
  //   }

  //   const isCustomerExists = await customerModel.findById(customerId);

  //   if (!isCustomerExists) {
  //     throw new ErrorHandler("Customer doesn't exists", 400);
  //   }

  //   const customer = await customerModel.findOneAndUpdate(
  //     { _id: customerId },
  //     { customertype: type, people: peopleId, company: undefined },
  //     { new: true }
  //   );

  //   return res.status(200).json({
  //     status: 200,
  //     success: true,
  //     message: "Customer has been updated successfully",
  //     customer: customer,
  //   });
  // } else if (companyId && type === "Company") {
  //   const isExistingCompany = await companyModel.findById(companyId);

  //   if (!isExistingCompany) {
  //     throw new ErrorHandler("Company doesn't exist", 400);
  //   }

  //   const isCustomerExists = await customerModel.findById(customerId);

  //   if (!isCustomerExists) {
  //     throw new ErrorHandler("Customer doesn't exists", 400);
  //   }

  //   const customer = await customerModel.findOneAndUpdate(
  //     { _id: customerId },
  //     { customertype: type, company: companyId, people: undefined },
  //     { new: true }
  //   );

  //   return res.status(200).json({
  //     status: 200,
  //     success: true,
  //     message: "Customer has been updated successfully",
  //     customer: customer,
  //   });
  // }

  // throw new ErrorHandler("People or Company must be specified", 400);
});

const deleteCustomer = TryCatch(async (req, res) => {
  const { customerId } = req.body;

  const isCustomerExists = await customerModel.findById(customerId);

  if (!isCustomerExists) {
    throw new ErrorHandler("Customer doesn't exists", 400);
  }

  if (
    req.user.role !== "Super Admin" &&
    isCustomerExists.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to delete this customer", 401);
  }

  const deletedCustomer = await customerModel.deleteOne({ _id: customerId });

  res.status(200).json({
    status: 200,
    success: true,
    message: "Customer has been deleted successfully",
    deletedCustomer: deletedCustomer,
  });
});

const customerDetails = TryCatch(async (req, res) => {
  const { customerId } = req.body;

  const customer = await customerModel
    .findById(customerId)
    .populate("people", "firstname lastname email phone")
    .populate("company", "companyname email phone")
    .populate("creator", "name")
    .populate({
      path: "products",
      populate: [
        {
          path: "category",
          model: "Product Category",
          select: "categoryname",
        },
      ],
    });

  if (!customer) {
    throw new ErrorHandler("Customer doesn't exists", 400);
  }

  if (
    req.user.role !== "Super Admin" &&
    customer.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to access this customer", 401);
  }

  res.status(200).json({
    status: 200,
    success: true,
    customer: {
      _id: customer._id,
      customerId: customer.customerId,
      name:
        customer.people !== undefined
          ? customer.people?.firstname + " " + (customer.people?.lastname || "")
          : customer.company?.companyname,
      email:
        customer.people !== undefined
          ? customer.people?.email
          : customer.company?.email,
      phone:
        customer.people !== undefined
          ? customer.people?.phone
          : customer.company?.phone,
      customertype: customer.customertype,
      status: customer.status,
      lastPaymentAmount: customer.lastPaymentAmount,
      products: customer.products,
      creator: customer.creator?.name,
      createdAt: customer.createdAt,
    },
  });
});

const allCustomers = TryCatch(async (req, res) => {
  const { page = 1 } = req.body;

  // const totalCustomersPerPage = 10;
  // const skip = (page - 1) * totalCustomersPerPage;
  let customers = [];

  if (req.user.role === "Super Admin") {
    customers = await customerModel
      .find({ organization: req.user.organization })
      .sort({ createdAt: -1 })
      .populate("people")
      .populate("company", "companyname email phone")
      .populate("creator", "name")
      .populate({
        path: "products",
        select: "name imageUrl category",
        populate: {
          path: "category",
          model: "Product Category",
          select: "categoryname",
        },
      });
  } else {
    customers = await customerModel
      .find({ organization: req.user.organization, creator: req.user.id })
      .sort({ createdAt: -1 })
      .populate("people")
      .populate("company", "companyname email phone")
      .populate("creator", "name")
      .populate({
        path: "products",
        select: "name imageUrl category",
        populate: {
          path: "category",
          model: "Product Category",
          select: "categoryname",
        },
      });
  }

  const toObjectId = (id) =>
    mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;

  const customerIds = customers
    .map((customer) => toObjectId(customer._id))
    .filter(Boolean);

  const organizationId = toObjectId(req.user.organization);
  const creatorId = toObjectId(req.user.id);
  let invoiceTotalsByCustomer = {};

  if (customerIds.length > 0 && organizationId) {
    const matchConditions = {
      organization: organizationId,
      customer: { $in: customerIds },
    };

    if (req.user.role !== "Super Admin" && creatorId) {
      matchConditions.creator = creatorId;
    }

    const invoiceTotals = await invoiceModel.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$customer",
          totalAmount: { $sum: "$total" },
        },  
      },
    ]);

    invoiceTotalsByCustomer = invoiceTotals.reduce((acc, curr) => {
      const key = curr._id.toString();
      const total = typeof curr.totalAmount === "number" ? curr.totalAmount : 0;
      acc[key] = total;
      return acc;
    }, {});
  }

  const results = customers.map((customer) => {
    return {
      _id: customer._id,
      uniqueId: customer.customerId,
      name:
        customer.people !== undefined
          ? customer?.people?.firstname +
            " " +
            (customer?.people?.lastname || "")
          : customer.company?.companyname,
      email:
        customer.people !== undefined
          ? customer.people?.email
          : customer.company?.email,
      phone:
        customer.people !== undefined
          ? customer.people?.phone
          : customer.company?.phone,
      customertype: customer?.customertype,
      status: customer?.status,
      lastPaymentAmount: customer?.lastPaymentAmount,
      totalInvoiceAmount: invoiceTotalsByCustomer[customer._id.toString()] || 0,
      creator: customer?.creator.name,
      createdAt: customer?.createdAt,
      products:
        Array.isArray(customer?.products) && customer.products.length > 0
          ? customer.products.map((product) => ({
              _id: product?._id,
              name: product?.name,
              imageUrl: product?.imageUrl,
              category:
                product?.category?.categoryname || product?.category || "",
            }))
          : [],
    };
  });

  res.status(200).json({
    status: 200,
    success: true,
    customers: results,
  });
});

module.exports = {
  createCustomer,
  editCustomer,
  deleteCustomer,
  allCustomers,
  customerDetails,
};
