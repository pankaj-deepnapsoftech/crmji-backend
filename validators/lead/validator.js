const expressValidator = require("express-validator");
const { body, validationResult, oneOf } = expressValidator;

const createLeadValidator = () => [
  body("leadtype", "Lead Type field should not be empty").notEmpty(),
  oneOf([body("companyId").notEmpty(), body("peopleId").notEmpty()], {
    message: "Company Id or People Id field is required",
  }),
  body("products")
    .isArray({ min: 1 })
    .withMessage("Products should have atleast 1 product"),
];

const editLeadValidator = () => [
  body("leadId", "Lead Id field should not be empty").notEmpty(),
];

const deleteLeadValidator = () => [
  body("leadId", "Lead Id field should not be empty").notEmpty(),
];

const leadDetailsValidator = () => [
  body("leadId", "Lead Id field should not be empty").notEmpty(),
];

const validateHandler = (req, res, next) => {
  const { errors } = validationResult(req);

  if (errors.length === 0) {
    return next();
  }

  const errorMsg = errors.map((err) => err.msg).join(", ");
  res.status(400).json({
    status: 400,
    success: false,
    message: errorMsg,
  });
};

const scheduleDemoValidator = () => [
  body("leadId", "Lead Id field should not be empty").notEmpty(),
  body(
    "demoDateTime",
    "Demo Date and Time field should not be empty"
  ).notEmpty(),
  body("demoType", "Demo Type field should not be empty")
    .notEmpty()
    .isIn(["Physical", "Virtual"])
    .withMessage("Demo Type must be either Physical or Virtual"),
];

const editScheduleDemoValidator = () => [
  body("leadId", "Lead Id field should not be empty").notEmpty(),
  body("status", "Status field should not be empty").notEmpty(),
  body("remark", "Remark field should be a string").optional().isString(),
];

module.exports = {
  createLeadValidator,
  editLeadValidator,
  deleteLeadValidator,
  leadDetailsValidator,
  validateHandler,
  scheduleDemoValidator,
  editScheduleDemoValidator,
};
