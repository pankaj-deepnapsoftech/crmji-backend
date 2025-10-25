const expressValidator = require('express-validator');
const {body, validationResult} = expressValidator;

const createOrganizationValidator = ()=>[
    body("name", "Name field should not be empty").notEmpty().isAlpha('en-US', {ignore: ' '}).withMessage("Name field should only contain alphabets"),
    body("email", "Email id field should not be empty").notEmpty(),
    body("company", "Company field should not be empty").notEmpty(),
    body("city", "City field should not be empty").notEmpty(),
    body("password", "Password field should not be empty").notEmpty().isLength({min: 5}).withMessage("Password field should be atleast 5 characters long"),
    body("employeeCount", "Employee count field should not be empty").notEmpty().isNumeric().withMessage("Employee count should only contain digits"),
    body("phone", "Phone field should not be empty").notEmpty().isNumeric().withMessage("Phone Number should only contain digits").isLength(10).withMessage("Phone Number should be 10 digits long")
]

const verifyOTPValidator = ()=>[
    body("email", "Email id field should not be empty").notEmpty(),
    body("otp", "OTP field should not be empty").notEmpty()
]

const loginValidator = ()=>[
    body("email", "Email id field should not be empty").notEmpty(),
    body("password", "Password field should not be empty").notEmpty().isLength({min: 5}).withMessage("Password field should be atleast 5 characters long")
]

const getOTPValidator = ()=>[
    body("email", "Email id field should not be empty").notEmpty()
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
    createOrganizationValidator,
    verifyOTPValidator,
    loginValidator,
    getOTPValidator,
    validateHandler
}