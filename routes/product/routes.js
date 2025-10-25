const express = require('express');
const { createProduct, editProduct, deleteProduct, productDetails, allProducts } = require('../../controllers/product/controller');
const { createProductValidator, validateHandler, editProductValidator, deleteProductValidator, productDetailsValidator } = require('../../validators/product/validator');
const { checkAccess } = require('../../helpers/checkAccess');
const router = express.Router();

router.post("/create-product", checkAccess, createProductValidator(), validateHandler, createProduct);
router.post("/edit-product", checkAccess, editProductValidator(), validateHandler, editProduct);
router.post("/delete-product", checkAccess, deleteProductValidator(), validateHandler, deleteProduct);
router.post("/product-details", checkAccess, productDetailsValidator(), validateHandler, productDetails);
router.post("/all-products", allProducts);

module.exports = router;