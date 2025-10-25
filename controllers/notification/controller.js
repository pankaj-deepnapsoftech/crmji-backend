const {TryCatch} = require('../../helpers/error');
const notificationModel = require('../../models/notification');

const getAllNotifications = TryCatch(async (req, res)=>{
    const author = req.user.id;
    const notifications = await notificationModel.find({author}).sort({'createdAt': -1});
    res.status(200).json({
        status: 200,
        success: true,
        notifications
    })
});

const getUnseenNotificationCount = TryCatch(async (req, res)=>{
    const author = req.user.id;
    const unseen = await notificationModel.find({author, seen: false}).countDocuments();
    
    res.status(200).json({
        status: 200,
        success: true,
        unseen
    })
});

const getUnseenchatNotificationCount = TryCatch(async (req, res)=>{
    const recipient = req.user.id;
    const unseen = await notificationModel.find({ recipient, seen: false}).
    countDocuments();
    res.status(200).json({
        status: 200,
        success: true,
        unseen
    })
});  


const markAsSeen = TryCatch(async (req, res)=>{
    const { notifications } = req.body;
    await Promise.all(
      notifications.map(
        async (notification) =>
          await notificationModel.findByIdAndUpdate(notification, { seen: true })
      )
    );
  
    res.status(200).json({});
});

module.exports = {
    getAllNotifications,
    getUnseenNotificationCount,
    markAsSeen,
    getUnseenchatNotificationCount
}