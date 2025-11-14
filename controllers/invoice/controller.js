const { TryCatch, ErrorHandler } = require("../../helpers/error");
const { fetchImage } = require("../../helpers/fetchImage");
const customerModel = require("../../models/customer");
const invoiceModel = require("../../models/invoice");
const productModel = require("../../models/product");
const PDFTable = require("pdfkit-table");
const settingModel = require("../../models/setting");

const createInvoice = TryCatch(async (req, res) => {
  const {
    customer,
    status,
    startdate,
    expiredate,
    remarks,
    products,
    subtotal,
    total,
    tax,
  } = req.body;

  const currYear = new Date().getFullYear();
  const totalInvoices = await invoiceModel
    .find({ organization: req.user.organization })
    .countDocuments();
  const invoicename = `${totalInvoices + 1}/${currYear}`;

  const isExistingCustomer = await customerModel.findById(customer);
  if (!isExistingCustomer) {
    throw new Error("Customer doesn't exists", 404);
  }

  const errorArr = [];
  const productsPromise = products.map(async (product) => {
    const availableProduct = await productModel.findById(product.product);
    if (!availableProduct) {
      errorArr.push(`Product not found`);
      return;
    }
    
    // Only check stock if it's defined and is a number
    if (availableProduct.stock !== undefined && availableProduct.stock !== null && typeof availableProduct.stock === 'number') {
      if (availableProduct.stock >= product.quantity) {
        await productModel.findByIdAndUpdate(
          product.product,
          { stock: availableProduct.stock - product.quantity }
        );
      } else {
        errorArr.push(
          `Only ${availableProduct.stock} units are available of ${availableProduct.name}`
        );
      }
    }
    // If stock is not tracked (undefined/null), skip stock validation and allow the invoice
  });
  await Promise.all(productsPromise);

  if (errorArr.length > 0) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: errorArr.join(","),
    });
  }

  const invoice = await invoiceModel.create({
    creator: req.user.id,
    organization: req.user.organization,
    invoicename,
    customer,
    status,
    startdate,
    expiredate,
    remarks,
    products,
    subtotal,
    total,
    tax,
    paid: 0,
    createdBy: req.user.id,
    balance: total,
  });

  await customerModel.findOneAndUpdate(
    { _id: customer },
    { status: "Invoice Sent" }
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "Invoice has been created successfully",
  });
});

const editInvoice = TryCatch(async (req, res) => {
  const {
    invoiceId,
    customer,
    status,
    startdate,
    expiredate,
    remarks,
    products,
    subtotal,
    total,
    tax,
  } = req.body;

  const currYear = new Date().getFullYear();
  const totalInvoices = await invoiceModel.find().countDocuments();
  const invoicename = `${totalInvoices + 1}/${currYear}`;

  const isExistingCustomer = await customerModel.findById(customer);
  if (!isExistingCustomer) {
    throw new Error("Customer doesn't exists", 404);
  }

  const isExistingInvoice = await invoiceModel.findById(invoiceId);
  if (!isExistingInvoice) {
    throw new Error("Invoice doesn't exists", 404);
  }

  if (
    req.user.role !== "Super Admin" &&
    isExistingInvoice.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to edit this invoice", 401);
  }

  const invoice = await invoiceModel.findOneAndUpdate(
    { _id: invoiceId },
    {
      invoicename,
      customer,
      status,
      startdate,
      expiredate,
      remarks,
      products,
      subtotal,
      total,
      tax,
    }
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "Invoice has been updated successfully",
  });
});

const getAllInvoices = TryCatch(async (req, res) => {
  let invoices = [];

  if (req.user.role === "Super Admin") {
    invoices = await invoiceModel
      .find({ organization: req.user.organization })
      .populate({
        path: "customer",
        populate: [
          {
            path: "company",
            model: "Company",
            select: "companyname",
          },
          {
            path: "people",
            model: "People",
            select: "firstname lastname",
          },
        ],
      })
      .populate("creator", "name");
  } else {
    invoices = await invoiceModel
      .find({ organization: req.user.organization, creator: req.user.id })
      .populate({
        path: "customer",
        populate: [
          {
            path: "company",
            model: "Company",
            select: "companyname",
          },
          {
            path: "people",
            model: "People",
            select: "firstname lastname",
          },
        ],
      })
      .populate("creator", "name");
  }

  res.status(200).json({
    status: 200,
    success: true,
    invoices,
  });
});

const deleteInvoice = TryCatch(async (req, res) => {
  const { invoiceId } = req.body;

  const isInvoiceExists = await invoiceModel.findById(invoiceId);
  if (!isInvoiceExists) {
    throw new Error("Invoice doesn't exists", 404);
  }

  if (
    req.user.role !== "Super Admin" &&
    isInvoiceExists.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to delete this invoice", 401);
  }

  await invoiceModel.deleteOne({ _id: invoiceId });

  res.status(200).json({
    status: 200,
    success: true,
    message: "Invoice deleted successfully",
  });
});

const getInvoiceDetails = TryCatch(async (req, res) => {
  const { invoiceId } = req.body;

  const isExistingInvoice = await invoiceModel
    .findById(invoiceId)
    .populate({
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
    })
    .populate({
      path: "products.product",
      model: "Product",
      select: "name imageUrl category",
      populate: [
        {
          path: "category",
          model: "Product Category",
          select: "categoryname",
        },
      ],
    })
    .populate("createdBy", "name phone designation");

  if (!isExistingInvoice) {
    throw new Error("Invoice doesn't exists", 404);
  }

  if (
    req.user.role !== "Super Admin" &&
    isExistingInvoice.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to access this invoice", 401);
  }

  res.status(200).json({
    status: 200,
    success: true,
    invoice: isExistingInvoice,
  });
});

const downloadInvoice = TryCatch(async (req, res, next) => {
  const { invoiceId } = req.body;
  const date = new Date();

  const companyDetails = await settingModel.findOne({
    organization: req?.user?.organization,
  });

  const invoice = await invoiceModel
    .findById(invoiceId)
    .populate({
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
    })
    .populate({
      path: "products.product",
      model: "Product",
      select: "name price model imageUrl category",
      populate: [
        {
          path: "category",
          model: "Product Category",
          select: "categoryname",
        },
      ],
    })
    .populate("createdBy", "name designation phone");
  if (!invoice) {
    throw new Error("Invoice doesn't exists");
  }

  if (
    req.user.role !== "Super Admin" &&
    invoice.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to download this invoice", 401);
  }

  const buffers = [];
  const pdf = new PDFTable({
    margin: 30,
    font: "Helvetica",
    size: "A4",
    info: {
      Title: "Invoice",
      Author: "CRM System",
      Subject: "Invoice Document",
    },
  });

  const imagePaths = {};
  const imagePromises = invoice.products.map(async (product, index) => {
    const img = await fetchImage(product.product.imageUrl);
    imagePaths[product.product.imageUrl] = img;
  });

  await Promise.all(imagePromises);

  let companyLogo;
  if (companyDetails && companyDetails?.company_logo) {
    companyLogo = await fetchImage(companyDetails?.company_logo);
  }

  // Header Section with improved design
  const pageWidth = pdf.page.width - 60; // Account for margins

  // Company Logo and Header
  if (companyLogo) {
    pdf.image(companyLogo, 30, 30, { width: 120, height: 80 });
  }

  // Company Info Section (Right side)
  pdf.fontSize(18).font("Helvetica-Bold").fillColor("#dc2626");
  pdf.text("INVOICE", pageWidth / 2 + 30, 40, { align: "right" });

  pdf.fontSize(12).font("Helvetica").fillColor("#4a5568");
  pdf.text(`Invoice #: ${invoice.invoicename}`, pageWidth / 2 + 30, 65, {
    align: "right",
  });
  pdf.text(
    `Date: ${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`,
    pageWidth / 2 + 30,
    80,
    { align: "right" }
  );
  pdf.text("Payment Terms: Net 30", pageWidth / 2 + 30, 95, { align: "right" });

  // Decorative line
  pdf
    .moveTo(30, 130)
    .lineTo(pageWidth + 30, 130)
    .stroke("#e2e8f0");

  pdf.y = 150;

  // Customer Information Section
  pdf.fontSize(14).font("Helvetica-Bold").fillColor("#2d3748");
  pdf.text("Bill To:", 30, pdf.y);

  pdf.fontSize(12).font("Helvetica").fillColor("#4a5568");
  pdf.y += 10;
  const customerName = invoice?.customer?.people
    ? invoice?.customer?.people.firstname +
      " " +
      (invoice?.customer?.people.lastname || "")
    : invoice?.customer?.company.companyname;

  pdf.text(customerName, 30, pdf.y);

  if (invoice?.customer?.people?.phone) {
    pdf.y += 10;
    pdf.text(`Phone: ${invoice.customer.people.phone}`, 30, pdf.y);
  }
  if (invoice?.customer?.people?.email) {
    pdf.y += 10;
    pdf.text(`Email: ${invoice.customer.people.email}`, 30, pdf.y);
  }

  pdf.y += 40;

  // Products Table with enhanced styling
  const data = invoice?.products.map((product, ind) => {
    return {
      sno: ind + 1,
      modelno: product.product.model || "N/A",
      name: product.product.name,
      image: product.product.imageUrl,
      qty: product.quantity,
      mrp: "Rs " + product.product.price.toLocaleString("en-IN"),
      offerprice: "Rs " + product.price.toLocaleString("en-IN"),
      total: "Rs " + (product.price * product.quantity).toLocaleString("en-IN"),
    };
  });
 console.log("hey",data)
  const table = {
    options: {
      prepareHeader: () => {
        pdf.font("Helvetica-Bold").fontSize(10).fillColor("#171717");
      },
      prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
        pdf.font("Helvetica").fontSize(10).fillColor("#171717");

        // Alternate row colors for better readability
        if (indexRow % 2 === 0) {
          pdf
            .rect(rectRow.x, rectRow.y, rectRow.width, rectRow.height)
            // .fill("#f7fafc")
            .fillColor("#171717");
        }
      },
      hideHeader: false,
      width: pageWidth,
    },
    headers: [
      {
        label: "S.No.",
        property: "sno",
        width: 48,
        headerColor: "#dc2626",
        align: "center",
      },
      {
        label: "MODEL NO.",
        property: "modelno",
        width: 78,
        headerColor: "#dc2626",
        align: "center",
      },
      {
        label: "PRODUCT NAME",
        property: "name",
        width: 110,
        headerColor: "#dc2626",
        align: "left",
      },
      {
        label: "IMAGE",
        width: 58,
        headerColor: "#dc2626",
        align: "center",
        renderer: (value, indexColumn, indexRow, row, rectRow, rectCell) => {
          if (imagePaths[value]) {
            pdf.image(imagePaths[value], rectCell.x + 5, rectCell.y + 2, {
              width: rectCell.width - 10,
              height: Math.min(rectCell.height - 4, 40),
            });
          }
          return "";
        },
        property: "image",
      },
      {
        label: "QTY",
        property: "qty",
        width: 35,
        headerColor: "#dc2626",
        align: "center",
      },
      {
        label: "MRP",
        property: "mrp",
        width: 65,
        color:"#000",
        headerColor: "#dc2626",
        align: "right",
      },
      {
        label: "UNIT PRICE",
        property: "offerprice",
        width: 75,
        headerColor: "#dc2626",
        align: "right",
      },
      {
        label: "TOTAL",
        property: "total",
        width: 75,
        headerColor: "#dc2626",
        align: "right",
      },
    ],
    
    datas: data,
  };

 pdf.table(table, {
  prepareHeader: () => {
    pdf.font("Helvetica-Bold").fontSize(10).fillColor("#ffffff"); // Header text color white
  },
  prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
    // Draw alternate row backgrounds BEFORE text
    if (indexRow % 2 === 0) {
      pdf
        .rect(rectRow.x, rectRow.y, rectRow.width, rectRow.height)
        // .fill("#f7fafc")y
        .fillColor("#000000") // Light gray
    } else {
      pdf
        .rect(rectRow.x, rectRow.y, rectRow.width, rectRow.height)
        .fill("#ffffff"); // White
    }

    // Then set text color and font
    pdf.font("Helvetica").fontSize(10).fillColor("#171717");
  },
  // Table border colors
  columnSpacing: 2,
  padding: 5,
});



  // Payment Summary Section with better styling
  pdf.y += 10;
  const summaryBoxY = pdf.y;

  // Draw a box for the payment summary
  pdf
    .rect(pageWidth - 200, summaryBoxY, 200, 120)
    .fill("#fef5e7")
    .stroke("#dc2626");

  pdf
    .fillColor("#1a365d")
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("PAYMENT SUMMARY", pageWidth - 190, summaryBoxY + 10);

  pdf.fontSize(12).font("Helvetica").fillColor("#4a5568");

  pdf.text("Subtotal:", pageWidth - 190, summaryBoxY + 35);
  pdf.text(
    "Rs " + invoice.total.toLocaleString("en-IN"),
    pageWidth - 90,
    summaryBoxY + 35,
    { align: "right", width: 80 }
  );

  pdf.text("Amount Paid:", pageWidth - 190, summaryBoxY + 55);
  pdf.text(
    "Rs " + invoice.paid.toLocaleString("en-IN"),
    pageWidth - 90,
    summaryBoxY + 55,
    { align: "right", width: 80 }
  );

  // Balance due with emphasis
  pdf.fontSize(14).font("Helvetica-Bold");
  const balanceColor = invoice.balance > 0 ? "#dc2626" : "#16a34a";
  pdf.fillColor(balanceColor);
  pdf.text("Balance Due:", pageWidth - 190, summaryBoxY + 80);
  pdf.text(
    "Rs " + invoice.balance.toLocaleString("en-IN"),
    pageWidth - 90,
    summaryBoxY + 80,
    { align: "right", width: 80 }
  );

  // Payment Status
  pdf.fontSize(11).font("Helvetica-Bold");
  const statusColor =
    invoice.paymentstatus === "paid"
      ? "#16a34a"
      : invoice.paymentstatus === "partially paid"
      ? "#ea580c"
      : "#dc2626";
  pdf.fillColor(statusColor);
  pdf.text(
    `Status: ${invoice.paymentstatus.toUpperCase()}`,
    pageWidth - 190,
    summaryBoxY + 100
  );

  pdf.y = summaryBoxY + 100;

  // Check if we need a new page for footer
  if (pdf.y + 120 > pdf.page.height - 30) {
    pdf.addPage();
    pdf.y = 50;
  }

  pdf.moveDown(3);

  // Footer section with improved design
  const footerY = pdf.y;

  // Decorative line above footer
  pdf
    .moveTo(30, footerY)
    .lineTo(pageWidth + 30, footerY)
    .stroke("#e2e8f0");

  pdf.y = footerY + 10;

  // Payment terms section
  pdf.fontSize(12).font("Helvetica-Bold").fillColor("#dc2626");
  pdf.text("Payment Terms & Conditions:", 30, pdf.y);

  pdf.y += 10;
  pdf.fontSize(10).font("Helvetica").fillColor("#4a5568");
  pdf.text("• Payment is due within 30 days from the invoice date", 30, pdf.y);
  pdf.y += 10;
  pdf.text("• Late payments may incur additional charges", 30, pdf.y);
  pdf.y += 10;
  pdf.text(
    "• Please reference the invoice number when making payment",
    30,
    pdf.y
  );

  pdf.y += 30;

  // Thanks section
  pdf.fontSize(14).font("Helvetica-Bold").fillColor("#2d3748");
  pdf.text("Thank you for your business!", 30, pdf.y);

  pdf.y += 10 ;

  // Contact Information in a structured layout
  pdf.fontSize(12).font("Helvetica-Bold").fillColor("#1a365d");
  pdf.text("Contact Information:", 30, pdf.y);

  pdf.y += 10;
  pdf.fontSize(11).font("Helvetica").fillColor("#4a5568");

  // Create two columns for contact info
  const leftCol = 30;
  const rightCol = 30;

  pdf.text(`${invoice.createdBy.name}`, leftCol, pdf.y);
  pdf.text(`Designation: ${invoice.createdBy.designation}`, rightCol, pdf.y);

  pdf.y += 10;
  pdf.text(`Mobile: ${invoice.createdBy.phone}`, leftCol, pdf.y);

  pdf.y += 10;
  pdf.fontSize(10).font("Helvetica").fillColor("#718096");
  const address =
    companyDetails && companyDetails?.company_address
      ? `${companyDetails?.company_address}, ${companyDetails?.company_state}, ${companyDetails?.company_country}`
      : "5E/12BP, Block E, New Industrial Twp 5, New Industrial Town, Faridabad, Haryana 121001";

  pdf.text(`Address: ${address}`, leftCol, pdf.y, {
    width: pageWidth - 60,
    align: "left",
  });

  // Add a professional footer note
  pdf.y += 10;
  pdf.fontSize(9).font("Helvetica-Oblique").fillColor("#a0aec0");

  pdf.on("data", buffers.push.bind(buffers));
  pdf.on("end", () => {
    let pdfData = Buffer.concat(buffers);
    res
      .writeHead(200, {
        "Content-Length": Buffer.byteLength(pdfData),
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment;filename=invoice-${
          invoice?.customer?.people
            ? invoice?.customer?.people.firstname +
              " " +
              (invoice?.customer?.people.lastname || "")
            : invoice?.customer?.company.companyname
        }-${invoice._id}.pdf`,
      })
      .end(pdfData);
  });
  pdf.end();
});

module.exports = {
  createInvoice,
  getAllInvoices,
  deleteInvoice,
  editInvoice,
  getInvoiceDetails,
  downloadInvoice,
};
