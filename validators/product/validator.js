const expressValidator = require('express-validator');
const {body, validationResult} = expressValidator;

const createProductValidator = ()=>[
    body("name", "Name field should not be empty").notEmpty(),
    body("model", "Model field should not be empty").notEmpty(),
    body("price", "Price field should not be empty").notEmpty(),
    body("categoryId", "Category Id field should not be empty").notEmpty(),
]

const editProductValidator = ()=>[
    body("productId", "Product Id field should not be empty").notEmpty(),
    body("categoryId", "Category Id field should not be empty").notEmpty(),
    body("name", "Name field should not be empty").notEmpty(),
    body("model", "Model field should not be empty").notEmpty(),
    body("price", "Price field should not be empty").notEmpty()
]

const deleteProductValidator = ()=>[
    body("productId", "Product Id field should not be empty").notEmpty(),
]

const productDetailsValidator = ()=>[
    body("productId", "Product Id field should not be empty").notEmpty(),
]

const validateHandler = (req, res, next)=>{
    const {errors} = validationResult(req);

    if(errors.length === 0){
        return next();
    }

    const errorMsg = errors.map(err=>err.msg).join(", ");
    res.status(400).json({
        status: 400,
        success: false,
        message: errorMsg
    })
}

module.exports = {
    createProductValidator,
    editProductValidator,
    deleteProductValidator,
    productDetailsValidator,
    validateHandler
}