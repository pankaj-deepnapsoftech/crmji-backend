const request = require("request");
const websiteConfigurationModel = require("../../models/websiteConfiguration");
const SMSLog = require("../../models/sms.js"); // Import the SMSLog model

const axios = require("axios");

const sendBulkSms = async (req, res) => {
  try {
    const { mobiles, templateId, message, name } = req.body;

    // Fetch organization-specific SMS configuration
    const websiteConfiguration = await websiteConfigurationModel.findOne({
      organization: req.user.organization,
    });

    if (!websiteConfiguration) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Organization configuration not found",
      });
    }

    const {
      sms_api_key,
      sms_api_secret,
      sms_sender_id: senderId,
      sms_entity_id: entityId,
    } = websiteConfiguration;

    // Validate input fields
    if (!templateId || templateId.trim().length === 0) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Please provide the template id field",
      });
    }
    if (!senderId || senderId.trim().length === 0) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Please provide the sender id field",
      });
    }
    if (!entityId || entityId.trim().length === 0) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Please provide the entity id field",
      });
    }
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Please provide the message field",
      });
    }
    if (!mobiles || mobiles.length === 0) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Mobile no. not provided",
      });
    }
    if (!name || name.length === 0) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Name is not provided",
      });
    }

    // Log the SMS details before sending
    const logEntry = new SMSLog({
      mobiles,
      templateId,
      message,
      senderId,
      entityId,
      name,
      organization: req.user.organization,
    });
    await logEntry.save();

    // Prepare options for sending SMS
    const url = `${process.env.SEND_BULK_MSG_API}UserID=${sms_api_key}&Password=${sms_api_secret}&SenderID=${senderId}&Phno=${mobiles}&EntityID=${entityId}&TemplateID=${templateId}&Msg=${message}`;

    // Send SMS using axios
    const response = await axios.post(url, null, {
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });


    if (response.status === 200) {
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Message sent successfully",
      });
    } else {
      return res.status(500).json({
        status: 500,
        success: false,
        message: "Something went wrong while sending the SMS",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal server error",
    });
  }
};

const getBulkSms = async (req, res) => {
  try {
    const logs = await SMSLog.find({
      organization: req.user.organization,
    })
      .sort({ timestamp: -1 }) // Fetch logs sorted by timestamp
      .populate("organization"); // Populate the organization field

    res.status(200).json({
      status: 200,
      success: true,
      logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { sendBulkSms, getBulkSms };
