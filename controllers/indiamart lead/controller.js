const { TryCatch } = require("../../helpers/error");
const axios = require("axios");
const indiamartLeadModel = require("../../models/indiamart_lead");
const notificationModel = require("../../models/notification");
const moment = require("moment");
const customerModel = require("../../models/customer");
const companyModel = require("../../models/company");
const peopleModel = require("../../models/people");
const adminModel = require("../../models/admin");
const websiteConfigurationModel = require("../../models/websiteConfiguration");
const { emitEvent } = require("../../helpers/socket");

const fetchData = async (url) => {
  try {
    const response = await axios.get(url);
    if (response?.data?.STATUS === "SUCCESS") {
      return response?.data?.RESPONSE;
    }
    return [];
  } catch (err) {
    console.log(err.message);
    return [];
  }
};

const fetchLast7Days = async () => {
  const websiteConfiguration = await websiteConfigurationModel.find();
  let INDIAMART_API_KEY;
  if (websiteConfiguration.length > 0) {
    INDIAMART_API_KEY = websiteConfiguration[0]?.indiamart_api;
  }

  if (!INDIAMART_API_KEY) {
    return;
  }

  const end = moment().format("DD-MMM-YYYY");
  const start = moment().subtract(7, "days").format("DD-MMM-YYYY");

  try {
    const url = `https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key=${INDIAMART_API_KEY}&start_time=${start}&end_time=${end}`;

    const leads = await fetchData(url);

    if (leads.length > 0) {
      const admin = await adminModel.findOne({ role: "Super Admin" });

      for (const lead of leads) {
        // If the lead has company name associated with it
        let companyId;
        let peopleId;
        if (lead?.SENDER_COMPANY && lead?.SENDER_COMPANY !== "") {
          const isCompanyExist = await companyModel.findOne({
            $or: [
              { email: lead?.SENDER_EMAIL },
              { phone: lead?.SENDER_MOBILE },
            ],
          });

          if (!isCompanyExist) {
            const phone = lead?.SENDER_MOBILE?.split("-")[1];
            const email = lead?.SENDER_EMAIL;
            const name = lead?.SENDER_COMPANY;
            const contact = lead?.SENDER_NAME;

            const newCompany = await companyModel.create({
              companyname: name,
              contact: contact,
              email: email,
              phone: phone,
              creator: admin._id,
            });
            companyId = newCompany._id;
          } else {
            companyId = isCompanyExist._id;
          }
        }
        // Else
        else {
          const isPeopleExist = await peopleModel.findOne({
            $or: [
              { email: lead?.SENDER_EMAIL },
              { phone: lead?.SENDER_MOBILE },
            ],
          });

          if (!isPeopleExist) {
            const phone = lead?.SENDER_MOBILE?.split("-")[1];
            const email = lead?.SENDER_EMAIL;
            const name = lead?.SENDER_NAME?.split(" ");

            const newPeople = await peopleModel.create({
              firstname: name[0],
              lastname: name.length > 1 ? name[1] : undefined,
              email: email,
              phone: phone,
              creator: admin._id,
            });
            peopleId = newPeople._id;
          } else {
            peopleId = isPeopleExist._id;
          }
        }

        await indiamartLeadModel.create({
          ...lead,
          creator: admin._id,
          company: companyId,
          people: peopleId,
        });
      }
    }
  } catch (err) {
    console.log(err.message);
  }
};

const fetchLast5Mins = async () => {
  const websiteConfiguration = await websiteConfigurationModel.find();
  let INDIAMART_API_KEY;
  if (websiteConfiguration.length > 0) {
    INDIAMART_API_KEY = websiteConfiguration[0]?.indiamart_api;
  }

  if (!INDIAMART_API_KEY) {
    return;
  }

  try {
    const url = `https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key=${INDIAMART_API_KEY}`;

    const leads = await fetchData(url);

    if (leads.length > 0) {
      const admin = await adminModel.findOne({ role: "Super Admin" });

      for (const lead of leads) {
        // If the lead has company name associated with it
        let companyId;
        let peopleId;
        if (lead?.SENDER_COMPANY && lead?.SENDER_COMPANY !== "") {
          const isCompanyExist = await companyModel.findOne({
            $or: [
              { email: lead?.SENDER_EMAIL },
              { phone: lead?.SENDER_MOBILE },
            ],
          });

          if (!isCompanyExist) {
            const phone = lead?.SENDER_MOBILE?.split("-")[1];
            const email = lead?.SENDER_EMAIL;
            const name = lead?.SENDER_COMPANY;
            const contact = lead?.SENDER_NAME;

            const newCompany = await companyModel.create({
              companyname: name,
              contact: contact,
              email: email,
              phone: phone,
              creator: admin._id,
            });
            companyId = newCompany._id;
          } else {
            companyId = isCompanyExist._id;
          }
        }
        // Else
        else {
          const isPeopleExist = await peopleModel.findOne({
            $or: [
              { email: lead?.SENDER_EMAIL },
              { phone: lead?.SENDER_MOBILE },
            ],
          });

          if (!isPeopleExist) {
            const phone = lead?.SENDER_MOBILE?.split("-")[1];
            const email = lead?.SENDER_EMAIL;
            const name = lead?.SENDER_NAME?.split(" ");

            const newPeople = await peopleModel.create({
              firstname: name[0],
              lastname: name.length > 1 ? name[1] : undefined,
              email: email,
              phone: phone,
              creator: admin._id,
            });
            peopleId = newPeople._id;
          } else {
            peopleId = isPeopleExist._id;
          }
        }

        await indiamartLeadModel.create({
          ...lead,
          creator: admin._id,
          company: companyId,
          people: peopleId,
        });
      }
    }
  } catch (err) {
    console.log(err.message);
  }
};

const allLeads = TryCatch(async (req, res) => {
  const leads = await indiamartLeadModel
    .find()
    .sort({ updatedAt: "desc" })
    .populate("assigned", "name phone email");

  res.status(200).json({
    status: 200,
    success: true,
    leads,
  });
});

const leadDetails = TryCatch(async (req, res) => {
  const { _id } = req.body;

  const lead = await indiamartLeadModel
    .findById(_id)
    .populate("assigned", "name phone email");
  if (!lead) {
    throw new Error("Lead doesn't exist", 404);
  }

  res.status(200).json({
    status: 200,
    success: true,
    lead,
  });
});

const deleteLead = TryCatch(async (req, res) => {
  const { leadId } = req.body;

  const isExistingLead = await indiamartLeadModel.findById(leadId);

  if (!isExistingLead) {
    throw new ErrorHandler("Lead doesn't exists");
  }

  // if (
  //   req.user.role !== "Super Admin" &&
  //   isExistingLead.creator.toString() !== req.user.id.toString()
  // ) {
  //   throw new Error("You are not allowed to delete this lead", 401);
  // }

  const deletedLead = await indiamartLeadModel.deleteOne({ _id: leadId });

  res.status(200).json({
    status: 200,
    success: true,
    message: "Lead has been deleted successfully",
    deletedLead: deletedLead,
  });
});

const editLead = TryCatch(async (req, res) => {
  const { leadId, status, remarks, assigned, followup_date, followup_reason } =
    req.body;

  const isExistingLead = await indiamartLeadModel.findById(leadId);
  if (!isExistingLead) {
    throw new ErrorHandler("Lead doesn't exists", 400);
  }

  if (
    (isExistingLead.status === "Follow Up" && status !== "Follow Up") ||
    (isExistingLead?.followup_date &&
      followup_date &&
      isExistingLead.followup_date !== followup_date)
  ) {
    await notificationModel.deleteOne({ lead: isExistingLead._id });
  }

  let updatedLead;

  if (status === "Assigned") {
    updatedLead = await indiamartLeadModel
      .findOneAndUpdate(
        { _id: leadId },
        {
          $unset: { followup_date: "", followup_reason: "" },
          $set: { creator: assigned, status: status, remarks, assigned },
        },
        { new: true }
      )
      .populate("company")
      .populate("people");

    const name = updatedLead?.people
      ? updatedLead?.people?.firstname +
        (updatedLead?.people?.lastname
          ? " " + updatedLead?.people?.lastname
          : "")
      : updatedLead?.company?.companyname;

    const assignedTo = await adminModel.findById(updatedLead?.assigned);
    const receivers = [{ email: assignedTo.email }];

    await notificationModel.create({
      organization: req.user.organization,
      author: assignedTo._id,
      message: `${name}'s lead has been assigned to you`,
    });

    emitEvent(
      req,
      "NEW_ASSIGNED_LEAD",
      receivers,
      `${name}'s lead has been assigned to you`
    );
  } else if (status === "Follow Up") {
    updatedLead = await indiamartLeadModel
      .findOneAndUpdate(
        { _id: leadId },
        {
          $unset: { assigned: "" },
          $set: { status: status, remarks, followup_date, followup_reason },
        },
        { new: true }
      )
      .populate("company")
      .populate("people");

    const name = updatedLead?.people
      ? updatedLead?.people?.firstname +
        (updatedLead?.people?.lastname
          ? " " + updatedLead?.people?.lastname
          : "")
      : updatedLead?.company?.companyname;

    const creator = await adminModel.findById(updatedLead?.creator);
    const receivers = [{ email: creator.email }];

    await notificationModel.create({
      organization: req.user.organization,
      author: creator._id,
      message: `You have a new lead of ${name} for follow up`,
    });

    emitEvent(
      req,
      "NEW_FOLLOWUP_LEAD",
      receivers,
      `You have a new lead of ${name} for follow up`
    );
  } else {
    updatedLead = await indiamartLeadModel.findOneAndUpdate(
      { _id: leadId },
      {
        $unset: { assigned: "", followup_date: "", followup_reason: "" },
        $set: { status: status, remarks },
      },
      { new: true }
    );
  }

  if (status === "Completed") {
    const isPeople = isExistingLead?.SENDER_COMPANY === "" ? true : false;

    // Check if there is already a customer corresponding to the people or company
    if (isExistingLead?.people) {
      const isExistingCustomer = await customerModel.findOne({
        people: isExistingLead?.people._id,
      });
      if (!isExistingCustomer) {
        await customerModel.create({
          creator: req.user.id,
          people: isExistingLead?.people._id,
          customertype: "People",
          // products: []
        });
      }
    } else {
      const isExistingCustomer = await customerModel.findOne({
        company: isExistingLead?.company._id,
      });
      if (!isExistingCustomer) {
        await customerModel.create({
          creator: req.user.id,
          company: isExistingLead?.company._id,
          customertype: "Company",
          // products: []
        });
      }
    }
  }

  return res.status(200).json({
    status: 200,
    success: true,
    message: "Lead has been updated successfully",
    updatedLead: updatedLead,
  });
});

module.exports = {
  fetchLast7Days,
  allLeads,
  leadDetails,
  editLead,
  deleteLead,
  fetchLast5Mins,
};
