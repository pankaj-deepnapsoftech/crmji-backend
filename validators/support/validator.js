const expressValidator = require('express-validator');
const {body, validationResult, oneOf} = expressValidator;

const createSupportValidator = ()=>[
    body("name", "Name field should not be empty").notEmpty(),
    body("mobile", "Mobile field should not be empty").notEmpty().isNumeric().withMessage("Mobile Number should only contain digits").isLength(10).withMessage("Mobile Number should be 10 digits long"),
    body("description", "Description field should not be empty").notEmpty(),
    body("purpose", "Sub total field should not be empty").notEmpty()
]

const editSupportValidator = ()=>[
    body("supportId", "Support Id field should not be empty").notEmpty()
]

const deleteSupportValidator = ()=>[
    body("supportId", "Support Id field should not be empty").notEmpty()
]

const supportDetailsValidator = ()=>[
    body("supportId", "Support Id field should not be empty").notEmpty()
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
    createSupportValidator,
    editSupportValidator,
    supportDetailsValidator,
    deleteSupportValidator,
    validateHandler
}