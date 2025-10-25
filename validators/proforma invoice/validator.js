const expressValidator = require('express-validator');
const {body, validationResult, oneOf} = expressValidator;

const createProformaInvoiceValidator = ()=>[
    // body("customer", "Customer Id field should not be empty").notEmpty(),
    body("startdate", "Start date field should not be empty").notEmpty(),
    // body("expiredate", "Expiry date field should not be empty").notEmpty(),
    body("tax", "Tax field should not be empty").notEmpty(),
    body("subtotal", "Sub total field should not be empty").isNumeric().withMessage("Sub total field should be a number"),
    body("total", "Sub total field should not be empty").isNumeric().withMessage("Sub total field should be a number"),
    body('products').isArray({min: 1}).withMessage("Products should have atleast 1 product")
]

const editProformaInvoiceValidator = ()=>[
    body("proformaInvoiceId", "Proforma invoice Id field should not be empty").notEmpty(),
    // body("customer", "Customer Id field should not be empty").notEmpty(),
    body("startdate", "Start date field should not be empty").notEmpty(),
    // body("expiredate", "End date field should not be empty").notEmpty(),
    body("tax", "Tax field should not be empty").notEmpty(),
    body("subtotal", "Sub total field should not be empty").isNumeric().withMessage("Sub total field should be a number"),
    body("total", "Sub total field should not be empty").isNumeric().withMessage("Sub total field should be a number"),
    body('products').isArray({min: 1}).withMessage("Products should have atleast 1 product")
]

const deleteProformaInvoiceValidator = ()=>[
    body("proformaInvoiceId", "Proforma invoice Id field should not be empty").notEmpty()
]

const downloadProformaInvoiceValidator = ()=>[
    body("proformaInvoiceId", "Proforma invoice Id field should not be empty").notEmpty()
]

const proformaInvoiceDetailsValidator = ()=>[
    body("proformaInvoiceId", "Proforma invoice Id field should not be empty").notEmpty()
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
    createProformaInvoiceValidator,
    editProformaInvoiceValidator,
    deleteProformaInvoiceValidator,
    proformaInvoiceDetailsValidator,
    downloadProformaInvoiceValidator,
    validateHandler
}