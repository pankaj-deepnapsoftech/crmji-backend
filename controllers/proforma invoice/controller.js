const { TryCatch } = require("../../helpers/error");
const { fetchImage } = require("../../helpers/fetchImage");
const customerModel = require("../../models/customer");
const proformaInvoiceModel = require("../../models/proformaInvoice");
const PDFTable = require("pdfkit-table");
const settingModel = require("../../models/setting");

const createProformaInvoice = TryCatch(async (req, res) => {
  const {
    // customer,
    people,
    company,
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
  const totalProformaInvoices = await proformaInvoiceModel
    .find({ organization: req.user.organization })
    .countDocuments();
  const proformainvoicename = `${totalProformaInvoices + 1}/${currYear}`;

  // const isExistingCustomer = await customerModel.findById(customer);
  // if (!isExistingCustomer) {
  //   throw new Error("Customer doesn't exists", 404);
  // }

  // const proformaInvoice = await proformaInvoiceModel.create({
  //   proformainvoicename,
  //   customer,
  //   status,
  //   startdate,
  //   expiredate,
  //   remarks,
  //   products,
  //   subtotal,
  //   total,
  //   tax,
  //   createdBy: req.user.id
  // });
  const proformaInvoice = await proformaInvoiceModel.create({
    proformainvoicename,
    // customer,
    company,
    people,
    status,
    startdate,
    expiredate,
    remarks,
    products,
    subtotal,
    total,
    tax,
    createdBy: req.user.id,
    organization: req.user.organization,
    creator: req.user.id,
  });

  // await customerModel.findOneAndUpdate(
  //   { _id: customer },
  //   { status: "Proforma Invoice Sent" }
  // );

  res.status(200).json({
    status: 200,
    success: true,
    message: "Proforma invoice has been created successfully",
  });
});

const editProformaInvoice = TryCatch(async (req, res) => {
  const {
    proformaInvoiceId,
    // customer,
    people,
    company,
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
  const totalProformaInvoices = await proformaInvoiceModel
    .find()
    .countDocuments();
  const proformainvoicename = `${totalProformaInvoices + 1}/${currYear}`;

  // const isExistingCustomer = await customerModel.findById(customer);
  // if (!isExistingCustomer) {
  //   throw new Error("Customer doesn't exists", 404);
  // }

  const isExistingProformaInvoice = await proformaInvoiceModel.findById(
    proformaInvoiceId
  );
  if (!isExistingProformaInvoice) {
    throw new Error("Proforma invoice doesn't exists", 404);
  }
  if (
    req.user.role !== "Super Admin" &&
    isExistingProformaInvoice.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to edit this proforma invoice", 401);
  }

  const proformaInvoice = await proformaInvoiceModel.findOneAndUpdate(
    { _id: proformaInvoiceId },
    {
      proformainvoicename,
      // customer,
      people,
      company,
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
    message: "Proforma invoice has been updated successfully",
  });
});

const getAllProformaInvoices = TryCatch(async (req, res) => {
  let proformaInvoices = [];

  if (req.user.role === "Super Admin") {
    proformaInvoices = await proformaInvoiceModel
      .find({ organization: req.user.organization })
      .populate("people", "firstname lastname phone email")
      .populate("company", "companyname phone email")
      .populate("creator", "name");
  } else {
    proformaInvoices = await proformaInvoiceModel
      .find({ organization: req.user.organization, creator: req.user.id })
      .populate("people", "firstname lastname phone email")
      .populate("company", "companyname phone email")
      .populate("creator", "name");
  }

  res.status(200).json({
    status: 200,
    success: true,
    proformaInvoices,
  });
});

const deleteProformaInvoice = TryCatch(async (req, res) => {
  const { proformaInvoiceId } = req.body;

  const isProformaInvoiceExists = await proformaInvoiceModel.findById(
    proformaInvoiceId
  );
  if (!isProformaInvoiceExists) {
    throw new Error("Proforma invoice doesn't exists", 404);
  }
  if (
    req.user.role !== "Super Admin" &&
    isProformaInvoiceExists.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to delete this proforma invoice", 401);
  }

  await proformaInvoiceModel.deleteOne({ _id: proformaInvoiceId });

  res.status(200).json({
    status: 200,
    success: true,
    message: "Proforma invoice deleted successfully",
  });
});

const getProformaInvoiceDetails = TryCatch(async (req, res) => {
  const { proformaInvoiceId } = req.body;

  const isExistingProformaInvoice = await proformaInvoiceModel
    .findById(proformaInvoiceId)
    .populate("people", "firstname lastname phone email")
    .populate("company", "companyname phone email")
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

  if (!isExistingProformaInvoice) {
    throw new Error("Proforma invoice doesn't exists", 404);
  }

  if (
    req.user.role !== "Super Admin" &&
    isExistingProformaInvoice.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to access this proforma invoice", 401);
  }

  res.status(200).json({
    status: 200,
    success: true,
    proformaInvoice: isExistingProformaInvoice,
  });
});

const downloadProformaInvoice = TryCatch(async (req, res) => {
  const { proformaInvoiceId } = req.body;
  const date = new Date();

  const companyDetails = await settingModel.findOne({
    organization: req?.user?.organization,
  });

  const proformaInvoice = await proformaInvoiceModel
    .findById(proformaInvoiceId)
    .populate("people", "firstname lastname phone email")
    .populate("company", "companyname phone email")
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
    .populate("createdBy", "designation name phone");
  if (!proformaInvoice) {
    throw new Error("Proforma invoice doesn't exists");
  }
  if (
    req.user.role !== "Super Admin" &&
    proformaInvoice.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error(
      "You are not allowed to download this proforma invoice",
      401
    );
  }

  const buffers = [];
  const pdf = new PDFTable({
    margin: 30,
    font: "Helvetica",
    size: "A4",
    info: {
      Title: "Proforma Invoice",
      Author: "CRM System",
      Subject: "Proforma Invoice Document",
    },
  });

  const imagePaths = {};
  const imagePromises = proformaInvoice.products.map(async (product, index) => {
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
  pdf.fontSize(16).font("Helvetica-Bold").fillColor("#1a365d");
  pdf.text("PROFORMA INVOICE", pageWidth / 2 + 30, 40, { align: "right" });

  pdf.fontSize(12).font("Helvetica").fillColor("#4a5568");
  pdf.text(
    `Invoice #: ${proformaInvoice.proformainvoicename}`,
    pageWidth / 2 + 30,
    60,
    { align: "right" }
  );
  pdf.text(
    `Date: ${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`,
    pageWidth / 2 + 30,
    75,
    { align: "right" }
  );
  pdf.text("Validity: 1 month", pageWidth / 2 + 30, 90, { align: "right" });

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
  pdf.y += 20;
  const customerName = proformaInvoice?.people
    ? proformaInvoice?.people.firstname +
      " " +
      (proformaInvoice?.people?.lastname || "")
    : proformaInvoice?.company.companyname;

  pdf.text(customerName, 30, pdf.y);

  if (proformaInvoice?.people?.phone) {
    pdf.y += 15;
    pdf.text(`Phone: ${proformaInvoice.people.phone}`, 30, pdf.y);
  }
  if (proformaInvoice?.people?.email) {
    pdf.y += 15;
    pdf.text(`Email: ${proformaInvoice.people.email}`, 30, pdf.y);
  }

  pdf.y += 40;

  // Products Table with enhanced styling
  const data = proformaInvoice?.products.map((product, ind) => {
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
        width: 28,
        headerColor: "#2b6cb0",
        align: "center",
      },
      {
        label: "MODEL NO.",
        property: "modelno",
        width: 78,
        headerColor: "#2b6cb0",
        align: "center",
      },
      {
        label: "PRODUCT NAME",
        property: "name",
        width: 115,
        headerColor: "#2b6cb0",
        align: "left",
      },
      {
        label: "IMAGE",
        width: 58,
        headerColor: "#2b6cb0",
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
        width: 38,
        headerColor: "#2b6cb0",
        align: "center",
      },
      {
        label: "MRP",
        property: "mrp",
        width: 68,
        headerColor: "#2b6cb0",
        align: "right",
      },
      {
        label: "UNIT PRICE",
        property: "offerprice",
        width: 78,
        headerColor: "#2b6cb0",
        align: "right",
      },
      {
        label: "TOTAL",
        property: "total",
        width: 78,
        headerColor: "#2b6cb0",
        align: "right",
      },
    ],
    datas: data,
  };

  pdf.table(table, {
    prepareHeader: () =>
      pdf.font("Helvetica-Bold").fontSize(10).fillColor("#171717"),
    prepareRow: (row, i) => {
      pdf.font("Helvetica").fontSize(10).fillColor("#171717");
      if (i % 2 === 0) {
        pdf.fillColor("#f8f9fa");
      } else {
        pdf.fillColor("#171717");
      }
    },
  });

  // Total Section with better styling
  pdf.y += 20;
  const totalBoxY = pdf.y;

  // Draw a box for the total
  pdf
    .rect(pageWidth - 150, totalBoxY, 150, 60)
    .fill("#e6f3ff")
    .stroke("#2b6cb0");

  pdf
    .fillColor("#1a365d")
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("TOTAL AMOUNT", pageWidth - 140, totalBoxY + 15);

  pdf
    .fillColor("#2b6cb0")
    .fontSize(18)
    .font("Helvetica-Bold")
    .text(
      "Rs " + proformaInvoice.total.toLocaleString("en-IN"),
      pageWidth - 140,
      totalBoxY + 35
    );

  pdf.y = totalBoxY + 80;

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

  pdf.y = footerY + 20;

  // Thanks section
  pdf.fontSize(14).font("Helvetica-Bold").fillColor("#2d3748");
  pdf.text("Thank you for your business!", 30, pdf.y);

  pdf.y += 30;

  // Contact Information in a structured layout
  pdf.fontSize(12).font("Helvetica-Bold").fillColor("#1a365d");
  pdf.text("Contact Information:", 30, pdf.y);

  pdf.y += 20;
  pdf.fontSize(11).font("Helvetica").fillColor("#4a5568");

  // Create two columns for contact info
  const leftCol = 30;
  const rightCol = pageWidth / 2 + 30;

  pdf.text(`${proformaInvoice.createdBy.name}`, leftCol, pdf.y);
  pdf.text(
    `Designation: ${proformaInvoice.createdBy.designation}`,
    rightCol,
    pdf.y
  );

  pdf.y += 15;
  pdf.text(`Mobile: ${proformaInvoice.createdBy.phone}`, leftCol, pdf.y);

  pdf.y += 20;
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
  pdf.y += 30;
  pdf.fontSize(9).font("Helvetica-Oblique").fillColor("#a0aec0");

  pdf.on("data", buffers.push.bind(buffers));
  pdf.on("end", () => {
    let pdfData = Buffer.concat(buffers);
    res
      .writeHead(200, {
        "Content-Length": Buffer.byteLength(pdfData),
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment;filename=proforma-invoice-${
          proformaInvoice?.people
            ? proformaInvoice?.people.firstname +
              "-" +
              (proformaInvoice?.people?.lastname || "")
            : proformaInvoice?.company.companyname
        }-${proformaInvoice._id}.pdf`,
      })
      .end(pdfData);
  });
  pdf.end();
});

module.exports = {
  createProformaInvoice,
  getAllProformaInvoices,
  deleteProformaInvoice,
  editProformaInvoice,
  getProformaInvoiceDetails,
  downloadProformaInvoice,
};
