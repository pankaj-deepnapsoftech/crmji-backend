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
    .find({organization: req.user.organization})
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
    creator: req.user.id
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
    .find({organization: req.user.organization})
    .populate("people", "firstname lastname phone email")
    .populate("company", "companyname phone email")
    .populate('creator', 'name');
  }
  else{
    proformaInvoices = await proformaInvoiceModel
    .find({organization: req.user.organization, creator: req.user.id})
    .populate("people", "firstname lastname phone email")
    .populate("company", "companyname phone email")
    .populate('creator', 'name');
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
  
  const companyDetails = await settingModel.findOne({organization: req?.user?.organization});

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
    throw new Error("You are not allowed to download this proforma invoice", 401);
  }

  const buffers = [];
  const pdf = new PDFTable({
    margin: 15,
    font: "Times-Roman",
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

  pdf.image(companyLogo || "logo.png", { width: 170, height: 120 });

  pdf.y = 135;
  pdf.font("Times-Roman");
  pdf.fillColor("black");
  pdf.fontSize(14);

  pdf.text(
    `Dated: ${
      date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear()
    }`
  );

  pdf.moveUp();
  pdf.font("Times-Bold").text("Validity : 1 month only", 400);
  pdf.moveDown();
  pdf.x = 15;

  pdf.text(
    `${
      proformaInvoice?.people
        ? proformaInvoice?.people.firstname +
          " " +
          (proformaInvoice?.people?.lastname || '')
        : proformaInvoice?.company.companyname
    }`
  );

  pdf.moveDown(2);
  pdf.fontSize(20);
  pdf.font("Times-Roman");

  pdf
    .rect(15, pdf.y, pdf.page.width - 35, 33)
    .fill("#000000")
    .fill("white")
    .text("PROFORMA INVOICE", pdf.x, pdf.y + 10, {
      align: "center",
    });

  pdf.y += 4;
  pdf.fillColor("black");
  pdf.fontSize(14);

  const data = proformaInvoice?.products.map((product, ind) => {
    return {
      sno: ind + 1,
      modelno: product.product.model,
      name: product.product.name,
      image: product.product.imageUrl,
      qty: product.quantity,
      mrp: "Rs " + product.product.price,
      offerprice: "Rs " + product.price,
      total: "Rs " + product.price * product.quantity,
    };
  });

  const table = {
    options: {
      prepareHeader: () => pdf.font("Times-Roman").fontSize(12),
      prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
        pdf.font("Times-Roman").fontSize(12);
      },
    },
    headers: [
      { label: "S.No.", property: "sno", renderer: null },
      { label: "MODEL NO.", property: "modelno", renderer: null },
      { label: "NAME", property: "name", renderer: null },
      {
        label: "IMAGE",
        renderer: (value, indexColumn, indexRow, row, rectRow, rectCell) => {
          pdf.image(imagePaths[value], rectCell.x, rectCell.y + 1, {
            width: rectCell.width,
            height: rectCell.height - 1,
          });
          return "";
        },
        property: "image",
      },
      { label: "QUANTITY", property: "qty", renderer: null },
      { label: "MRP", property: "mrp", renderer: null },
      { label: "OFFER PRICE", property: "offerprice", renderer: null },
      { label: "TOTAL", property: "total", renderer: null },
    ],
    datas: data,
  };
  pdf.table(table);

  pdf
    .fontSize(18)
    .fillColor("#000000")
    .text("Total: Rs " + proformaInvoice.total, { align: "right" });

  pdf.moveDown();

  if (pdf.y + 33 > pdf.page.height - 15) {
    pdf.addPage();
  }

  pdf.moveDown(2);

  pdf.font("Times-Bold");
  pdf.fillColor("#000000");
  pdf.fontSize(14);

  pdf.text("Thanks & Regards");
  pdf.moveDown();
  pdf.text(proformaInvoice.createdBy.name);
  pdf.text(`(${proformaInvoice.createdBy.designation})`);
  pdf.text(`Mobile No: ${proformaInvoice.createdBy.phone}`);
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
        "Content-Disposition": `attachment;filename=proforma-invoice-${
          proformaInvoice?.people
            ? proformaInvoice?.people.firstname +
              "-" +
              (proformaInvoice?.people?.lastname || '')
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
