const express = require("express");
const {
  getAllNotifications,
  getUnseenNotificationCount,
  markAsSeen,
  getUnseenchatNotificationCount,
} = require("../../controllers/notification/controller");
const router = express.Router();

router.get("/all", getAllNotifications);
router.get("/unseen", getUnseenNotificationCount);
router.get("/unseenchat", getUnseenchatNotificationCount);
router.post("/seen", markAsSeen);

module.exports = router;
