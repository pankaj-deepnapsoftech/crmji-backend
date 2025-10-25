const mongoose = require("mongoose");

const websiteConfigurationSchema = mongoose.Schema(
  {
    organization: {
      type: mongoose.Types.ObjectId,
      ref: "Organization",
      required: [true, "organization is a required field"],
    },
    name: { type: String },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
      required: [true, "creator is a required field"],
    },
    indiamart_api: {
      type: String,
    },
    facebook_api: {
      type: String,
    },
    sms_api_key: {
      type: String
    },
    sms_api_secret: {
      type: String
    },
    sms_sender_id: {
      type: String
    },
    sms_welcome_template_id: {
      type: String
    },
    sms_dealdone_template_id: {
      type: String
    },
    sms_entity_id: {
      type: String
    },
    email_id: {
      type: String
    },
    email_password: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

// API_KEY=dryishercsbiz
// API_SECRET=nelh5638NE
// SENDER_ID=ITSYBZ
// TEMPLATE_ID=1707171836227991483
// ENTITY_ID=1001558230000012624
// SEND_SINGLE_MSG_API=http://nimbusit.biz/api/SmsApi/SendSingleApi?
// SEND_BULK_MSG_API=http://nimbusit.biz/api/SmsApi/SendBulkApi?

const websiteConfigurationModel = mongoose.model(
  "Website Configuration",
  websiteConfigurationSchema

);

module.exports = websiteConfigurationModel;
