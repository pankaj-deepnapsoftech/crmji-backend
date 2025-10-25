const expressValidator = require('express-validator');
const {body, validationResult, oneOf} = expressValidator;

const createOfferValidator = ()=>[
    body("lead", "Lead Id field should not be empty").notEmpty(),
    body("startdate", "Start date field should not be empty").notEmpty(),
    body("expiredate", "Expiry date field should not be empty").notEmpty(),
    body("subtotal", "Sub total field should not be empty").isNumeric().withMessage("Sub total field should be a number"),
    body("total", "Sub total field should not be empty").isNumeric().withMessage("Sub total field should be a number"),
    body('products').isArray({min: 1}).withMessage("Products should have atleast 1 product")
]

const editOfferValidator = ()=>[
    body("offerId", "Offer Id field should not be empty").notEmpty(),
    body("lead", "Lead Id field should not be empty").notEmpty(),
    body("startdate", "Start date field should not be empty").notEmpty(),
    body("expiredate", "End date field should not be empty").notEmpty(),
    body("tax", "Tax field should not be empty").notEmpty(),
    body("subtotal", "Sub total field should not be empty").isNumeric().withMessage("Sub total field should be a number"),
    body("total", "Sub total field should not be empty").isNumeric().withMessage("Sub total field should be a number"),
    body('products').isArray({min: 1}).withMessage("Products should have atleast 1 product")
]

const deleteOfferValidator = ()=>[
    body("offerId", "Offer Id field should not be empty").notEmpty()
]

const offerDetailsValidator = ()=>[
    body("offerId", "Offer Id field should not be empty").notEmpty()
]

const downloadOfferValidator = ()=>[
    body("offerId", "Offer Id field should not be empty").notEmpty()
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
    createOfferValidator,
    editOfferValidator,
    deleteOfferValidator,
    offerDetailsValidator,
    downloadOfferValidator,
    validateHandler
}