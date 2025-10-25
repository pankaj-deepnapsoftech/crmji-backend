const expressValidator = require("express-validator");
const { body, validationResult } = expressValidator;

const createExpenseValidator = () => [
  body("name", "Name field should not be empty").notEmpty(),
  body("price", "Price field should not be empty").notEmpty(),
  body("categoryId", "Category Id field should not be empty").notEmpty(),
  body("expenseType", "Expense Type is required (TA/DA)")
    .notEmpty()
    .isIn(["TA", "DA"])
    .withMessage("Expense Type must be TA or DA"),
];

const editExpenseValidator = () => [
  body("expenseId", "Expense Id field should not be empty").notEmpty(),
  body("categoryId", "Category Id field should not be empty").notEmpty(),
  body("name", "Name field should not be empty").notEmpty(),
  body("price", "Price field should not be empty").notEmpty(),
  body("expenseType", "Expense Type is required (TA/DA)")
    .notEmpty()
    .isIn(["TA", "DA"])
    .withMessage("Expense Type must be TA or DA"),
];

const deleteExpenseValidator = () => [
  body("expenseId", "Expense Id field should not be empty").notEmpty(),
];

const expenseDetailsValidator = () => [
  body("expenseId", "Expense Id field should not be empty").notEmpty(),
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

module.exports = {
  createExpenseValidator,
  editExpenseValidator,
  deleteExpenseValidator,
  expenseDetailsValidator,
  validateHandler,
};
