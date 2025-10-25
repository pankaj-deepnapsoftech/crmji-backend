const express = require("express");
const { checkAccess } = require("../../helpers/checkAccess");
const upload = require("../../utils/multer");
const {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  downloadDocument,
  getDocumentCategories,
} = require("../../controllers/document center/controller");
const {
  validateCreateDocument,
  validateUpdateDocument,
} = require("../../validators/document center/validator");

const router = express.Router();

router.post(
  "/",
  validateCreateDocument,
  checkAccess,
  createDocument
);
router.get("/", checkAccess, getDocuments);
router.put(
  "/:id",
  validateUpdateDocument,
  checkAccess,
  updateDocument
);
router.delete("/:id", checkAccess, deleteDocument);

module.exports = router;
