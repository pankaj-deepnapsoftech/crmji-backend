const mongoose = require("mongoose");

const smsTemplateSchema = mongoose.Schema(
  {
    organization: {
      type: mongoose.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
    entityId: {
      type: String, 
      required: [true, "Entity ID from Nimbus is required"],
    },
    templateName: {
      type: String,
      required: [true, "Template Name is required"],
      trim: true,
    },
    templateId: {
      type: String,  
      required: [true, "Template ID from Nimbus is required"],
    },
    templateText: {
      type: String,
      required: [true, "Template Text is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

const smsTemplateModel = mongoose.model("SMSTemplate", smsTemplateSchema);

module.exports = smsTemplateModel;