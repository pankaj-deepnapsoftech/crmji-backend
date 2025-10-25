const { body, validationResult } = require("express-validator");

// Validation rules for creating a document
const validateCreateDocument = [
  body("documentName")
    .notEmpty()
    .withMessage("Document name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Document name must be between 1 and 255 characters")
    .trim(),

  body("documentCategory")
    .notEmpty()
    .withMessage("Document category is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Document category must be between 1 and 100 characters")
    .trim(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

const validateUpdateDocument = [
  body("documentName")
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage("Document name must be between 1 and 255 characters")
    .trim(),

  body("documentCategory")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Document category must be between 1 and 100 characters")
    .trim(),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

module.exports = {
  validateCreateDocument,
  validateUpdateDocument,
};
