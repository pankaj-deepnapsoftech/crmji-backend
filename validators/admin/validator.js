const expressValidator = require('express-validator');
const {body, validationResult} = expressValidator;

const adminDetails = ()=>[
    body("adminId", "Admin id field should not be empty")
]

const deleteAdminValidator = ()=>[
    body("adminId", "Admin id field should not be empty")
]

const editAdminAccessValidator = ()=>[
    body("adminId", "Admin id field should not be empty"),
    body("designation", "Designation field should not be empty"),
    body('permissions').isArray().withMessage("Permissions field should be an array")
]

const assignToEmployeeValidator = ()=>[
    body("assign_to_id", "Assign to id field should not be empty"),
    body("creator_id", "Creator id field should not be empty")
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
    adminDetails,
    deleteAdminValidator,
    editAdminAccessValidator,
    assignToEmployeeValidator,
    validateHandler
}