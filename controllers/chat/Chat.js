const { chatroomModel, onlinestatusModel } = require("../../models/chat");
const { TryCatch, ErrorHandler } = require("../../helpers/error");
const mongoose = require("mongoose");
const adminModel = require("../../models/admin");
const notificationModel = require("../../models/notification");

// const getAllAdmins = TryCatch(async (req, res) => {
//     const admins = await adminModel.find({ organization: req.user.organization, role: "Admin" });

//     res.status(200).json({
//         status: 200,
//         success: true,
//         admins: admins,
//     });
// });

const getChatGroup = TryCatch(async (req, res) => {
  const objectId = new mongoose.Types.ObjectId(req.params.id);
  const chatgroup = await chatroomModel
    .find({
      $or: [{ participants: req.params.id }, { groupAdmin: objectId }],
    })
    .populate("participants");
  res.status(200).json({
    status: 200,
    success: true,
    chatgroup,
  });
});

const createGroup = TryCatch(async (req, res) => {
  console.log("This chat group");
  const { selectedMembers, groupName, groupAdmin } = req.body;
  try {
    const chatgroup = await chatroomModel.create({
      groupName,
      groupAdmin,
      imageName: req.file ? req.file.filename : null,
      participants: selectedMembers.split(","),
    });
    res.status(200).json({
      status: 200,
      success: true,
      message: "Chat group has been created successfully",
      chatgroup: chatgroup,
    });
  } catch (error) {
    console.error("Error creating chat group:", error);
    res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to add chat group",
    });
  }
});

const getNotifications = TryCatch(async (req, res) => {
  const notifications = await notificationModel
    .find({ seen: false, recipient: req.params.userId })
    .populate("author")
    .populate("organization")
    .sort({ createdAt: -1 });
  res.status(200).json({
    status: 200,
    success: true,
    notifications: notifications,
  });
});

const getAlluser = TryCatch(async (req, res) => {
  const { userId } = req.params;
  // const admins = await adminModel.find({
  //         $and: [
  //             { _id: { $ne: new mongoose.Types.ObjectId(userId) } },
  //             { verified: true }
  //         ]
  //     });

  const admins = await adminModel.aggregate([
    {
      $match: {
        _id: { $ne: new mongoose.Types.ObjectId(userId) },
        verified: true,
      },
    },
    {
      $lookup: {
        from: "onlineusers", // collection name (plural usually)
        let: { adminIdStr: { $toString: "$_id" } },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$userid", "$$adminIdStr"] },
            },
          },
        ],
        as: "onlineInfo",
      },
    },
    {
      $addFields: {
        isOnline: {
          $cond: [
            {
              $gt: [{ $size: "$onlineInfo" }, 0],
            },
            { $eq: [{ $arrayElemAt: ["$onlineInfo.status", 0] }, "true"] },
            false,
          ],
        },
      },
    },
    {
      $project: {
        onlineInfo: 0, // clean output: remove raw joined data
      },
    },
  ]);

  res.status(200).json({
    status: 200,
    success: true,
    admins: admins,
  });
});

const changeOnlineStatus = TryCatch(async (req, res) => {
  const { userId, status } = req.body; // assuming you send status in the body
  // Update or insert online status
  await onlinestatusModel.findOneAndUpdate(
    { userid: userId },
    { $set: { status: status, userid: userId } },
    { upsert: true, new: true }
  );
  res.status(200).json({
    status: 200,
    success: true,
  });
});

const getuser = TryCatch(async (req, res) => {
  const { userId } = req.params;
  const admins = await adminModel.find({
    $and: [{ _id: new mongoose.Types.ObjectId(userId) }, { verified: true }],
  });
  res.status(200).json({
    status: 200,
    success: true,
    admins: admins,
  });
});

module.exports = {
  createGroup,
  getChatGroup,
  getAlluser,
  getNotifications,
  changeOnlineStatus,
  getuser,
};
