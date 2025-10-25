const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    documentName: {
      type: String,
      required: [true, "Document name is required"],
      trim: true,
    },
    documentCategory: {
      type: String,
      required: [true, "Document category is required"],
      trim: true,
    },
    documentFile: {
      type: String,
      required: [true, "Document file path is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
