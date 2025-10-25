const { TryCatch } = require("../../helpers/error");
const { fetchImage } = require("../../helpers/fetchImage");
const indiamartLeadModel = require("../../models/indiamart_lead");
const leadModel = require("../../models/lead");
const offerModel = require("../../models/offer");
const PDFTable = require("pdfkit-table");
const peopleModel = require("../../models/people");
const settingModel = require("../../models/setting");

const createOffer = TryCatch(async (req, res) => {
  const {
    lead,
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
  const totalOffers = await offerModel.find().countDocuments();
  const offername = `${totalOffers + 1}/${currYear}`;

  const isExistingLead = await leadModel.findById(lead);
  const isExistingIndiamartLead = await indiamartLeadModel.findById(lead);
  if (!isExistingLead && !isExistingIndiamartLead) {
    throw new Error("Lead doesn't exists", 404);
  }

  if (isExistingLead) {
    await offerModel.create({
      creator: req.user.id,
      offername,
      lead,
      status,
      startdate,
      expiredate,
      remarks,
      products,
      subtotal,
      total,
      tax,
      createdBy: req.user.id,
      organization: req.user.organization
    });
  } else {
    await offerModel.create({
      creator: req.user.id,
      offername,
      indiamartlead: lead,
      status,
      startdate,
      expiredate,
      remarks,
      products,
      subtotal,
      total,
      tax,
      createdBy: req.user.id,
      organization: req.user.organization
    });
  }

  res.status(200).json({
    status: 200,
    success: true,
    message: "Offer has been created successfully",
  });
});

const editOffer = TryCatch(async (req, res) => {
  const {
    offerId,
    lead,
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
  const totalOffers = await offerModel.find().countDocuments();
  const offername = `${totalOffers + 1}/${currYear}`;

  const isExistingLead = await leadModel.findById(lead);
  const isExistingIndiamartLead = await indiamartLeadModel.findById(lead);
  if (!isExistingLead && !isExistingIndiamartLead) {
    throw new Error("Lead doesn't exists", 404);
  }

  const isExistingOffer = await offerModel.findById(offerId);
  if (!isExistingOffer) {
    throw new Error("Offer doesn't exists", 404);
  }

  if (
    req.user.role !== "Super Admin" &&
    isExistingOffer.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to edit this offer", 401);
  }

  if (isExistingLead) {
    const offer = await offerModel.findOneAndUpdate(
      { _id: offerId },
      {
        offername,
        lead,
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
  }
  else{
    const offer = await offerModel.findOneAndUpdate(
      { _id: offerId },
      {
        offername,
        indiamartlead: lead,
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
  }

  res.status(200).json({
    status: 200,
    success: true,
    message: "Offer has been updated successfully",
  });
});

const getAllOffers = TryCatch(async (req, res) => {
  let offers = [];

  if (req.user.role === "Super Admin") {
    offers = await offerModel
      .find({organization: req.user.organization})
      .populate({
        path: "lead",
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
      .populate({
        path: "indiamartlead",
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
    offers = await offerModel
      .find({ organization: req.user.organization, creator: req.user.id })
      .populate({
        path: "lead",
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
    offers,
  });
});

const deleteOffer = TryCatch(async (req, res) => {
  const { offerId } = req.body;

  const isOfferExists = await offerModel.findById(offerId);
  if (!isOfferExists) {
    throw new Error("Offer doesn't exists", 404);
  }

  if (
    req.user.role !== "Super Admin" &&
    isOfferExists.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to delete this offer", 401);
  }

  await offerModel.deleteOne({ _id: offerId });

  res.status(200).json({
    status: 200,
    success: true,
    message: "Offer deleted successfully",
  });
});

const getOfferDetails = TryCatch(async (req, res) => {
  const { offerId } = req.body;

  const isExistingOffer = await offerModel
    .findById(offerId)
    .populate({
      path: "lead",
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
      path: "indiamartlead",
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

  if (!isExistingOffer) {
    throw new Error("Offer doesn't exists", 404);
  }

  if (
    req.user.role !== "Super Admin" &&
    isExistingOffer.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to access this offer", 401);
  }

  res.status(200).json({
    status: 200,
    success: true,
    offer: isExistingOffer,
  });
});

const downloadOffer = TryCatch(async (req, res) => {
  const { offerId } = req.body;
  const date = new Date();
  
  const companyDetails = await settingModel.findOne({organization: req?.user?.organization});

  const offer = await offerModel
    .findById(offerId)
    .populate({
      path: "lead",
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
      path: "indiamartlead",
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
      select: "name model price imageUrl category",
      populate: [
        {
          path: "category",
          model: "Product Category",
          select: "categoryname",
        },
      ],
    })
    .populate("createdBy", "name designation phone");
  if (!offer) {
    throw new Error("Offer doesn't exists");
  }

  if (
    req.user.role !== "Super Admin" &&
    offer.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to download this offer", 401);
  }

  const buffers = [];
  const pdf = new PDFTable({
    margin: 15,
    font: "Times-Roman",
  });

  const imagePaths = {};
  const imagePromises = offer.products.map(async (product, index) => {
    const img = await fetchImage(product.product.imageUrl);
    imagePaths[product.product.imageUrl] = img;
  });

  await Promise.all(imagePromises);

  let companyLogo;
  if (companyDetails && companyDetails?.company_logo) {
    companyLogo = await fetchImage(companyDetails?.company_logo);
  }

  pdf.image(companyLogo || "logo.png", { width: 170, height: 120 });

  pdf.y = 50;

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
      offer?.lead
        ? offer?.lead?.people
          ? offer?.lead?.people.firstname + " " + offer?.lead?.people.lastname
          : offer?.lead?.company.companyname
        : offer?.indiamartlead?.people
        ? offer?.indiamartlead?.people.firstname +
          (offer?.indiamartlead?.people.lastname
            ? " " + offer?.indiamartlead?.people.lastname
            : "")
        : offer?.indiamartlead?.company.companyname
    }`
  );

  pdf.moveDown(2);
  pdf.fontSize(20);
  pdf.font("Times-Roman");

  pdf
    .rect(15, pdf.y, pdf.page.width - 35, 33)
    .fill("#000000")
    .fill("white")
    .text("OFFER", pdf.x, pdf.y + 10, {
      align: "center",
    });

  pdf.y += 4;
  pdf.fillColor("black");
  pdf.fontSize(14);

  const data = offer?.products.map((product, ind) => {
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
    .text("Total: Rs " + offer.total, { align: "right" });

  pdf.moveDown();
  pdf.fontSize(20);

  if (pdf.y + 33 > pdf.page.height - 15) {
    pdf.addPage();
  }

  if (pdf.y + 33 > pdf.page.height - 15) {
    pdf.addPage();
  }

  pdf.moveDown(2);

  pdf.font("Times-Bold");
  pdf.fillColor("#000000");
  pdf.fontSize(14);

  pdf.text("Thanks & Regards");
  pdf.moveDown();
  pdf.text(offer.createdBy.name);
  pdf.text(`(${offer.createdBy.designation})`);
  pdf.text(`Mobile No: ${offer.createdBy.phone}`);
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
        "Content-Disposition": `attachment;filename=offer-${
          offer?.lead
            ? offer?.lead?.people
              ? offer?.lead?.people.firstname +
                "-" +
                offer?.lead?.people.lastname
              : offer?.lead?.company.companyname
            : offer?.indiamartlead?.people
            ? offer?.indiamartlead?.people.firstname +
              (offer?.indiamartlead?.people.lastname
                ? "-" + offer?.indiamartlead?.people.lastname
                : "")
            : offer?.indiamartlead?.company.companyname
        }-${offer?._id}.pdf`,
      })
      .end(pdfData);
  });
  pdf.end();
});

module.exports = {
  createOffer,
  getAllOffers,
  deleteOffer,
  editOffer,
  downloadOffer,
  getOfferDetails,
};
