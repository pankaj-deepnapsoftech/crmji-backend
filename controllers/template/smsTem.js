
const { TryCatch, ErrorHandler } = require("../../helpers/error"); 
const smsTemplateModel = require("../../models/smsTemplate");

const createTemplate = TryCatch(async (req, res) => {
  const { templateName, templateId, templateText, entityId } = req.body;

  if (!templateName || !templateId || !templateText || !entityId) {
    throw new ErrorHandler("All fields (Name, ID, Text, Entity ID) are required", 400);
  }

  // Validate Entity ID numeric
  if (isNaN(entityId)) {
    throw new ErrorHandler("Entity ID must be numeric from Nimbus", 400);
  }

  const existingTemplate = await smsTemplateModel.findOne({
    organization: req.user.organization,
    templateId,
  });

  if (existingTemplate) {
    throw new ErrorHandler("Template ID already exists", 409);
  }

  const template = await smsTemplateModel.create({
    organization: req.user.organization,
    entityId,
    templateName,
    templateId,
    templateText,
  });

  res.status(201).json({
    success: true,
    message: "Template added successfully (use only after Nimbus verification)",
    template,
  });
});

const getTemplates = TryCatch(async (req, res) => {
  const { templateName, entityId } = req.query;

  const query = { organization: req.user.organization };
  if (entityId) {
    query.entityId = entityId;
  }
  if (templateName) {
    query.templateName = { $regex: templateName, $options: "i" };
  }

  const templates = await smsTemplateModel.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    templates,
  });
});

module.exports = {
  createTemplate,
  getTemplates,
};