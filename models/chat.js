const mongoose = require("mongoose");

const chatroomSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
    ],
    groupName: {
      type: String,
      required: true,
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    imageName: {
      type: String,
    },
  },
  { timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true },
    recipient: { type: String },
    message: { type: String },
    read: { type: Boolean, default: false },
    file: { type: String },
    fileName: { type: String },
    conversationId: { type: String },
    groupId: { type: String },
  },
  { timestamps: true }
);

const userOnlineSchema = new mongoose.Schema(
  {
    userid: { type: String },
    status: { type: String },
  },
  { timestamps: true }
);

// ✅ Prevent OverwriteModelError by reusing existing models
const chatroomModel =
  mongoose.models.chat_room || mongoose.model("chat_room", chatroomSchema);

const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);

const onlinestatusModel =
  mongoose.models.onlineuser || mongoose.model("onlineuser", userOnlineSchema);

module.exports = {
  chatroomModel,
  Message,
  onlinestatusModel,
};
