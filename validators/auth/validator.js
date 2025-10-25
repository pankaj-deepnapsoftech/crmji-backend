const expressValidator = require('express-validator');
const {body, validationResult, oneOf} = expressValidator;

const registerValidator = ()=>[
    body("name", "Name field should not be empty").notEmpty().isAlpha('en-US', {ignore: ' '}).withMessage("Name field should only contain alphabets"),
    body("password", "Password field should not be empty").notEmpty().isLength({min: 5}).withMessage("Password field should be atleast 5 characters long"),
    body("phone", "Phone number field should not be empty").notEmpty().isNumeric().withMessage("Phone Number should only contain digits").isLength(10).withMessage("Phone Number should be 10 digits long"),
    body("email", "Email address field should not be empty").notEmpty().isEmail().withMessage("Email address field is not valid"),
    body("designation", "Designation field should not be empty").notEmpty()
]

const registerVerifyValidator = ()=>[
    body("email", "Email address field should not be empty").notEmpty().isEmail().withMessage("Email address field is not valid"),
    body("otp", "OTP field should not be empty").notEmpty().isLength(4).withMessage("OTP should be 4 digits long")
]

const loginValidator = ()=>[
    body("password", "Password field should not be empty").notEmpty().isLength({min: 5}).withMessage("Password field should be atleast 5 characters long"),
    oneOf([
        body("email").exists().bail().isEmail().withMessage("Email address field is not valid"),
        body("identifier").exists().bail().notEmpty().withMessage("Identifier field should not be empty")
    ], "Either a valid email or an employee ID is required")
]

const getOTPValidator = ()=>[
    oneOf([
        body("email").exists().bail().notEmpty(),
        body("identifier").exists().bail().notEmpty()
    ], "Either email or identifier is required to get OTP"),
    body("email").optional().if(body("email").custom(val => /@/.test(val))).isEmail().withMessage("Email address field is not valid")
]

const resetPasswordValidator = ()=>[
    oneOf([
        body("email").exists().bail().notEmpty(),
        body("identifier").exists().bail().notEmpty()
    ], "Either email or identifier is required"),
    body("email").optional().if(body("email").custom(val => /@/.test(val))).isEmail().withMessage("Email address field is not valid"),
    body("newPassword", "Password field should not be empty").notEmpty().isLength({min: 5}).withMessage("Password field should be atleast 5 characters long"),
    body("resetToken", "Reset token field should not be empty").notEmpty()
]

const passwordResetTokenValidator = ()=>[
    oneOf([
        body("email").exists().bail().notEmpty(),
        body("identifier").exists().bail().notEmpty()
    ], "Either email or identifier is required"),
    body("email").optional().if(body("email").custom(val => /@/.test(val))).isEmail().withMessage("Email address field is not valid"),
    body("otp", "OTP field should not be empty").notEmpty().isLength(4).withMessage("OTP should be 4 digits long")
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
    registerValidator,
    loginValidator,
    validateHandler,
    passwordResetTokenValidator,
    getOTPValidator,
    registerVerifyValidator,
    resetPasswordValidator
}