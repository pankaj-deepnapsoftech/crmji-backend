const indiamartLeadModel = require("../models/indiamart_lead");
const leadModel = require("../models/lead");
const notificationModel = require("../models/notification");
const { TryCatch } = require("./error");

const createNotifications = async () => {
  try {
    const date = new Date();

    const startOfDay = new Date(
      date.toISOString().split("T")[0] + "T00:00:00.000Z"
    );
    const endOfDay = new Date(
      date.toISOString().split("T")[0] + "T23:59:59.999Z"
    );

    let leads = await leadModel
      .find({
        followup_date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      })
      .populate("company")
      .populate("people");

    let indiamartLeads = await indiamartLeadModel
      .find({
        followup_date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      })
      .populate("company")
      .populate("people");

    let followups = [...leads, ...indiamartLeads];

    const notifications = followups.map(async (lead) => {
      await notificationModel.create({
        organization: lead.organization,
        message: `You have a new lead of ${
          lead?.people
            ? lead?.people?.firstname +
              (lead?.people?.lastname ? " " + lead?.people?.lastname : "")
            : lead?.company?.companyname
        } for follow up`,
        author: lead.creator,
      });
    });

    await Promise.all(notifications);
  } catch (error) {
    // console.log(error.message);
  }
};

module.exports = createNotifications;
