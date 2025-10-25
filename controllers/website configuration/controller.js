const { TryCatch } = require("../../helpers/error");
const websiteConfigurationModel = require("../../models/websiteConfiguration");

const getFacebookApi = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    return res.status(401).json({
      status: 401,
      success: false,
      message: "You are not authorized to access this route",
    });
  }

  const websiteCofiguration = await websiteConfigurationModel.findOne({
    organization: req.user.organization,
    creator: req.user.id,
  });
  if (!websiteCofiguration) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Website configuration not found",
    });
  }

  res.status(200).json({
    status: 200,
    success: true,
    facebookApi: websiteCofiguration.facebook_api,
  });
});

const getIndiamartApi = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    return res.status(401).json({
      status: 401,
      success: false,
      message: "You are not authorized to access this route",
    });
  }

  const websiteCofiguration = await websiteConfigurationModel.findOne({
    organization: req.user.organization,
    creator: req.user.id,
  });
  if (!websiteCofiguration) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Website configuration not found",
    });
  }

  res.status(200).json({
    status: 200,
    success: true,
    indiamartApi: websiteCofiguration.indiamart_api,
  });
});

const getSmsApi = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    return res.status(401).json({
      status: 401,
      success: false,
      message: "You are not authorized to access this route",
    });
  }

  const websiteCofiguration = await websiteConfigurationModel.findOne({
    organization: req.user.organization,
    creator: req.user.id,
  });
  if (!websiteCofiguration) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Website configuration not found",
    });
  }

  res.status(200).json({
    status: 200,
    success: true,
    smsApi: {
      sms_api_key: websiteCofiguration?.sms_api_key,
      sms_api_secret: websiteCofiguration?.sms_api_secret,
      sms_sender_id: websiteCofiguration?.sms_sender_id,
      sms_welcome_template_id: websiteCofiguration?.sms_welcome_template_id,
      sms_dealdone_template_id: websiteCofiguration?.sms_dealdone_template_id,
      sms_entity_id: websiteCofiguration?.sms_entity_id,
    }
  });
});

const getEmailApi = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    return res.status(401).json({
      status: 401,
      success: false,
      message: "You are not authorized to access this route",
    });
  }

  const websiteCofiguration = await websiteConfigurationModel.findOne({
    organization: req.user.organization,
    creator: req.user.id,
  });
  if (!websiteCofiguration) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Website configuration not found",
    });
  }

  res.status(200).json({
    status: 200,
    success: true,
    emailApi: {
      email_id: websiteCofiguration?.email_id,
      email_password: websiteCofiguration?.email_password
    }
  });
});

const updateFacebookApi = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    return res.status(401).json({
      status: 401,
      success: false,
      message: "You are not authorized to access this route",
    });
  }

  const {facebookApi} = req.body;
  if(facebookApi === undefined){
    return res.status(400).json({
        status: 400,
        success: false,
        message: "Facebook API not provided"
    })
  }

  const websiteCofiguration = await websiteConfigurationModel.findOne({
    creator: req.user.id,
    organization: req.user.organization
  });
  if (!websiteCofiguration) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Website configuration not found",
    });
  }

  await websiteConfigurationModel.updateOne({organization: req.user.organization, creator: req.user.id}, {facebook_api: facebookApi});

  res.status(200).json({
    status: 200,
    success: true,
    message: "Facebook API has been updated successfully"
  });
});

const updateIndiamartApi = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    return res.status(401).json({
      status: 401,
      success: false,
      message: "You are not authorized to access this route",
    });
  }

  const {indiamartApi} = req.body;
  if(indiamartApi === undefined){
    return res.status(400).json({
        status: 400,
        success: false,
        message: "Indiamart API not provided"
    })
  }

  const websiteCofiguration = await websiteConfigurationModel.findOne({
    organization: req.user.organization,
    creator: req.user.id,
  });
  if (!websiteCofiguration) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Website configuration not found",
    });
  }

  await websiteConfigurationModel.updateOne({creator: req.user.id}, {indiamart_api: indiamartApi});

  res.status(200).json({
    status: 200,
    success: true,
    message: "Indiamart API has been updated successfully"
  });
});

const updateSmsApi = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    return res.status(401).json({
      status: 401,
      success: false,
      message: "You are not authorized to access this route",
    });
  }

  const {sms_api_key, sms_api_secret, sms_sender_id, sms_welcome_template_id, sms_dealdone_template_id, sms_entity_id} = req.body;
  if(!sms_api_key || !sms_api_secret || !sms_sender_id || !sms_welcome_template_id || !sms_dealdone_template_id || !sms_entity_id){
    return res.status(400).json({
        status: 400,
        success: false,
        message: "Please provide all the fields"
    })
  }

  const websiteCofiguration = await websiteConfigurationModel.findOne({
    organization: req.user.organization,
    creator: req.user.id,
  });
  if (!websiteCofiguration) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Website configuration not found",
    });
  }

  await websiteConfigurationModel.updateOne({creator: req.user.id}, {sms_api_key, sms_api_secret, sms_sender_id, sms_welcome_template_id, sms_dealdone_template_id, sms_entity_id});

  res.status(200).json({
    status: 200,
    success: true,
    message: "SMS API has been updated successfully"
  });
});

const updateEmailApi = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    return res.status(401).json({
      status: 401,
      success: false,
      message: "You are not authorized to access this route",
    });
  }

  const {email_id, email_password} = req.body;
  
  if(!email_id || !email_password){
    return res.status(400).json({
        status: 400,
        success: false,
        message: "Please provide all the fields"
    })
  }

  const websiteCofiguration = await websiteConfigurationModel.findOne({
    organization: req.user.organization,
    creator: req.user.id,
  });
  if (!websiteCofiguration) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Website configuration not found",
    });
  }

  await websiteConfigurationModel.updateOne({creator: req.user.id}, {email_id, email_password});

  res.status(200).json({
    status: 200,
    success: true,
    message: "Email API has been updated successfully"
  });
});

module.exports = {
  getFacebookApi,
  getIndiamartApi,
  getSmsApi,
  getEmailApi,
  updateFacebookApi,
  updateIndiamartApi,
  updateSmsApi,
  updateEmailApi
};
