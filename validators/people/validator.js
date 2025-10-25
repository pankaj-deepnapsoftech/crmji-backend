const expressValidator = require('express-validator');
const {body, validationResult} = expressValidator;

const createPeopleValidator = ()=>[
    body("firstname", "First Name field should not be empty").notEmpty().isAlpha('en-US', {ignore: ' '}).withMessage("Firstname field should only contain alphabets"),
    body("lastname", "Last Name field should not be empty").notEmpty().isAlpha('en-US', {ignore: ' '}).withMessage("Lastname field should only contain alphabets"),
    body("email", "Email field should not be empty").notEmpty().isEmail(),
    body("phone", "Phone field should not be empty").notEmpty().isNumeric().withMessage("Phone Number should only contain digits").isLength(10).withMessage("Phone Number should be 10 digits long"),
]

const editPeopleValidator = ()=>[
    body("peopleId", "Individual Id field should not be empty").notEmpty(),
]

const deletePeopleValidator = ()=>[
    body("peopleId", "Individual Id field should not be empty").notEmpty(),
]

const peopleDetailsValidator = ()=>[
    body("peopleId", "Individual Id field should not be empty").notEmpty(),
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
    createPeopleValidator,
    editPeopleValidator,
    deletePeopleValidator,
    peopleDetailsValidator,
    validateHandler
}