const { TryCatch } = require("../../helpers/error");
const paymentModel = require("../../models/payment");
const invoiceModel = require("../../models/invoice");
const PDFTable = require("pdfkit-table");
const settingModel = require("../../models/setting");
const { fetchImage } = require("../../helpers/fetchImage");

const createPayment = TryCatch(async (req, res) => {
  const { invoiceId, amount, description, reference, mode } = req.body;

  const isExistingInvoice = await invoiceModel.findById(invoiceId);
  if (!isExistingInvoice) {
    throw new Error("Invoice doesn't exists", 404);
  }
  if (isExistingInvoice.balance < amount) {
    throw new Error("The amount must be less than the balance amount.");
  }

  const totalPayments = await paymentModel.find({organization: req.user.organization}).countDocuments();
  const year = new Date().getFullYear();
  paymentname = totalPayments + "/" + year;

  const payment = await paymentModel.create({
    invoice: invoiceId,
    paymentname,
    amount,
    description,
    reference,
    mode,
    createdBy: req.user.id,
    creator: req.user.id,
    organization: req.user.organization
  });

  await invoiceModel.findOneAndUpdate(
    { _id: invoiceId },
    {
      paid: (isExistingInvoice.paid + amount).toFixed(2),
      balance: (isExistingInvoice.balance - amount).toFixed(2),
      paymentstatus:
        isExistingInvoice.balance - amount === 0 ? "Paid" : "Partially Paid",
    }
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "Payment created successfully",
  });
});

const editPayment = TryCatch(async (req, res) => {
  const { paymentId, amount, description, reference, mode } = req.body;

  const isExistingPayment = await paymentModel.findById(paymentId);
  if (!isExistingPayment) {
    throw new Error("Payment doesn't exists", 404);
  }

  const isExistingInvoice = await invoiceModel.findById(
    isExistingPayment.invoice
  );
  if (!isExistingInvoice) {
    throw new Error("Invoice doesn't exists", 404);
  }
  if (
    req.user.role !== "Super Admin" &&
    isExistingPayment.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to edit this payment", 401);
  }
  if (isExistingInvoice.balance < amount) {
    throw new Error("The amount must be less than the balance amount.");
  }

  const payment = await paymentModel.findOneAndUpdate(
    { _id: paymentId },
    {
      amount,
      description,
      reference,
      mode,
    }
  );

  if (amount > isExistingPayment.amount) {
    await invoiceModel.findOneAndUpdate(
      { _id: isExistingPayment.invoice },
      {
        paid: isExistingInvoice.paid + amount,
        balance: isExistingInvoice.balance - amount,
      }
    );
  } else {
    await invoiceModel.findOneAndUpdate(
      { _id: isExistingPayment.invoice },
      {
        paid: (isExistingInvoice.paid - amount).toFixed(2),
        balance: (isExistingInvoice.balance + amount).toFixed(2),
        paymentstatus:
          isExistingInvoice.balance + amount === 0 ? "Paid" : "Partially Paid",
      }
    );
  }

  res.status(200).json({
    status: 200,
    success: true,
    message: "Payment updated successfully",
  });
});

const deletePayment = TryCatch(async (req, res) => {
  const { paymentId } = req.body;

  const isExistingPayment = await paymentModel.findById(invoiceId);
  if (!isExistingPayment) {
    throw new Error("Payment doesn't exists", 404);
  }
  if (
    req.user.role !== "Super Admin" &&
    isExistingPayment.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to delete this payment", 401);
  }

  await paymentModel.deleteOne({ _id: paymentId });

  res.status(200).json({
    status: 200,
    success: true,
    message: "Payment deleted successfully",
  });
});

const getAllPayments = TryCatch(async (req, res) => {
  let payments = [];

  if (req.user.role === "Super Admin") {
    payments = await paymentModel.find({organization: req.user.organization}).populate({
      path: "invoice",
      select: "invoicename customer",
      populate: {
        path: "customer",
        select: "people company",
        populate: [
          {
            path: "people",
            select: "firstname lastname",
          },
          {
            path: "company",
            select: "companyname",
          },
        ],
      },
    }).populate('creator', 'name');
  } else {
    payments = await paymentModel.find({organization: req.user.organization, creator: req.user.id}).populate({
      path: "invoice",
      select: "invoicename customer",
      populate: {
        path: "customer",
        select: "people company",
        populate: [
          {
            path: "people",
            select: "firstname lastname",
          },
          {
            path: "company",
            select: "companyname",
          },
        ],
      },
    }).populate('creator', 'name');
  }

  res.status(200).json({
    status: 200,
    success: true,
    payments,
  });
});

const paymentDetails = TryCatch(async (req, res) => {
  const { paymentId } = req.body;

  const payment = await paymentModel
    .findById(paymentId)
    .populate({
      path: "invoice",
      select: "invoicename customer",
      populate: {
        path: "customer",
        select: "people company",
        populate: [
          {
            path: "people",
            select: "firstname lastname",
          },
          {
            path: "company",
            select: "companyname",
          },
        ],
      },
    })
    .populate("createdBy", "name phone designation");

    if (
      req.user.role !== "Super Admin" &&
      payment.creator.toString() !== req.user.id.toString()
    ) {
      throw new Error("You are not allowed to access this payment", 401);
    }

  res.status(200).json({
    status: 200,
    success: true,
    payment,
  });
});

const downloadPayment = TryCatch(async (req, res) => {
  const { paymentId } = req.body;
  const date = new Date();

  const companyDetails = await settingModel.findOne({organization: req?.user?.organization});

  const payment = await paymentModel
    .findById(paymentId)
    .populate({
      path: "invoice",
      populate: {
        path: "customer",
        populate: [
          {
            path: "company",
            model: "Company",
            select: "companyname phone email",
          },
          {
            path: "people",
            model: "People",
            select: "firstname lastname phone email",
          },
        ],
      },
    })
    .populate("createdBy", "name phone designation");

  if (!payment) {
    throw new Error("Payment doesn't exists");
  }
      
  if (
    req.user.role !== "Super Admin" &&
    payment.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to download this payment", 401);
  }

  const buffers = [];
  const pdf = new PDFTable({
    margin: 15,
    font: "Times-Roman",
  });

  let companyLogo;
  if (companyDetails && companyDetails?.company_logo) {
    companyLogo = await fetchImage(companyDetails?.company_logo);
  }

  pdf.image(companyLogo || "logo.png", { width: 170, height: 120 });

  pdf.y = 130;
  pdf.moveDown();
  pdf
    .rect(15, pdf.y, pdf.page.width - 35, 33)
    .fill("#000000")
    .fill("white")
    .fontSize(22)
    .text("PAYMENT RECEIPT", pdf.x, pdf.y + 10, { align: "center" });

  pdf.y = 185;
  pdf.font("Times-Roman");
  pdf.fillColor("black");
  pdf.fontSize(14);

  pdf.text(
    `Dated: ${
      date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear()
    }`
  );

  pdf.moveDown();
  pdf.x = 15;

  pdf.font("Times-Bold").fontSize(20).text("From");
  pdf.font("Times-Roman");
  pdf.fontSize(14);
  pdf.text(
    "5E/12BP, Block E, New Industrial Twp 5, New Industrial Town, Faridabad, Haryana 121001",
    { width: 300 }
  );

  pdf.moveDown();
  pdf.font("Times-Bold").fontSize(20).text("To");
  pdf.font("Times-Roman");
  pdf.fontSize(14);
  pdf.text(
    `Name: ${
      payment.invoice.customer?.people
        ? payment.invoice.customer?.people.firstname +
          " " +
          (payment.invoice.customer?.people.lastname || '')
        : payment.invoice.customer?.company.companyname
    }`
  );
  pdf.text(
    `Phone: ${
      payment.invoice.customer?.people
        ? payment.invoice.customer?.people.phone
        : payment.invoice.customer?.company.phone
    }`
  );
  pdf.text(
    `Email: ${
      payment.invoice.customer?.people
        ? payment.invoice.customer?.people.email
        : payment.invoice.customer?.company.email
    }`
  );

  pdf.moveDown();
  pdf.font("Times-Bold").fontSize(20).text("Payment Details");
  pdf.font("Times-Roman");
  pdf.fontSize(14);

  pdf.text(`Invoice Id: ${payment.invoice._id}`);
  pdf.text(`Payment Id: ${payment._id}`);
  pdf.text(`Subtotal: Rs ${payment.invoice.subtotal}`);
  pdf.text(`Tax: ${payment.invoice.tax[0].taxname}`);
  pdf.text(`Tax Amount: ${payment.invoice.tax[0].taxamount}`);

  pdf.text(`Total: Rs ${payment.invoice.total}`);
  pdf.text(`Paid: Rs ${payment.invoice.paid}`);
  pdf.text(`Balance: Rs ${payment.invoice.balance}`);
  pdf.text(`Payment Status: ${payment.invoice.paymentstatus}`);

  pdf.moveDown(2);

  pdf.font("Times-Bold");
  pdf.fillColor("#000000");

  pdf.text("Thanks & Regards");
  pdf.moveDown();
  pdf.text(payment.createdBy.name);
  pdf.text(`(${payment.createdBy.designation})`);
  pdf.text(`Mobile No: ${payment.createdBy.phone}`);
  pdf.text(
    `${
      companyDetails && companyDetails?.company_address
        ? companyDetails?.company_address +
          " " +
          companyDetails?.company_state +
          " " +
          companyDetails?.company_country
        : "5E/12BP, Block E, New Industrial Twp 5, New Industrial Town, Faridabad, Haryana 121001"
    }`
  );

  pdf.on("data", buffers.push.bind(buffers));
  pdf.on("end", () => {
    let pdfData = Buffer.concat(buffers);
    res
      .writeHead(200, {
        "Content-Length": Buffer.byteLength(pdfData),
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment;filename=payment-receipt-${payment._id}.pdf`,
      })
      .end(pdfData);
  });
  pdf.end();
});

module.exports = {
  createPayment,
  editPayment,
  deletePayment,
  getAllPayments,
  paymentDetails,
  downloadPayment,
};
