const express = require('express');
const { createCategory, editCategory, deleteCategory, categoryDetails, allCategories } = require('../../controllers/category/controller');
const { createCategoryValidator, validateHandler, editCategoryValidator, deleteCategoryValidator, categoryDetailsValidator } = require('../../validators/category/validator');
const { checkAccess } = require('../../helpers/checkAccess');
const router = express.Router();

router.post('/create-category', checkAccess, createCategoryValidator(), validateHandler, createCategory);
router.post('/edit-category', checkAccess, editCategoryValidator(), validateHandler, editCategory);
router.post('/delete-category', checkAccess, deleteCategoryValidator(), validateHandler, deleteCategory);
router.post('/category-details', checkAccess, categoryDetailsValidator(), validateHandler, categoryDetails);
router.post('/all-categories', allCategories);
// router.get('/all-colors', getAllColors);

module.exports = router;