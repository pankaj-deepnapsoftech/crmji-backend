const { body } = require("express-validator");

const createStatusValidator = () => [
  body("name")
    .notEmpty()
    .withMessage("Status name is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Status name must be between 1 and 50 characters")
    .trim(),
];

const updateStatusValidator = () => [
  body("name")
    .notEmpty()
    .withMessage("Status name is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Status name must be between 1 and 50 characters")
    .trim(),
];

const reorderStatusesValidator = () => [
  body("statusIds")
    .isArray({ min: 1 })
    .withMessage("Status IDs array is required")
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error("Status IDs must be an array");
      }
      if (value.length > 10) {
        throw new Error("Maximum 10 status options allowed");
      }
      return true;
    }),
];

module.exports = {
  createStatusValidator,
  updateStatusValidator,
  reorderStatusesValidator,
};
