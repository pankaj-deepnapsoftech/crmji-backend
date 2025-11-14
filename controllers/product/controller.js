const { TryCatch, ErrorHandler } = require("../../helpers/error");

const productCategoryModel = require("../../models/productCategory");
const productModel = require("../../models/product");
const invoiceModel = require("../../models/invoice");
const proformaInvoiceModel = require("../../models/proformaInvoice");
const offerModel = require("../../models/offer");
const leadModel = require("../../models/lead");

const createProduct = TryCatch(async (req, res) => {
  const { name, categoryId, price, description, imageUrl, model, type } = req.body;

  const isCategoryExists = await productCategoryModel.findById(categoryId);
  if (!isCategoryExists) {
    throw new ErrorHandler("Category doesn't exists", 400);
  }

  const product = await productModel.create({
    name,
    category: categoryId,
    description,
    price,
    imageUrl,
    model,
    creator: req.user.id,
    organization: req.user.organization,
    type
  });

  res.status(200).json({
    status: 200,
    success: true,
    message: "Product has been added successfully",
    product: product,
  });
});

const editProduct = TryCatch(async (req, res) => {
  const { productId, name, categoryId, price, description, model, imageUrl  } = req.body;

  const isProductExists = await productModel.findById(productId);
  if (!isProductExists) {
    throw new ErrorHandler("Product doesn't exists", 400);
  }

  const isCategoryExists = await productCategoryModel.findById(categoryId);
  if (!isCategoryExists) {
    throw new ErrorHandler("Category doesn't exists", 400);
  }

  const updatedProduct = await productModel.findOneAndUpdate(
    { _id: productId },
    {
      name,
      category: categoryId,
      description,
      price,
      model,
      imageUrl,
    },
    { new: true }
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "Product has been updated successfully",
    updatedProduct: updatedProduct,
  });
});

const deleteProduct = TryCatch(async (req, res) => {
  const { productId } = req.body;

  const isProductExists = await productModel.findById(productId);

  if (!isProductExists) {
    throw new ErrorHandler("Product doesn't exists", 400);
  }
  if (req.user.role !== "Super Admin") {
    throw new Error("You are not allowed to delete this product", 401);
  }

  const isInInvoice = await invoiceModel.find({$and: {'products.product': productId}}).countDocuments();
  const isInLead = await leadModel.find({$and: {'products': productId}}).countDocuments();
  const isInOffers = await offerModel.find({$and: {'products.product': productId}}).countDocuments();
  const isInProformaInvoices = await proformaInvoiceModel.find({$and: {'products.product': productId}}).countDocuments();

  if(isInInvoice === 0 && isInOffers === 0 && isInProformaInvoices === 0 && isInLead === 0){
    await productModel.deleteOne({ _id: productId });
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Product has been deleted successfully",
    });
  }

  return res.status(400).json({
    status: 400,
    success: false,
    message: "Product cannot be deleted as it is being used in Invoices, Proforma Invoices, Leads or Offers",
  });
});

const productDetails = TryCatch(async (req, res) => {
  const { productId } = req.body;

  const product = await productModel.findById(productId)
                          .populate('category', 'categoryname');

  if (!product) {
    throw new ErrorHandler("Product doesn't exists", 400);
  }

  res.status(200).json({
    status: 200,
    success: true,
    product: product,
  });
});

const allProducts = TryCatch(async (req, res) => {
  const { page = 1 } = req.body;

  // const totalProductsPerPage = 10;
  // const skip = (page - 1) * totalProductsPerPage;

  const products = await productModel
    .find({organization: req.user.organization})
    .sort({ createdAt: -1 })
    // .skip(skip)
    // .limit(totalProductsPerPage)
    .populate([
      {
        path: "category",
        populate: "categoryname",
        strictPopulate: false,
      },
    ]).populate('creator', 'name');

  const results = products.map((p) => {
    return {
      _id: p._id,
      name: p.name,
      model: p.model,
      category: p.category.categoryname,
      price: p.price,
      description: p.description,
      imageUrl: p.imageUrl,
      creator: p?.creator?.name,
      createdAt: p?.createdAt,
    };
  });

  res.status(200).json({
    status: 200,
    success: true,
    products: results,
  });
});

module.exports = {
  createProduct,
  editProduct,
  deleteProduct,
  productDetails,
  allProducts,
};
