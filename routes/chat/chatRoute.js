const express = require("express");
const {
  createGroup,
  changeOnlineStatus,
  getChatGroup,
  getAlluser,
  getNotifications,
  getuser,
} = require("../../controllers/chat/Chat");
const {
  getUnreadCounts,
  getGroupUnreadCounts,
  markAsRead,
  markGroupMessagesAsRead,
} = require("../../controllers/chat/UnreadCount");
const { checkAccess } = require("../../helpers/checkAccess");

const {
  createChatValidator,
  validateHandler,
} = require("../../validators/chat/chat");

const { chatimage } = require("../../utils/multer");
const router = express.Router();

// router.post('/createGroup', createChatValidator(), validateHandler, createGroup);

router.post("/createGroup", chatimage.single("image"), createGroup);
router.get("/fetchGroup/:id", getChatGroup);
router.get("/allNotifications/:userId", getNotifications);

router.get("/all-user/:userId", getAlluser);
router.post("/changestatus", changeOnlineStatus);

router.get("/getuser/:userId", getuser);

// Unread count routes
router.get("/unread-counts/:userId", getUnreadCounts);
router.get("/group-unread-counts/:userId", getGroupUnreadCounts);
router.post("/mark-as-read", markAsRead);
router.post("/mark-group-as-read", markGroupMessagesAsRead);

module.exports = router;
