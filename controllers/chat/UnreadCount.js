const { Message } = require("../../models/chat");

// Get unread count for all one-to-one chats
exports.getUnreadCounts = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get unread counts for each sender
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          recipient: userId,
          read: false,
          groupId: { $exists: false }, // Only one-to-one messages
        },
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to object for easier lookup
    const unreadMap = {};
    unreadCounts.forEach((item) => {
      unreadMap[item._id] = item.count;
    });

    res.status(200).json({ success: true, unreadCounts: unreadMap });
  } catch (error) {
    console.error("Error fetching unread counts:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get unread count for all groups
exports.getGroupUnreadCounts = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get unread counts for each group
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          groupId: { $exists: true },
          read: false,
          sender: { $ne: userId }, // Exclude own messages
        },
      },
      {
        $group: {
          _id: "$groupId",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to object for easier lookup
    const unreadMap = {};
    unreadCounts.forEach((item) => {
      unreadMap[item._id] = item.count;
    });

    res.status(200).json({ success: true, unreadCounts: unreadMap });
  } catch (error) {
    console.error("Error fetching group unread counts:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;

    await Message.updateMany(
      {
        sender: otherUserId,
        recipient: userId,
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    res.status(200).json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark group messages as read
exports.markGroupMessagesAsRead = async (req, res) => {
  try {
    const { userId, groupId } = req.body;

    await Message.updateMany(
      {
        groupId: groupId,
        sender: { $ne: userId }, // Don't mark own messages
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    res
      .status(200)
      .json({ success: true, message: "Group messages marked as read" });
  } catch (error) {
    console.error("Error marking group messages as read:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
