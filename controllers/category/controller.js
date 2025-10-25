const { TryCatch, ErrorHandler } = require("../../helpers/error");
const productModel = require("../../models/product");
const productCategoryModel = require("../../models/productCategory");

const createCategory = TryCatch(async (req, res) => {
  const { categoryname, description } = req.body;
  

 try {
  const category = await productCategoryModel.create({
    categoryname,
    description,
    creator: req.user.id,
    organization: req.user.organization
  });

  res.status(200).json({
    status: 200,
    success: true,
    message: "Category has been created successfully",
    category: category,
  });
 } catch (error) {
  res.status(500).json({
    status: 500,
    success: false,
    message: "Failed to add category",
  });
 }
});

const editCategory = TryCatch(async (req, res) => {
  const { categoryId, categoryname, description } = req.body;

  const isCategoryExists = await productCategoryModel.findById(categoryId);
  if (!isCategoryExists) {
    throw new ErrorHandler("Category doesn't exists", 400);
  }

  const updatedCategory = await productCategoryModel.findOneAndUpdate(
    { _id: categoryId },
    { categoryname, description },
    { new: true }
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "Category has been updated successfully",
    updatedCategory: updatedCategory,
  });
});

const deleteCategory = TryCatch(async (req, res) => {
  const { categoryId } = req.body;

  const isCategoryExists = await productCategoryModel.findById(categoryId);
  if (!isCategoryExists) {
    throw new ErrorHandler("Category doesn't exists", 400);
  }
  if (req.user.role !== "Super Admin") {
    throw new Error("You are not allowed to delete this product category", 401);
  }

  const isInProduct = await productModel.find({category: categoryId}).countDocuments();
  if(isInProduct === 0){
    await productCategoryModel.deleteOne({
      _id: categoryId,
    });
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Category has been deleted successfully",
    });
  }

  res.status(400).json({
    status: 400,
    success: false,
    message: "Category cannot be deleted as it is being used in Product(s)",
  });
});

const categoryDetails = TryCatch(async (req, res) => {
  const { categoryId } = req.body;

  const category = await productCategoryModel.findById(categoryId);
  if (!category) {
    throw new ErrorHandler("Category doesn't exists", 400);
  }

  res.status(200).json({
    status: 200,
    success: true,
    category: category,
  });
});

const allCategories = TryCatch(async (req, res) => {
  const { page = 1 } = req.body;

  // const totalCategoriesPerPage = 10;
  // const skip = (page-1)*totalCategoriesPerPage;

  const categories = await productCategoryModel.find({organization: req.user.organization}).sort({ createdAt: -1 }).populate('creator', 'name');
  // .skip(skip)
  // .limit(totalCategoriesPerPage);

  res.status(200).json({
    status: 200,
    success: true,
    categories: categories,
  });
});

// const getAllColors = TryCatch(async (req, res)=>{
//     const colors = await productCategoryModel.schema.path('color').enumValues;
//     res.status(200).json({
//         status: 200,
//         success: true,
//         colors: colors
//     });
// })

module.exports = {
  createCategory,
  editCategory,
  deleteCategory,
  categoryDetails,
  allCategories,
  // getAllColors
};
