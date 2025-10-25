const expressValidator = require('express-validator');
const {body, validationResult, oneOf} = expressValidator;

const createPaymentValidator = ()=>[
    body("invoiceId", "Invoice Id field should not be empty").notEmpty(),
    body("amount", "Amount field should not be empty").notEmpty().isNumeric().withMessage("Amount field should only contain numeric values"),
    body("mode", "Mode field should not be empty").notEmpty()
]

const editPaymentValidator = ()=>[
    body("paymentId", "Payment Id field should not be empty").notEmpty()
]

const deletePaymentValidator = ()=>[
    body("paymentId", "Payment Id field should not be empty").notEmpty()
]

const downloadPaymentValidator = ()=>[
    body("paymentId", "Payment Id field should not be empty").notEmpty()
]

const paymentDetailsValidator = ()=>[
    body("paymentId", "Payment Id field should not be empty").notEmpty()
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
    createPaymentValidator,
    editPaymentValidator,
    deletePaymentValidator,
    paymentDetailsValidator,
    downloadPaymentValidator,
    validateHandler
}