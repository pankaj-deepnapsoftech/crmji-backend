const expressValidator = require('express-validator');
const {body, oneOf, validationResult} = expressValidator;

const createCustomerValidator = ()=>[
    body("type", "Type field should not be empty").notEmpty(),
    oneOf([body('companyId').notEmpty(), body('peopleId').notEmpty()], {
        message: 'Company Id or People Id field is required',
    })
]

const editCustomerValidator = ()=>[
    body("customerId", "Customer Id field should not be empty").notEmpty()
]

const deleteCustomerValidator = ()=>[
    body("customerId", "Customer Id field should not be empty").notEmpty()
]

const customerDetailsValidator = ()=>[
    body("customerId", "Customer Id field should not be empty").notEmpty()
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
    createCustomerValidator,
    editCustomerValidator,
    deleteCustomerValidator,
    customerDetailsValidator,
    validateHandler
}