const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
  organization: {
    type: mongoose.Types.ObjectId,
    ref: "Organization",
    // required: [true, 'organization is a required field']
  },
  author: {
    type: mongoose.Types.ObjectId,
    ref: "Admin",
    // required: [true, "author is a required field"],
  },
  message: {
    type: String,
    // required: [true, "message is a required field"],
  },
  seen:{
    type: Boolean,
    default: false
  },
  messageType: {
    type: String,
  },

  recipient: {
    type: String,
  },
  
  sender: {
    type: String,
  },

  createdAt: {
    type: Date,
    expires: "1d",
    default: Date.now,
  },
});

const notificationModel = mongoose.model("Notification", notificationSchema);

module.exports = notificationModel;
