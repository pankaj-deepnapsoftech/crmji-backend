const Document = require("../../models/document");
const path = require("path");
const fs = require("fs");

const createDocument = async (req, res) => {
  try {
    const { documentName, documentCategory, documentFile } = req.body;

    if (!documentFile) {
      return res.status(400).json({
        success: false,
        message: "Document file string is required",
      });
    }

    const document = new Document({
      documentName,
      documentCategory,
      documentFile,
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error) {
    console.error("Error creating document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload document",
      error: error.message,
    });
  }
};

const getDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;

    const query = {};

    if (category) {
      query.documentCategory = { $regex: category, $options: "i" };
    }

    if (search) {
      query.documentName = { $regex: search, $options: "i" };
    }

    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Document.countDocuments(query);

    res.status(200).json({
      success: true,
      data: documents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalDocuments: total,
        documentsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
      error: error.message,
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const filePath = path.join(
      __dirname,
      "../../uploads",
      document.documentFile
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Document.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete document",
      error: error.message,
    });
  }
};

const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentName, documentCategory, documentFile } = req.body;

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (documentName) document.documentName = documentName;
    if (documentCategory) document.documentCategory = documentCategory;

    if (documentFile) {
      document.documentFile = documentFile;
    }

    await document.save();

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      data: document,
    });
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update document",
      error: error.message,
    });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  deleteDocument,
  updateDocument,
};
