const expressValidator = require('express-validator');
const {body, validationResult} = expressValidator;

const createChatValidator = (req, res)=>[
    body("groupName")
        .notEmpty().withMessage("Group name is required")
        .isString().withMessage("Group name must be a string"),

    body("selectedMembers")
        .isArray({ min: 1 }).withMessage("Participants must be a non-empty array")
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
    createChatValidator,
    validateHandler
}