const express = require("express");
const {
  createExpense,
  editExpense,
  deleteExpense,
  expenseDetails,
  allExpenses,
  updateExpenseApproval,
} = require("../../controllers/expense/controller");
const {
  createExpenseValidator,
  validateHandler,
  editExpenseValidator,
  deleteExpenseValidator,
  expenseDetailsValidator,
} = require("../../validators/expense/validator");
const { checkAccess } = require("../../helpers/checkAccess");
const router = express.Router();

router.post(
  "/create-expense",
  checkAccess,
  createExpenseValidator(),
  validateHandler,
  createExpense
);
router.post(
  "/edit-expense",
  checkAccess,
  editExpenseValidator(),
  validateHandler,
  editExpense
);
router.post(
  "/delete-expense",
  checkAccess,
  deleteExpenseValidator(),
  validateHandler,
  deleteExpense
);
router.post(
  "/expense-details",
  checkAccess,
  expenseDetailsValidator(),
  validateHandler,
  expenseDetails
);
router.post("/all-expenses", allExpenses);
router.post("/update-approval", checkAccess, updateExpenseApproval);

module.exports = router;
