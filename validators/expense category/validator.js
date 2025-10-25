const expressValidator = require('express-validator');
const {body, oneOf, validationResult} = expressValidator;

const createCategoryValidator = ()=>[
    body("name", "Name field should not be empty").notEmpty(),
    body("description", "Description field should not be empty").notEmpty(),
    // body("enabled", "Enabled field should not be empty").notEmpty(),
]

const editCategoryValidator = ()=>[
    body("categoryId", "Category Id field should not be empty").notEmpty(),
    oneOf([
        body("name").notEmpty(),
        body("description").notEmpty()
    ], {message: "Name/Description field should not be empty"})
    // oneOf([
    //     body("name").notEmpty(),
    //     body("color").notEmpty(),
    //     body("description").notEmpty(),
    //     body("enabled").notEmpty(),
    // ], {message: "Name/Color/Description/Enabled field should not be empty"})
]

const deleteCategoryValidator = ()=>[
    body("categoryId", "Category Id field should not be empty").notEmpty(),
]

const categoryDetailsValidator = ()=>[
    body("categoryId", "Category Id field should not be empty").notEmpty(),
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
    createCategoryValidator,
    editCategoryValidator,
    deleteCategoryValidator,
    categoryDetailsValidator,
    validateHandler
}