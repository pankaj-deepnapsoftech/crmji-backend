const csv = require("csvtojson");
const fs = require("fs");
const { TryCatch, ErrorHandler } = require("../../helpers/error");
const peopleModel = require("../../models/people");
const companyModel = require("../../models/company");
const leadModel = require("../../models/lead");
const customerModel = require("../../models/customer");
const notificationModel = require("../../models/notification");
const mongoose = require("mongoose");
const indiamartLeadModel = require("../../models/indiamart_lead");
const { emitEvent } = require("../../helpers/socket");
const adminModel = require("../../models/admin");
const websiteConfigurationModel = require("../../models/websiteConfiguration");
const sendSms = require("../../utils/sendSms");
const { sendEmail, sendBusinessEmail } = require("../../helpers/sendEmail");
const productModel = require("../../models/product");
const { capitalizeFirstChar } = require("../../utils/capitalize");
const { parse } = require("json2csv");
const path = require("path");
const sendWhatsappTemplate = require("../../utils/sendWhatsappTemplate");
const smsTemplateModel = require("../../models/smsTemplate");
const { insertDefaultLeadStatuses } = require("../../helpers/leadStatusHelper");

const createLead = TryCatch(async (req, res) => {
  const {
    leadtype,
    status,
    source,
    peopleId,
    companyId,
    notes,
    products,
    assigned,
    followup_date,
    followup_reason,
    location,
    prc_qt,
    leadCategory,
    demoPdf,
  } = req.body;
  const demoPdfToSave = demoPdf || (req.file ? req.file.path : null);

  // ------------------ ADD THIS LINE ------------------
  // Ensure default lead statuses exist for this organization
  await insertDefaultLeadStatuses(req.user.organization);
  // ---------------------------------------------------

  const websiteCofiguration = await websiteConfigurationModel
    .findOne({ organization: req.user.organization })
    .populate("organization");


  const {
    sms_api_key,
    sms_api_secret,
    sms_sender_id,
    sms_welcome_template_id,
    sms_dealdone_template_id,
    sms_entity_id,
    email_id,
    email_password,
    organization,
  } = websiteCofiguration;

  if (leadtype === "People" && peopleId) {
    const isExistingPeople = await peopleModel.findById(peopleId);
    if (!isExistingPeople) throw new Error("Person doesn't exist", 400);

    let lead = await leadModel.create({
      creator: req.user.id,
      organization: req.user.organization,
      leadtype,
      status,
      source,
      people: peopleId,
      notes,
      products,
      assigned,
      followup_date,
      followup_reason,
      prc_qt,
      location,
      leadCategory,
      demoPdf: demoPdfToSave,
    });
    lead = await leadModel.findById(lead._id).populate("products");

    if (status === "Completed") {
      const isExistingCustomer = await customerModel.findOne({
        people: peopleId,
      });
      if (!isExistingCustomer) {
        await customerModel.create({
          organization: lead.organization,
          creator: lead.creator,
          customertype: leadtype,
          people: peopleId,
          products,
        });
      }
    } else if (status === "Follow Up") {
      const date = new Date();
      const followupDate = new Date(lead?.followup_date);
      if (
        date.getFullYear() === followupDate.getFullYear() &&
        date.getMonth() === followupDate.getMonth() &&
        date.getDate() === followupDate.getDate()
      ) {
        const creator = await adminModel.findById(lead.creator);
        const receivers = [{ email: creator.email }];
        await notificationModel.create({
          organization: req.user.organization,
          author: creator._id,
          message: `You have a new lead of ${isExistingPeople.firstname} ${
            isExistingPeople?.lastname || ""
          } for follow up`,
        });

        emitEvent(
          req,
          "NEW_FOLLOWUP_LEAD",
          receivers,
          `You have a new lead of ${isExistingPeople.firstname} ${
            isExistingPeople?.lastname || ""
          } for follow up`
        );
      }
    }

    // Assigned notification
    if (status === "Assigned") {
      const assignedTo = await adminModel.findById(lead?.assigned);
      const receivers = [{ email: assignedTo.email }];
      await notificationModel.create({
        organization: req.user.organization,
        author: assignedTo._id,
        message: `${isExistingPeople.firstname} ${
          isExistingPeople?.lastname || ""
        }'s lead has been assigned to you`,
      });

      emitEvent(
        req,
        "NEW_ASSIGNED_LEAD",
        receivers,
        `${isExistingPeople.firstname} ${
          isExistingPeople?.lastname || ""
        }'s lead has been assigned to you`
      );
    }

    // ✅ SEND SMS
    try {
      if (status === "New" && isExistingPeople?.phone) {
        const message = `Dear ${isExistingPeople.firstname}, Welcome to Itsybizz! We're thrilled to have you on board and ready to support your business journey. Let's succeed together!`;
        await sendSms(
          sms_api_key,
          sms_api_secret,
          isExistingPeople.phone,
          sms_welcome_template_id,
          sms_sender_id.trim(),
          sms_entity_id,
          message
        );
      }
      if (status === "Completed" && isExistingPeople?.phone) {
        const message = `Hi ${isExistingPeople.firstname}, your purchase of ${lead?.products[0]?.name} is confirmed! Thank you for choosing us. Feel free to reach out at +919205404075.-ITSYBIZZ`;
        await sendSms(
          sms_api_key,
          sms_api_secret,
          isExistingPeople.phone,
          sms_dealdone_template_id,
          sms_sender_id.trim(),
          sms_entity_id,
          message
        );
      }
    } catch (err) {
      console.error("SMS error (people):", err);
    }

    // ✅ SEND WHATSAPP
    try {
      if (status === "New" && isExistingPeople?.phone) {
        await sendWhatsappTemplate(
          isExistingPeople.phone,
          "welcome_template",
          "en_US",
          [{ type: "text", text: isExistingPeople.firstname }]
        );
      }
      // People lead - Completed WhatsApp
      // if (status === "Completed" && isExistingPeople?.phone) {
      //   console.log("WhatsApp Completed Lead Params:", {
      //     name: isExistingPeople.firstname,
      //     product: lead?.products[0]?.name,
      //   });

      //   await sendWhatsappTemplate(
      //     isExistingPeople.phone,
      //     "purchase_confirmation",
      //     "en_US",
      //     [
      //       { type: "text", text: isExistingPeople.firstname || "Customer" }, // {{1}}
      //       { type: "text", text: lead?.products?.[0]?.name || "your order" }, // {{2}}
      //     ]
      //   );
      // }
      // People lead - Completed WhatsApp
      if (status === "Completed" && isExistingPeople?.phone) {
        await sendWhatsappTemplate(
          isExistingPeople.phone,
          "lead_completed", // 👈 your static template
          "en_US" // 👈 correct language code
          // 🚫 no components since this template has no params
        );
      }
    } catch (err) {
      console.error(
        "WhatsApp error (people):",
        err.response?.data || err.message
      );
    }

    // ✅ SEND EMAIL
    try {
      if (status === "New" && isExistingPeople?.email) {
        const subject = ` Welcome to ${organization?.company}`;
        const message = `<p>Dear <strong>${isExistingPeople.firstname}</strong>,</p>
        <br>

          <p>Welcome to ${organization?.company}! We’re thrilled to have you on board and are excited to support you on your business journey.</p>
          <br>
          <p>Our team is dedicated to helping you succeed, and we’re here to provide the resources and assistance you need every step of the way. If you have any questions or need guidance, please don’t hesitate to reach out.</p>
          <br>
          <p>Let’s succeed together!</p>
                                        <br>
                                        <p>Best regards,</p>
                                        <p>The ${organization?.company} Team</>`;
        try {
          if (email_id && email_password && isExistingPeople?.email) {
            await sendBusinessEmail(
              isExistingPeople.email,
              subject,
              message,
              email_id,
              email_password
            );
          }
        } catch (err) {
          console.error("Failed to send lead email (people):", err);
        }
      }
      if (status === "Completed" && isExistingPeople?.email) {
        const subject = `Your Purchase with ITSYBIZZ is Confirmed!`;
        const message = `<p>Dear <strong>${isExistingPeople.firstname}</strong>,</p>
          <p>Thank you for completing your purchase of ${lead?.products[0]?.name}! We're thrilled to have you with us and are committed to providing you with the best experience.</p>
          <br>
  
                       <p>If you have any questions or need assistance, please don't hesitate to reach out at <strong>+91 92054 04075</strong> reply to this email.</p>
      <br>
                       <p>Thank you once again for choosing ${organization?.company}!</p>
      <br>
  
                       <p>Warm regards,</p>
                       <p>The ${organization?.company} Team</p>`;
        await sendBusinessEmail(
          isExistingPeople.email,
          subject,
          message,
          email_id,
          email_password
        );
      }
    } catch (err) {
      console.error("Email error (people):", err);
    }

    return res.status(200).json({
      success: true,
      message: "Lead has been created successfully",
      lead: lead,
    });
  }

  if (leadtype === "Company" && companyId) {
    const isExistingCompany = await companyModel.findById(companyId);
    if (!isExistingCompany) throw new Error("Company doesn't exist", 400);

    let lead = await leadModel.create({
      organization: req.user.organization,
      creator: req.user.id,
      leadtype,
      status,
      source,
      company: companyId,
      notes,
      followup_date,
      followup_reason,
      prc_qt,
      location,
      leadCategory,
    });
    lead = await leadModel.findById(lead._id).populate("products");

    if (status === "Completed") {
      const isExistingCustomer = await customerModel.findOne({
        company: companyId,
      });
      if (!isExistingCustomer) {
        await customerModel.create({
          organization: lead.organization,
          creator: lead.creator,
          customertype: leadtype,
          company: companyId,
          products,
        });
      }
    }

    if (status === "Follow Up") {
      const date = new Date();
      const followupDate = new Date(lead?.followup_date);
      if (
        date.getFullYear() === followupDate.getFullYear() &&
        date.getMonth() === followupDate.getMonth() &&
        date.getDate() === followupDate.getDate()
      ) {
        const creator = await adminModel.findById(lead.creator);
        const receivers = [{ email: creator.email }];
        await notificationModel.create({
          organization: req.user.organization,
          author: creator._id,
          message: `You have a new lead of ${isExistingCompany.companyname} for follow up`,
        });

        emitEvent(
          req,
          "NEW_FOLLOWUP_LEAD",
          receivers,
          `You have a new lead of ${isExistingCompany.companyname} for follow up`
        );
      }
    }

    if (status === "Assigned") {
      const assignedTo = await adminModel.findById(lead?.assigned);
      const receivers = [{ email: assignedTo.email }];
      await notificationModel.create({
        organization: req.user.organization,
        author: assignedTo._id,
        message: `${isExistingCompany.companyname}'s lead has been assigned to you`,
      });

      emitEvent(
        req,
        "NEW_ASSIGNED_LEAD",
        receivers,
        `${isExistingCompany.companyname}'s lead has been assigned to you`
      );
    }

    // ✅ SEND SMS
    try {
      if (status === "New" && isExistingCompany?.phone) {
        const message = `Dear ${isExistingCompany.companyname}, Welcome to Itsybizz! We're thrilled to have you on board and ready to support your business journey. Let's succeed together!`;
        await sendSms(
          sms_api_key,
          sms_api_secret,
          isExistingCompany.phone,
          sms_welcome_template_id,
          sms_sender_id.trim(),
          sms_entity_id,
          message
        );
      }
      if (status === "Completed" && isExistingCompany?.phone) {
        const message = `Hi ${isExistingCompany.companyname}, your purchase of ${lead?.products[0]?.name} is confirmed! Thank you for choosing us. Feel free to reach out at +919205404075.-ITSYBIZZ`;
        await sendSms(
          sms_api_key,
          sms_api_secret,
          isExistingCompany.phone,
          sms_dealdone_template_id,
          sms_sender_id.trim(),
          sms_entity_id,
          message
        );
      }
    } catch (err) {
      console.error("SMS error (company):", err);
    }

    // ✅ SEND WHATSAPP
    try {
      if (status === "New" && isExistingCompany?.phone) {
        await sendWhatsappTemplate(
          isExistingCompany.phone,
          "welcome_template",
          "en_US",
          [{ type: "text", text: isExistingCompany.companyname }]
        );
      }
      // Company lead - Completed WhatsApp
      // if (status === "Completed" && isExistingCompany?.phone) {
      //   await sendWhatsappTemplate(
      //     isExistingCompany.phone,
      //     "purchase_confirmation",
      //     "en_US",
      //     [
      //       { type: "text", text: isExistingCompany.companyname }, // {{1}}
      //       { type: "text", text: lead?.products[0]?.name || "product" }, // {{2}}
      //     ]
      //   );
      // }
      if (status === "Completed" && isExistingCompany?.phone) {
        await sendWhatsappTemplate(
          isExistingCompany.phone,
          "lead_completed",
          "en_US"
        );
      }
    } catch (err) {
      console.error(
        "WhatsApp error (company):",
        err.response?.data || err.message
      );
    }

    // ✅ SEND EMAIL
    try {
      if (status === "New" && isExistingCompany?.email) {
        const subject = ` Welcome to ${organization?.company}`;
        const message = `<p>Dear <strong>${isExistingCompany.companyname}</strong>,</p>
        <br>
          <p>Welcome to ${organization?.company}! We’re thrilled to have you on board and are excited to support you on your business journey.</p>
          <br>
                                        <p>Our team is dedicated to helping you succeed, and we’re here to provide the resources and assistance you need every step of the way. If you have any questions or need guidance, please don’t hesitate to reach out.</p>
                                        <br>
                                        <p>Let’s succeed together!</p>
                                        <br>
                                        <p>Best regards,</p>
                                        <p>The ${organization?.company} Team</p>`;
        await sendBusinessEmail(
          isExistingCompany.email,
          subject,
          message,
          email_id,
          email_password
        );
      }
      if (status === "Completed" && isExistingCompany?.email) {
        const subject = `Your Purchase with ITSYBIZZ is Confirmed!`;
        const message = `<p>Dear <strong>${isExistingCompany.companyname}</strong>,</p>
        <br>
          <p>Thank you for completing your purchase of ${lead?.products[0]?.name}! We're thrilled to have you with us and are committed to providing you with the best experience.</p>
          <br>
  
                       <p>If you have any questions or need assistance, please don't hesitate to reach out at <strong>+91 92054 04075</strong> reply to this email.</p>
      <br>
                       <p>Thank you once again for choosing ${organization?.company}!</p>
      <br>
  
                       <p>Warm regards,</p>
                       <p>The ${organization?.company} Team</p>`;
        await sendBusinessEmail(
          isExistingCompany.email,
          subject,
          message,
          email_id,
          email_password
        );
      }
    } catch (err) {
      console.error("Email error (company):", err);
    }

    return res.status(200).json({
      success: true,
      message: "Lead has been created successfully",
      lead,
    });
  }

  throw new ErrorHandler("Lead type must be Individual or Corporate");
});

const editLead = TryCatch(async (req, res) => {
  // const { leadId, leadtype, status, source, peopleId, companyId, notes } =
  //   req.body;
  const {
    leadId,
    status,
    source,
    notes,
    products,
    assigned,
    followup_date,
    followup_reason,
    prc_qt,
    location,
    leadCategory,
  } = req.body;

  const isExistingLead = await leadModel
    .findById(leadId)
    .populate("people")
    .populate("company")
    .populate("products");
  if (!isExistingLead) {
    throw new ErrorHandler("Lead doesn't exists", 400);
  }

  if (
    req.user.role !== "Super Admin" &&
    isExistingLead.creator.toString() !== req.user.id.toString() &&
    isExistingLead?.assigned?._id?.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to edit this lead", 401);
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
    updatedLead = await leadModel
      .findOneAndUpdate(
        { _id: leadId },
        {
          $unset: { followup_date: "", followup_reason: "" },
          $set: {
            creator: req.user.id,
            status: status,
            assigned,
            notes,
            source,
            prc_qt,
            location,
            leadCategory,
          },
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
  } else if (
    status === "Follow Up" &&
    followup_date &&
    followup_reason
    // new Date(followup_date).toLocaleDateString() ===
    //   new Date().toLocaleDateString()
  ) {
    updatedLead = await leadModel
      .findOneAndUpdate(
        { _id: leadId },
        {
          $set: {
            status: status,
            followup_date,
            followup_reason,
            assigned,
            notes,
            source,
            prc_qt,
            location,
            leadCategory,
          },
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

    if (
      new Date(followup_date).toLocaleDateString() ===
      new Date().toLocaleDateString()
    ) {
      emitEvent(
        req,
        "NEW_FOLLOWUP_LEAD",
        receivers,
        `You have a new lead of ${name} for follow up`
      );
    }
  } else {
    updatedLead = await leadModel.findOneAndUpdate(
      { _id: leadId },
      {
        $unset: { followup_date: "", followup_reason: "" },
        $set: {
          status: status,
          source,
          notes,
          prc_qt,
          location,
          leadCategory,
          assigned,
        },
      },
      { new: true }
    );
  }

  if (status === "Completed") {
    let isExistingCustomer;
    if (isExistingLead?.people) {
      isExistingCustomer = await customerModel.findOne({
        people: isExistingLead.people,
      });
    }
    if (isExistingLead?.company) {
      isExistingCustomer = await customerModel.findOne({
        company: isExistingLead.company,
      });
    }

    if (!isExistingCustomer) {
      if (isExistingLead?.people) {
        await customerModel.create({
          organization: isExistingLead.organization,
          creator: isExistingLead.creator,
          customertype: isExistingLead.leadtype,
          people: isExistingLead.people,
          products,
        });
      } else {
        await customerModel.create({
          organization: isExistingLead.organization,
          creator: isExistingLead.creator,
          customertype: isExistingLead.leadtype,
          company: isExistingLead.company,
          products,
        });
      }
    }
  }

  const websiteCofiguration = await websiteConfigurationModel
    .findOne({
      organization: req.user.organization,
    })
    .populate("organization");
  const {
    sms_api_key,
    sms_api_secret,
    sms_sender_id,
    sms_welcome_template_id,
    sms_dealdone_template_id,
    sms_entity_id,
    email_id,
    email_password,
    organization,
  } = websiteCofiguration;

  // SEND SMS
  if (
    status === "New" &&
    sms_api_key &&
    sms_api_secret &&
    sms_sender_id &&
    sms_welcome_template_id &&
    sms_entity_id &&
    (isExistingLead?.people?.phone || isExistingLead?.company?.phone)
  ) {
    const message = `Dear ${
      isExistingLead?.people?.firstname || isExistingLead?.company?.companyname
    }, Welcome to Itsybizz! We're thrilled to have you on board and ready to support your business journey. Let's succeed together!`;

    await sendSms(
      sms_api_key,
      sms_api_secret,
      isExistingLead?.people?.phone || isExistingLead?.company?.phone,
      sms_welcome_template_id,
      sms_sender_id,
      sms_entity_id,
      message
    );
  } else if (
    status === "Completed" &&
    sms_api_key &&
    sms_api_secret &&
    sms_sender_id &&
    sms_dealdone_template_id &&
    sms_entity_id &&
    (isExistingLead?.people?.phone || isExistingLead?.company?.phone)
  ) {
    const message = `Hi ${
      isExistingLead?.people?.firstname || isExistingLead?.company?.companyname
    }, your purchase of ${
      isExistingLead?.products[0]?.name
    } is confirmed! Thank you for choosing us. Feel free to reach out at +919205404075.-ITSYBIZZ`;
    await sendSms(
      sms_api_key,
      sms_api_secret,
      isExistingLead?.people?.phone || isExistingLead?.company?.phone,
      sms_dealdone_template_id,
      sms_sender_id,
      sms_entity_id,
      message
    );
  }

  // SEND EMAIL
  if (
    status === "New" &&
    email_id &&
    email_password &&
    (isExistingLead?.people?.email || isExistingLead?.company?.email)
  ) {
    const subject = ` Welcome to ${organization?.company}`;
    const message = `<p>Dear <strong>${
      isExistingLead?.people?.firstname || isExistingLead?.company?.companyname
    }</strong>,</p>
    <br>
    <p>Welcome to ${
      organization?.company
    }! We’re thrilled to have you on board and are excited to support you on your business journey</p>
                     <br>
                     <p>Our team is dedicated to helping you succeed, and we’re here to provide the resources and assistance you need every step of the way. If you have any questions or need guidance, please don’t hesitate to reach out.</p>
                     <br>
                     <p>Let’s succeed together!</p>
                     <br>
                     <p>Best regards,</p>
                     <p>The ${organization?.company} Team</>`;

    sendBusinessEmail(
      isExistingLead?.people?.email || isExistingLead?.company?.email,
      subject,
      message,
      email_id,
      email_password
    );
  } else if (
    status === "Completed" &&
    email_id &&
    email_password &&
    (isExistingLead?.people?.email || isExistingLead?.company?.email)
  ) {
    const subject = `Your Purchase with ITSYBIZZ is Confirmed!`;
    const message = `<p>Dear <strong>${
      isExistingLead?.people?.firstname || isExistingLead?.company?.companyname
    }</strong>,</p>
    <br>
                     <p>Thank you for completing your purchase of ${
                       isExistingLead?.products[0]?.name
                     }! We're thrilled to have you with us and are committed to providing you with the best experience.</p>
    <br>

                     <p>If you have any questions or need assistance, please don't hesitate to reach out at <strong>+91 92054 04075</strong> reply to this email.</p>
    <br>
                     <p>Thank you once again for choosing ${
                       organization?.company
                     }!</p>
    <br>

                     <p>Warm regards,</p>
                     <p>The ${organization?.company} Team</p>`;
    sendBusinessEmail(
      isExistingLead?.people?.email || isExistingLead?.company?.email,
      subject,
      message,
      email_id,
      email_password
    );
  }
  // inside editLead, after sending SMS + Email for Completed
  if (
    status === "Completed" &&
    (isExistingLead?.people?.phone || isExistingLead?.company?.phone)
  ) {
    try {
      await sendWhatsappTemplate(
        isExistingLead?.people?.phone || isExistingLead?.company?.phone,
        "lead_completed", // your static template with no params
        "en_US"
      );
    } catch (err) {
      console.error(
        "WhatsApp error (editLead):",
        err.response?.data || err.message
      );
    }
  }

  return res.status(200).json({
    status: 200,
    success: true,
    message: "Lead has been updated successfully",
    updatedLead: updatedLead,
  });
});

const bulkAssign = TryCatch(async (req, res) => {
  const { leads, assignedTo } = req.body;

  if (!leads || !assignedTo) {
    throw new Error("Please provide all the fields", 400);
  }
  if (leads?.length === 0) {
    throw new Error("Select atleast 1 lead", 400);
  }

  await leadModel.updateMany(
    { _id: leads },
    { status: "Assigned", assigned: assignedTo },
    { new: true }
  );

  const assigned = await adminModel.findById(assignedTo);
  const receivers = [{ email: assigned?.email }];

  await notificationModel.create({
    organization: req.user.organization,
    author: assigned?._id,
    message: `Leads have been assigned to you`,
  });

  emitEvent(
    req,
    "NEW_ASSIGNED_LEAD",
    receivers,
    `Leads have been assigned to you`
  );

  res.status(200).json({
    success: true,
    status: 200,
    message: "Assigned successfully",
  });
});

const deleteLead = TryCatch(async (req, res) => {
  const { leadId } = req.body;

  const isExistingLead = await leadModel.findById(leadId);

  if (!isExistingLead) {
    throw new ErrorHandler("Lead doesn't exists");
  }

  if (
    req.user.role !== "Super Admin" &&
    isExistingLead.creator.toString() !== req.user.id.toString()
  ) {
    throw new Error("You are not allowed to delete this lead", 401);
  }

  const deletedLead = await leadModel.deleteOne({ _id: leadId });

  res.status(200).json({
    status: 200,
    success: true,
    message: "Lead has been deleted successfully",
    deletedLead: deletedLead,
  });
});

const deleteAllLead = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    throw new Error("You are not allowed to delete all leads", 401);
  }

  await leadModel.deleteMany();

  res.status(200).json({
    status: 200,
    success: true,
    message: "Leads have been deleted successfully",
  });
});

const leadDetails = TryCatch(async (req, res) => {
  const { leadId } = req.body;
  const lead = await leadModel
    .findById(leadId)
    .populate("people", "firstname lastname email phone")
    .populate("company", "companyname email phone")
    .populate("assigned", "name phone email")
    .populate("comments.createdBy", "firstname lastname")
    .populate({
      path: "products",
      populate: [
        { path: "category", model: "Product Category", select: "categoryname" },
      ],
    });

  if (!lead) {
    throw new ErrorHandler("Lead doesn't exists", 400);
  }

  res.status(200).json({
    status: 200,
    success: true,
    lead: lead,
  });
});

const allLeads = TryCatch(async (req, res) => {
  const { page = 1 } = req.body;
  // const totalLeadsPerPage = 10;
  // const skip = (page-1)*totalLeadsPerPage;

  let leads = [];
  if (req.user.role === "Super Admin") {
    // console.log(req.user.organization);
    leads = await leadModel
      .find({ organization: req.user.organization })
      .sort({ createdAt: -1 })
      .populate("people", "-_id firstname lastname email phone")
      .populate("company", "-_id companyname email phone")
      .populate("assigned", "name")
      .populate("creator", "name");
  } else {
    leads = await leadModel
      .find({ organization: req.user.organization, creator: req.user.id })
      .sort({ createdAt: -1 })
      .populate("people", "-_id firstname lastname email phone")
      .populate("company", "-_id companyname email phone")
      .populate("assigned", "name")
      .populate("creator", "name");
  }
  // console.log(leads)
  const results = leads.map((lead) => {
    // .filter((lead) => lead.status === "active")
    return {
      _id: lead._id,
      name:
        lead.people !== undefined
          ? lead?.people?.firstname + " " + (lead?.people?.lastname || "")
          : lead?.company?.companyname,
      status: lead.status,
      email:
        lead.people !== undefined ? lead?.people?.email : lead?.company?.email,
      phone:
        lead.people !== undefined ? lead?.people?.phone : lead?.company?.phone,
      source: lead.source,
      leadtype: lead.leadtype,
      assigned: lead?.assigned?.name,
      followup_date: lead?.followup_date,
      followup_reason: lead?.followup_reason,
      creator: lead?.creator?.name,
      createdAt: lead?.createdAt,
      location: lead?.location,
      prc_qt: lead?.prc_qt,
      leadCategory: lead?.leadCategory,
      dataBank: lead?.dataBank,
      demoPdf: lead?.demoPdf,
      meeting: lead?.meeting,
    };
  });

  // Fetch archived Individuals (People) with status 'Not Interested'
  let archivedPeople = [];
  if (req.user.role === "Super Admin") {
    archivedPeople = await peopleModel
      .find({
        organization: req.user.organization,
        isArchived: true,
        status: "Not Interested",
      })
      .sort({ createdAt: -1 })
      .populate("creator", "name");
  } else {
    archivedPeople = await peopleModel
      .find({
        organization: req.user.organization,
        creator: req.user.id,
        isArchived: true,
        status: "Not Interested",
      })
      .sort({ createdAt: -1 })
      .populate("creator", "name");
  }

  const archivedIndividuals = archivedPeople.map((p) => ({
    _id: p._id,
    name: `${p.firstname}${p.lastname ? " " + p.lastname : ""}`,
    status: p.status,
    email: p.email,
    phone: p.phone,
    leadtype: "People",
    creator: p.creator?.name,
    createdAt: p.createdAt,
    dataBank: false,
  }));

  // Fetch archived Companies with status 'Not Interested'
  let archivedCos = [];
  if (req.user.role === "Super Admin") {
    archivedCos = await companyModel
      .find({
        organization: req.user.organization,
        isArchived: true,
        status: "Not Interested",
      })
      .sort({ createdAt: -1 })
      .populate("creator", "name");
  } else {
    archivedCos = await companyModel
      .find({
        organization: req.user.organization,
        creator: req.user.id,
        isArchived: true,
        status: "Not Interested",
      })
      .sort({ createdAt: -1 })
      .populate("creator", "name");
  }

  const archivedCompanies = archivedCos.map((c) => ({
    _id: c._id,
    name: c.companyname,
    status: c.status,
    email: c.email,
    phone: c.phone,
    leadtype: "Company",
    creator: c.creator?.name,
    createdAt: c.createdAt,
    dataBank: false,
  }));

  res.status(200).json({
    status: 200,
    success: true,
    leads: results,
    archivedIndividuals,
    archivedCompanies,
  });
});

const assignedLeads = TryCatch(async (req, res) => {
  const user = req.user.id;

  const leads = await leadModel
    .find({
      organization: req.user.organization,
      assigned: { $exists: true, $ne: null },
      $or: [{ creator: user }, { assigned: user }],
    })
    .sort({ createdAt: -1 })
    .populate("people", "-_id firstname lastname email phone")
    .populate("company", "-_id companyname email phone")
    .populate("assigned", "name")
    .populate("creator", "name");

  // console.log(leads);
  // console.log(req.user.organization);
  // console.log(user)

  const indiamartLeads = await indiamartLeadModel
    .find({
      organization: req.user.organization,
      assigned: { $exists: true, $ne: null },
      assigned: user,
    })
    .sort({ createdAt: -1 })
    .populate("assigned", "name");

  const results = leads.map((lead) => {
    return {
      _id: lead._id,
      name:
        lead.people !== undefined
          ? lead.people.firstname + " " + (lead?.people?.lastname || "")
          : lead.company.companyname,
      status: lead.status,
      email:
        lead.people !== undefined ? lead?.people.email : lead?.company?.email,
      phone:
        lead.people !== undefined ? lead?.people?.phone : lead?.company?.phone,
      source: lead.source,
      leadtype: lead.leadtype,
      assigned: lead?.assigned?.name,
      followup_date: lead?.followup_date,
      followup_reason: lead?.followup_reason,
      creator: lead?.creator?.name,
      createdAt: lead?.createdAt,
      location: lead?.location,
      prc_qt: lead?.prc_qt,
    };
  });

  results.push(
    ...indiamartLeads.map((lead) => {
      return {
        _id: lead._id,
        name: lead?.SENDER_NAME,
        status: lead?.status,
        email: lead?.SENDER_EMAIL || lead?.SENDER_EMAIL_ALT,
        phone: lead?.SENDER_MOBILE || lead?.SENDER_MOBILE_ALT,
        source: "Indiamart",
        leadtype: "Indiamart",
        assigned: lead?.assigned?.name,
        followup_date: lead?.followup_date,
        followup_reason: lead?.followup_reason,
        creator: "Indiamart",
        createdAt: lead?.QUERY_TIME,
      };
    })
  );

  res.status(200).json({
    status: 200,
    success: true,
    leads: results,
  });
});

// const followupReminders = TryCatch(async (req, res) => {
//   const user = req.user.id;
//   const date = new Date();

//   const leadsForFollowUp = await leadModel
//     .find({
//       organization: req.user.organization,
//       $or: [{ creator: user }, { assigned: user }],
//       status: "Follow Up",
//     })
//     .populate("people", "firstname lastname")
//     .populate("company", "companyname");

//   const indiamartleadsForFollowUp = await indiamartLeadModel
//     .find({
//       organization: req.user.organization,
//       $or: [{ creator: user }, { assigned: user }],
//       status: "Follow Up",
//     })
//     .populate("people", "firstname lastname")
//     .populate("company", "companyname");

//   let notifications = await Promise.all(
//     leadsForFollowUp.map(async (lead) => {
//       const followupDate = new Date(lead?.followup_date);
//       if (
//         date.getFullYear() === followupDate.getFullYear() &&
//         date.getMonth() === followupDate.getMonth() &&
//         date.getDate() === followupDate.getDate()
//       ) {
//         const doesNotificationExists = await notificationModel.findOne({
//           lead: lead._id,
//         });

//         if (doesNotificationExists) {
//           return doesNotificationExists;
//         }

//         let customerName = lead?.people
//           ? lead.people.firstname + " " + (lead.people.lastname || "")
//           : lead.company.companyname;

//         return await notificationModel.create({
//           lead: lead._id,
//           leadtype: "CRM",
//           message: `${customerName} had asked you for follow-up today`,
//         });
//       }

//       return null;
//     })
//   );
//   notifications.push(
//     ...(await Promise.all(
//       indiamartleadsForFollowUp.map(async (lead) => {
//         const followupDate = new Date(lead?.followup_date);
//         if (
//           date.getFullYear() === followupDate.getFullYear() &&
//           date.getMonth() === followupDate.getMonth() &&
//           date.getDate() === followupDate.getDate()
//         ) {
//           const doesNotificationExists = await notificationModel.findOne({
//             lead: lead._id,
//           });

//           if (doesNotificationExists) {
//             return doesNotificationExists;
//           }

//           let customerName = lead?.people
//             ? lead.people.firstname + " " + (lead.people.lastname || "")
//             : lead.company.companyname;

//           return await notificationModel.create({
//             lead: lead._id,
//             leadtype: "Indiamart",
//             message: `${customerName} had asked you for follow-up today`,
//           });
//         }

//         return null;
//       })
//     ))
//   );

//   notifications = notifications.filter((notification) => notification !== null);

//   res.status(200).json({
//     status: 200,
//     success: true,
//     notifications,
//   });
// });

// const getUnseenNotfications = TryCatch(async (req, res) => {
//   const user = req.user.id;
//   const date = new Date();

//   const startOfDay = new Date(
//     date.toISOString().split("T")[0] + "T00:00:00.000Z"
//   );
//   const endOfDay = new Date(
//     date.toISOString().split("T")[0] + "T23:59:59.999Z"
//   );

//   const leadsForFollowUp = await leadModel.find({
//     organization: req.user.organization,
//     $or: [{ creator: user }, { assigned: user }],
//     status: "Follow Up",
//     followup_date: {
//       $gte: startOfDay,
//       $lt: endOfDay,
//     },
//   });
//   const indiamartleadsForFollowUp = await indiamartLeadModel.find({
//     organization: req.user.organization,
//     creator: user,
//     status: "Follow Up",
//     followup_date: {
//       $gte: startOfDay,
//       $lt: endOfDay,
//     },
//   });

//   const leadIds = [...leadsForFollowUp, ...indiamartleadsForFollowUp].map(
//     (lead) => lead._id
//   );

//   const unseenNotificationsCount = await notificationModel.countDocuments({
//     organization: req.user.organization,
//     lead: { $in: leadIds },
//     seen: false,
//   });

//   res.status(200).json({
//     status: 200,
//     success: true,
//     unseenNotifications: unseenNotificationsCount,
//   });
// });

// const seenFollowupReminders = TryCatch(async (req, res) => {
//   const { notifications } = req.body;

//   await Promise.all(
//     notifications.map(
//       async (notification) =>
//         await notificationModel.findByIdAndUpdate(notification, { seen: true })
//     )
//   );

//   res.status(200).json({});
// });

const leadSummary = TryCatch(async (req, res) => {
  const user = new mongoose.Types.ObjectId(req.user.id);
  const organization = new mongoose.Types.ObjectId(req.user.organization);

  let leads;

  if (req.user.role === "Super Admin") {
    leads = await leadModel.aggregate([
      { $match: { organization: organization } },
      {
        $facet: {
          totalCount: [
            {
              $group: {
                _id: null,
                count: {
                  $sum: 1,
                },
              },
            },
          ],
          statusCount: [
            {
              $group: {
                _id: "$status",
                count: {
                  $sum: 1,
                },
              },
            },
            {
              $project: {
                _id: 0,
                k: "$_id",
                v: "$count",
              },
            },
          ],
        },
      },
      {
        $project: {
          totalCount: { $arrayElemAt: ["$totalCount.count", 0] },
          statusCount: {
            $arrayToObject: "$statusCount",
          },
        },
      },
    ]);
  } else {
    leads = await leadModel.aggregate([
      { $match: { organization: organization, creator: user } },
      {
        $facet: {
          totalCount: [{ $group: { _id: null, count: { $sum: 1 } } }],
          statusCount: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { _id: 0, k: "$_id", v: "$count" } },
          ],
        },
      },
      {
        $project: {
          totalCount: { $arrayElemAt: ["$totalCount.count", 0] },
          statusCount: { $arrayToObject: "$statusCount" },
        },
      },
    ]);
  }

  res.status(200).json({
    status: 200,
    success: true,
    leads,
  });
});

const bulkUpload = async (req, res) => {
  csv()
    .fromFile(req.file.path)
    .then(async (response) => {
      // Remove the CSV file
      fs.unlink(req.file.path, () => {});

      await checkDataValidity(response);

      const customerPromise = response.map(async (data) => {
        if (data?.phone && data?.product) {
          if (data?.type?.toLowerCase() === "individual") {
            let isExistingPeople = await peopleModel.findOne({
              phone: data?.phone,
            });
            if (!isExistingPeople && data?.name && data?.phone) {
              const name = data?.name?.split(" ");
              isExistingPeople = await peopleModel.create({
                creator: req.user.id,
                organization: req.user.organization,
                firstname: name[0],
                lastname: name?.length > 1 ? name[1] : undefined,
                email: data?.email,
                phone: data?.phone,
              });
            }
            if (isExistingPeople) {
              const product = await productModel.findOne({
                name: data?.product,
              });
              return {
                creator: new mongoose.Types.ObjectId(req.user.id),
                organization: req.user.organization,
                leadtype: "People",
                status: data?.status,
                source: data?.source,
                followup_date:
                  data?.status === "Follow Up"
                    ? data?.followup_date
                    : undefined,
                followup_reason:
                  data?.status === "Follow Up"
                    ? data?.followup_reason
                    : undefined,
                people: isExistingPeople._id,
                products: product ? [product?._id] : null,
                remarks: data?.remarks,
                phone: data?.phone,
                email: data?.email,
                name: isExistingPeople?.firstname,
                productname: product?.name,
                leadCategory: data?.leadCategory,
              };
            }
          } else if (data?.type?.toLowerCase() === "corporate") {
            let isExistingCompany = await companyModel.findOne({
              phone: data?.phone,
            });
            if (!isExistingCompany && data?.companyname && data?.phone) {
              isExistingCompany = await companyModel.create({
                creator: req.user.id,
                organization: req.user.organization,
                companyname: data?.companyname,
                email: data?.email,
                phone: data?.phone,
                contact: data?.contact,
                website: data?.website,
                leadCategory: data?.leadCategory,
              });
            }
            if (isExistingCompany) {
              const product = await productModel.findOne({
                name: data?.product,
              });
              return {
                creator: new mongoose.Types.ObjectId(req.user.id),
                organization: req.user.organization,
                leadtype: "Company",
                status: data?.status,
                source: data?.source,
                followup_date:
                  data?.status === "Follow Up"
                    ? data?.followup_date
                    : undefined,
                followup_reason:
                  data?.status === "Follow Up"
                    ? data?.followup_reason
                    : undefined,
                company: isExistingCompany._id,
                products: product ? [product?._id] : null,
                remarks: data?.remarks,
                phone: data?.phone,
                email: data?.email,
                name: isExistingCompany?.companyname,
                productname: product?.name,
                leadCategory: data?.leadCategory,
              };
            }
          }
        } else {
          throw new Error("phone and product is a required field");
        }
      });

      // Wait for all promises to resolve or reject
      const customers = await Promise.all(customerPromise);

      // Filter out any undefined entries that may have resulted from unfulfilled promises
      const validCustomers = customers.filter(
        (customer) => customer !== undefined && customer.products !== null
      );

      const websiteCofiguration = await websiteConfigurationModel
        .findOne({
          organization: req.user.organization,
        })
        .populate("organization");
      const {
        sms_api_key,
        sms_api_secret,
        sms_sender_id,
        sms_welcome_template_id,
        sms_dealdone_template_id,
        sms_entity_id,
        email_id,
        email_password,
        organization,
      } = websiteCofiguration;

      for (customer of validCustomers) {
        // SEND SMS
        if (
          customer?.status === "New" &&
          sms_api_key &&
          sms_api_secret &&
          sms_sender_id &&
          sms_welcome_template_id &&
          sms_entity_id &&
          customer?.phone
        ) {
          const message = `Dear ${customer?.name}, Welcome to Itsybizz! We're thrilled to have you on board and ready to support your business journey. Let's succeed together!`;
          sendSms(
            sms_api_key,
            sms_api_secret,
            customer?.phone,
            sms_welcome_template_id,
            sms_sender_id,
            sms_entity_id,
            message
          );
        } else if (
          customer?.status === "Completed" &&
          sms_api_key &&
          sms_api_secret &&
          sms_sender_id &&
          sms_dealdone_template_id &&
          sms_entity_id &&
          customer?.phone
        ) {
          const message = `Hi ${customer?.name}, your purchase of ${customer?.productname} is confirmed! Thank you for choosing us. Feel free to reach out at +919205404075.-ITSYBIZZ`;
          sendSms(
            sms_api_key,
            sms_api_secret,
            customer?.phone,
            sms_dealdone_template_id,
            sms_sender_id,
            sms_entity_id,
            message
          );
        }

        // SEND EMAIL
        if (
          customer?.status === "New" &&
          email_id &&
          email_password &&
          customer?.email
        ) {
          const subject = ` Welcome to ${organization?.company}`;
          const message = `<p>Dear <strong>${customer?.name}</strong>,</p>
                        <br>
                        <p>Welcome to ${organization?.company}! We’re thrilled to have you on board and are excited to support you on your business journey</p>
                                        <br>
                                        <p>Our team is dedicated to helping you succeed, and we’re here to provide the resources and assistance you need every step of the way. If you have any questions or need guidance, please don’t hesitate to reach out.</p>
                                        <br>
                                        <p>Let’s succeed together!</p>
                                        <br>
                                        <p>Best regards,</p>
                                        <p>The ${organization?.company} Team</>`;

          sendBusinessEmail(
            customer?.email,
            subject,
            message,
            email_id,
            email_password
          );
        } else if (
          customer?.status === "Completed" &&
          email_id &&
          email_password &&
          customer?.email
        ) {
          const subject = `Your Purchase with ITSYBIZZ is Confirmed!`;
          const message = `<p>Dear <strong>${customer?.status}</strong>,</p>
      <br>
                       <p>Thank you for completing your purchase of ${customer?.productname}! We're thrilled to have you with us and are committed to providing you with the best experience.</p>
      <br>

                       <p>If you have any questions or need assistance, please don't hesitate to reach out at <strong>+91 92054 04075</strong> reply to this email.</p>
      <br>
                       <p>Thank you once again for choosing ${organization?.company}!</p>
      <br>

                       <p>Warm regards,</p>
                       <p>The ${organization?.company} Team</p>`;

          sendBusinessEmail(
            customer?.email,
            subject,
            message,
            email_id,
            email_password
          );
        }

        customer.phone = undefined;
        customer.email = undefined;
        customer.name = undefined;
        customer.productname = undefined;
      }

      // Create Bulk Leads
      await leadModel.insertMany(validCustomers);

      return res.status(400).json({
        status: 200,
        success: true,
        message: "Data uploaded successfully",
      });
    })
    .catch((error) => {
      // console.log(error);
      return res.status(400).json({
        status: 400,
        success: false,
        message: error?.message,
      });
    });

  // res.status(200).json({
  //   status: 200,
  //   success: true,
  //   message: "Data uploaded successfully",
  // });
};

const bulkDownload = TryCatch(async (req, res) => {
  const leads = await leadModel
    .find()
    .select("-_id -products -__v -assigned")
    .populate("organization", "company")
    .populate("creator", "name email phone")
    .populate("people", "firstname lastname email phone")
    .populate("company", "companyname email phone")
    .lean();

  let processedLeads = leads.map((lead) => {
    return {
      organization: lead.organization.company || "N/A",
      leadtype: lead.leadtype || "N/A",
      status: lead?.status || "N/A",
      source: lead?.source || "N/A",
      customer: lead?.people
        ? lead?.people?.firstname + " " + (lead?.people?.lastname || "")
        : "N/A",
      notes: lead?.notes || "N/A",
      location: lead?.location || "N/A",
      createdAt: new Date(lead?.createdAt).toLocaleDateString(),
      updatedAt: new Date(lead?.updatedAt).toLocaleDateString(),
      creator_name: lead?.creator?.name || "N/A",
      creator_email: lead?.creator?.email || "N/A",
      contact_person_email: lead?.people?.email || "N/A",
      contact_no: lead?.people?.phone || "N/A",
      company_name: lead?.company?.companyname || "N/A",
      company_email: lead?.company?.email || "N/A",
      company_phone: lead?.company?.phone || "N/A",
      lead_category: lead?.leadCategory || "N/A",
      followup_reason: lead?.followup_reason || "N/A",
      followup_date: lead.followup_date
        ? new Date(lead.followup_date).toLocaleDateString()
        : undefined,
    };
  });

  const csv = parse(processedLeads);

  // Set headers for CSV download
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",

    `attachment; filename="Leads-${Date.now()}.csv"`
  );
  res.status(200).send(csv);
});

const checkDataValidity = async (data) => {
  for (item of data) {
    // If the name or companyname is present, or if both are present
    if (
      (!item?.name && !item?.companyname) ||
      (!item?.name && !item?.companyname)
    ) {
      throw new Error("name/companyname anyone field is required!");
    }
    // If the status value is valid
    const validStatusValues = [
      "Meeting Scheduled",
      "Meeting Completed",
      "In Negotiation",
      "Deal on Hold",
      "Deal Won",
      "Deal Lost",
    ];
    if (item?.status) {
      let status = item?.status?.split(" ");
      item.status =
        capitalizeFirstChar(status[0]) +
        (status.length > 1 ? " " + capitalizeFirstChar(status[1]) : "");

      if (item?.status?.toLowerCase() === "assigned") {
        throw new Error(
          `Assigned status cannot be applied during bulk upload for record named ${
            item?.name || item?.companyname
          }`
        );
      }

      if (!validStatusValues.includes(item?.status)) {
        throw new Error(
          `Invalid status value found for record named ${
            item?.name || item?.companyname
          }: ${item?.status}`
        );
      }
    } else {
      throw new Error(
        `Status value is missing for record named ${
          item?.name || item?.companyname
        }`
      );
    }

    // Is the source valid
    const validSourceValues = [
      "Linkedin",
      "Social Media",
      "Website",
      "Advertising",
      "Friend",
      "Professionals Network",
      "Customer Referral",
      "Sales",
    ];
    if (item?.source) {
      let source = item?.source?.split(" ");
      item.source =
        capitalizeFirstChar(source[0]) +
        (source.length > 1 ? " " + capitalizeFirstChar(source[1]) : "");
      if (!validSourceValues.includes(item?.source)) {
        throw new Error(
          `Invalid source value found for record named ${
            item?.name || item?.companyname
          }: ${item?.source}`
        );
      }
    } else {
      throw new Error(
        `Source value is missing for record named ${
          item?.name || item?.companyname
        }`
      );
    }

    // Is the lead type is valid
    if (!item?.type) {
      throw new Error(
        `type is missing for record named ${item?.name || item?.companyname}`
      );
    } else if (
      item?.type &&
      item?.type?.toLowerCase() !== "individual" &&
      item?.type?.toLowerCase() !== "corporate"
    ) {
      throw new Error(
        `Invalid type value for record named ${
          item?.name || item?.companyname
        }: ${item?.type}`
      );
    }

    // If the status is followup then followup date and reason should be there
    if (item?.status?.toLowerCase() === "follow up") {
      if (!item?.followup_date || !item?.followup_reason) {
        throw new Error(
          `followup_date and followup_reason should be present if the status is Follow Up for record named ${
            item?.name || item?.companyname
          }`
        );
      } else if (!isValidDate(item?.followup_date)) {
        throw new Error(
          `followup_date is not valid for record named ${
            item?.name || item?.companyname
          }`
        );
      }
    }

    // If phone and email is not present and valid
    if (!item?.email) {
      throw new Error(
        `email value is missing for record named ${
          item?.name || item?.companyname
        }`
      );
    }
    if (!item?.phone) {
      throw new Error(
        `phone value is missing for record named ${
          item?.name || item?.companyname
        }`
      );
    } else if (item?.phone?.length > 10 || item?.phone?.length < 10) {
      throw new Error(
        `phone field should be 10 digits long for record named ${
          item?.name || item?.companyname
        }: ${item?.phone}`
      );
    }

    // If the product is present and valid
    const products = await productModel.find();
    const productsName = products.map((product) => product.name);
    if (!item?.product) {
      throw new Error(
        `product value missing for record named ${
          item?.name || item?.companyname
        }`
      );
    } else {
      if (!productsName?.includes(item?.product)) {
        throw new Error(
          `Invalid product name found for record named ${
            item?.name || item?.companyname
          }`
        );
      }
    }
  }
};

function isValidDate(date) {
  const parsedDate = new Date(date);

  // Check if the parsed date is valid
  return !isNaN(parsedDate.getTime());
}

// lead move to data bank
const dataBank = async (req, res) => {
  const { dataInfo, dataBank } = req.body;

  await leadModel.updateMany({ _id: { $in: dataInfo } }, { dataBank });

  res.status(200).json({
    status: 200,
    success: true,
    message: "Data uploaded successfully",
  });
};

const scheduleDemo = TryCatch(async (req, res) => {
  const { leadId, meetingDateTime, meetingType, notes } = req.body;

  const lead = await leadModel.findById(leadId);
  if (!lead) {
    throw new ErrorHandler("Lead not found", 404);
  }

  if (
    req.user.role !== "Super Admin" &&
    lead.creator.toString() !== req.user.id.toString() &&
    lead?.assigned?._id?.toString() !== req.user.id.toString()
  ) {
    throw new ErrorHandler(
      "You don't have permission to schedule meeting for this lead",
      403
    );
  }

  const updatedLead = await leadModel.findByIdAndUpdate(
    leadId,
    {
      meeting: {
        meetingDateTime: new Date(meetingDateTime),
        meetingType,
        notes: notes || "",
      },
      status: "Scheduled Meeting",
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: "meeting scheduled successfully",
    lead: updatedLead,
  });
});

const completeDemo = TryCatch(async (req, res) => {
  const { leadId, riFileUrl } = req.body;

  console.log("completeDemo called with:", { leadId, riFileUrl });

  if (!riFileUrl) {
    throw new ErrorHandler("RI file URL is required", 400);
  }

  const lead = await leadModel
    .findById(leadId)
    .populate("people")
    .populate("company")
    .populate("products");
  if (!lead) {
    throw new ErrorHandler("Lead not found", 404);
  }

  console.log("Lead found before update:", {
    id: lead._id,
    status: lead.status,
    riFile: lead.riFile,
  });

  if (
    req.user.role !== "Super Admin" &&
    lead.creator.toString() !== req.user.id.toString() &&
    lead?.assigned?._id?.toString() !== req.user.id.toString()
  ) {
    throw new ErrorHandler(
      "You don't have permission to complete this demo",
      403
    );
  }

  const updatedLead = await leadModel
    .findByIdAndUpdate(
      leadId,
      {
        status: "Meeting Completed",
        riFile: riFileUrl,
      },
      { new: true }
    )
    .populate("people")
    .populate("company")
    .populate("products");

  console.log("Lead after update:", {
    id: updatedLead._id,
    status: updatedLead.status,
    riFile: updatedLead.riFile,
  });

  // 🔹 Website Config
  const websiteCofiguration = await websiteConfigurationModel
    .findOne({ organization: req.user.organization })
    .populate("organization");
  const {
    sms_api_key,
    sms_api_secret,
    sms_sender_id,
    sms_dealdone_template_id,
    sms_entity_id,
    email_id,
    email_password,
    organization,
  } = websiteCofiguration;

  // Common fields
  const phone = updatedLead?.people?.phone || updatedLead?.company?.phone;
  const email = updatedLead?.people?.email || updatedLead?.company?.email;
  const name =
    updatedLead?.people?.firstname ||
    updatedLead?.company?.companyname ||
    "Customer";
  const product = updatedLead?.products?.[0]?.name || "your product";

  // ✅ SEND SMS
  try {
    if (phone) {
      const message = `Hi ${name}, your purchase of ${product} is confirmed! Thank you for choosing us. Feel free to reach out at +919205404075.-ITSYBIZZ`;
      await sendSms(
        sms_api_key,
        sms_api_secret,
        phone,
        sms_dealdone_template_id,
        sms_sender_id.trim(),
        sms_entity_id,
        message
      );
    }
  } catch (err) {
    console.error("SMS error (completeDemo):", err);
  }

  // ✅ SEND WHATSAPP
  try {
    if (phone) {
      await sendWhatsappTemplate(
        phone,
        "lead_completed", // 👈 your approved WhatsApp template
        "en_US"
      );
    }
  } catch (err) {
    console.error(
      "WhatsApp error (completeDemo):",
      err.response?.data || err.message
    );
  }

  // ✅ SEND EMAIL
  try {
    if (email) {
      const subject = `Your Purchase with ITSYBIZZ is Confirmed!`;
      const message = `<p>Dear <strong>${name}</strong>,</p>
        <p>Thank you for completing your purchase of ${product}! We're thrilled to have you with us and are committed to providing you with the best experience.</p>
        <br>
        <p>If you have any questions or need assistance, please don't hesitate to reach out at <strong>+91 92054 04075</strong> or reply to this email.</p>
        <br>
        <p>Thank you once again for choosing ${organization?.company}!</p>
        <br>
        <p>Warm regards,<br/>The ${organization?.company} Team</p>`;

      await sendBusinessEmail(
        email,
        subject,
        message,
        email_id,
        email_password
      );
    }
  } catch (err) {
    console.error("Email error (completeMeeting):", err);
  }

  res.status(200).json({
    success: true,
    message: "Meeting completed successfully & notifications sent",
    lead: updatedLead,
  });
});

const saveOrUpdateKYC = TryCatch(async (req, res) => {
  const {
    _id,
    annual_turn_over,
    company_type,
    company_located,
    company_tenure,
    kyc_remarks,
  } = req.body;

  // Find the lead
  const lead = await leadModel.findById(_id);

  if (!lead) {
    throw new ErrorHandler("Lead not found", 404);
  }

  // Permission check
  if (
    req.user.role !== "Super Admin" &&
    lead.creator.toString() !== req.user.id.toString() &&
    lead?.assigned?._id?.toString() !== req.user.id.toString()
  ) {
    throw new ErrorHandler(
      "You are not allowed to update this lead's KYC",
      403
    );
  }

  // Update KYC as nested object
  const updatedLead = await leadModel.findByIdAndUpdate(
    _id,
    {
      kyc: {
        annual_turn_over,
        company_type,
        company_located,
        company_tenure,
        kyc_remarks,
      },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: "KYC saved/updated successfully",
    lead: updatedLead,
  });
});

const bulkSms = TryCatch(async (req, res) => {
  try {
    const { leadIds, templateId } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "leadIds array is required" });
    }

    if (!templateId) {
      return res
        .status(400)
        .json({ success: false, message: "templateId is required" });
    }

    // Fetch template with entityId
    const template = await smsTemplateModel.findOne({
      _id: templateId,
      organization: req.user.organization,
    });

    if (!template) {
      return res
        .status(400)
        .json({ success: false, message: "Template not found" });
    }

    const dltTemplateId = template.templateId;
    const templateText = template.templateText;
    const useEntityId = template.entityId || sms_entity_id; // Prefer template's entityId

    // Website SMS config
    const websiteConfiguration = await websiteConfigurationModel.findOne({
      organization: req.user.organization,
    });
    const { sms_api_key, sms_api_secret, sms_sender_id } = websiteConfiguration;

    if (!sms_api_key || !sms_api_secret) {
      return res
        .status(400)
        .json({ success: false, message: "SMS config missing" });
    }

    // Helper function to replace {#var#} placeholders sequentially
    const replacePlaceholders = (text, varsList) => {
      const parts = text.split("{#var#}");
      if (parts.length !== varsList.length + 1) {
        // Fallback: replace all with first var if mismatch
        return text.replace(/\{#var#\}/g, varsList[0] || "");
      }
      return parts.map((part, i) => part + (varsList[i] || "")).join("");
    };

    let results = [];

    for (const leadId of leadIds) {
      const lead = await leadModel
        .findById(leadId)
        .populate("people")
        .populate("company")
        .populate("products");

      if (!lead) {
        results.push({ leadId, status: "failed", error: "Lead not found" });
        continue;
      }

      let phone = (
        lead?.people?.phone ||
        lead?.company?.phone ||
        ""
      ).toString();
      // Strip +91 or 91 to get 10-digit number (as per Nimbus requirement)
      phone = phone.replace(/^\+?91/, "");
      const name = (
        lead?.people?.firstname ||
        lead?.company?.companyname ||
        "Customer"
      ).trim();
      const productName = lead.products[0]?.name || "";

      if (!phone || phone.length !== 10) {
        results.push({
          leadId,
          status: "failed",
          error: "Invalid phone number (must be 10 digits)",
        });
        continue;
      }

      // Prepare variables for placeholders: [name, product, ...] - add more as needed
      const varsList = [name, productName];

      // Replace placeholders
      let smsMessage = replacePlaceholders(templateText, varsList);

      // Add 1-second delay for rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        console.log("Sending SMS:", {
          phone,
          dltTemplateId,
          smsMessage,
          sms_sender_id,
          useEntityId,
        });
        const smsResult = await sendSms(
          sms_api_key,
          sms_api_secret,
          phone,
          dltTemplateId,
          sms_sender_id.trim(),
          useEntityId,
          smsMessage
        );

        results.push({ leadId, phone, status: "success", smsResult });
      } catch (err) {
        results.push({
          leadId,
          phone,
          status: "failed",
          error: err.message || "SMS send error",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bulk SMS operation completed",
      results,
    });
  } catch (err) {
    console.error("Bulk SMS error:", err);
    return res.status(500).json({
      success: false,
      message: "Bulk SMS operation failed",
      error: err.message,
    });
  }
});
const downloadRIFile = TryCatch(async (req, res) => {
  const { leadId } = req.params;

  console.log("downloadRIFile called for leadId:", leadId);

  const lead = await leadModel
    .findById(leadId)
    .populate("people", "firstname lastname")
    .populate("company", "companyname");

  if (!lead) {
    console.log("Lead not found for ID:", leadId);
    throw new ErrorHandler("Lead not found", 404);
  }

  console.log("Lead found:", {
    id: lead._id,
    status: lead.status,
    riFile: lead.riFile,
    hasRiFile: !!lead.riFile,
  });

  if (!lead.riFile) {
    console.log("No riFile found for lead:", leadId);
    throw new ErrorHandler("No RI file found for this lead", 404);
  }

  // Check if user has permission to download
  if (
    req.user.role !== "Super Admin" &&
    lead.creator.toString() !== req.user.id.toString() &&
    lead?.assigned?._id?.toString() !== req.user.id.toString()
  ) {
    throw new ErrorHandler(
      "You don't have permission to download this file",
      403
    );
  }

  // Validate that the riFile is a valid URL
  try {
    new URL(lead.riFile);
  } catch (error) {
    throw new ErrorHandler("Invalid RI file URL stored in database", 400);
  }

  // Get lead name for logging
  const leadName =
    lead?.people?.firstname || lead?.company?.companyname || "Unknown";

  console.log(`RI file download requested for lead: ${leadName} (${leadId})`);

  // Return the file URL
  res.status(200).json({
    success: true,
    message: "RI file URL retrieved successfully",
    fileUrl: lead.riFile,
    leadName: leadName,
    leadId: leadId,
  });
});

const editScheduleDemo = TryCatch(async (req, res) => {
  const { leadId, status, remark, paymentAmount } = req.body;

  console.log("editScheduleDemo called with:", {
    leadId,
    status,
    remark,
    paymentAmount,
  });

  const lead = await leadModel.findById(leadId);
  if (!lead) {
    throw new ErrorHandler("Lead not found", 404);
  }

  if (
    req.user.role !== "Super Admin" &&
    lead.creator.toString() !== req.user.id.toString() &&
    lead?.assigned?._id?.toString() !== req.user.id.toString()
  ) {
    throw new ErrorHandler("You don't have permission to edit this demo", 403);
  }

  // Helper: Next customerId per organization+creator, format CUST-0001
  const generateNextCustomerIdForCreator = async (
    organizationId,
    creatorId
  ) => {
    const latest = await customerModel
      .find({
        organization: organizationId,
        creator: creatorId,
        customerId: { $exists: true },
      })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!latest.length || !latest[0].customerId) return "CUST-0001";

    const lastId = latest[0].customerId; // e.g., CUST-0042
    const match = lastId.match(/^(CUST-)(\d{4})$/);
    if (!match) return "CUST-0001";
    const prefix = match[1];
    const num = parseInt(match[2], 10) + 1;
    return `${prefix}${String(num).padStart(4, "0")}`;
  };

  const updateData = {
    status: status,
  };

  // Prepare remark when Payment Received
  let finalRemark = remark;
  if (status === "Payment Received" && paymentAmount) {
    const amt = Number(paymentAmount);
    if (!isNaN(amt) && amt > 0) {
      finalRemark = `${
        remark ? remark + " | " : ""
      }Payment Received: Rs ${amt}`;
    }
  }

  if (finalRemark) {
    updateData["meeting.remark"] = finalRemark;
  }

  const updatedLead = await leadModel
    .findByIdAndUpdate(leadId, updateData, { new: true })
    .populate("people", "firstname lastname")
    .populate("company", "companyname")
    .populate("products");

  console.log("Lead after status update:", {
    id: updatedLead._id,
    status: updatedLead.status,
    demoRemark: updatedLead.meeting?.remark,
  });

  let customerCreated = false;
  let customerUpdatedToPaid = false;

  if (status === "Completed") {
    console.log("Status changed to Completed, creating customer record...");

    let existingCustomer;
    if (updatedLead.leadtype === "People") {
      existingCustomer = await customerModel.findOne({
        organization: req.user.organization,
        people: updatedLead.people,
      });
    } else {
      existingCustomer = await customerModel.findOne({
        organization: req.user.organization,
        company: updatedLead.company,
      });
    }

    if (!existingCustomer) {
      const customerData = {
        organization: req.user.organization,
        creator: req.user.id,
        customertype: updatedLead.leadtype,
        status: "Deal Done",
        products: updatedLead.products,
        customerId: await generateNextCustomerIdForCreator(
          req.user.organization,
          req.user.id
        ),
      };

      if (updatedLead.leadtype === "People")
        customerData.people = updatedLead.people;
      else customerData.company = updatedLead.company;

      const newCustomer = await customerModel.create(customerData);
      console.log("New customer created:", newCustomer._id);
      customerCreated = true;
    } else {
      console.log("Customer already exists, skipping creation");
      // Backfill missing customerId if absent
      if (!existingCustomer.customerId) {
        existingCustomer.customerId = await generateNextCustomerIdForCreator(
          req.user.organization,
          req.user.id
        );
        await existingCustomer.save();
      }
    }
  }

  // If Payment Received, ensure customer exists, set status and lastPaymentAmount
  if (status === "Payment Received") {
    const amt = Number(paymentAmount);

    let customer = null;
    if (updatedLead.leadtype === "People") {
      customer = await customerModel.findOne({
        organization: req.user.organization,
        people: updatedLead.people,
      });
    } else {
      customer = await customerModel.findOne({
        organization: req.user.organization,
        company: updatedLead.company,
      });
    }

    if (!customer) {
      const customerData = {
        organization: req.user.organization,
        creator: req.user.id,
        customertype: updatedLead.leadtype,
        status: "Payment Received",
        lastPaymentAmount: !isNaN(amt) && amt > 0 ? amt : undefined,
        products: updatedLead.products,
        customerId: await generateNextCustomerIdForCreator(
          req.user.organization,
          req.user.id
        ),
      };
      if (updatedLead.leadtype === "People")
        customerData.people = updatedLead.people;
      else customerData.company = updatedLead.company;

      const newCustomer = await customerModel.create(customerData);
      console.log("Customer created with Payment Received:", newCustomer._id);
      customerCreated = true;
      customerUpdatedToPaid = true;
    } else {
      let changed = false;
      if (customer.status !== "Payment Received") {
        customer.status = "Payment Received";
        changed = true;
      }
      if (!isNaN(amt) && amt > 0) {
        customer.lastPaymentAmount = amt;
        changed = true;
      }
      if (!customer.customerId) {
        customer.customerId = await generateNextCustomerIdForCreator(
          req.user.organization,
          req.user.id
        );
        changed = true;
      }
      if (changed) {
        await customer.save();
        console.log(
          "Customer updated to Payment Received with amount:",
          customer._id,
          amt
        );
        customerUpdatedToPaid = true;
      }
    }
  }

  const message = customerCreated
    ? "Meeting completed successfully and customer record created!"
    : status === "Payment Received" && customerUpdatedToPaid
    ? "Payment recorded and customer updated"
    : "Scheduled Meeting updated successfully";

  res.status(200).json({
    success: true,
    message: message,
    lead: updatedLead,
    customerCreated: customerCreated,
    customerUpdatedToPaid,
    lastPaymentAmount: !isNaN(Number(paymentAmount))
      ? Number(paymentAmount)
      : undefined,
  });
});

const uploadRIFile = TryCatch(async (req, res) => {
  if (!req.file) {
    throw new ErrorHandler("No file uploaded", 400);
  }

  const baseUrl =
    process.env.BACKEND_URL || "https://crmbackendnew.deepnapsoftech.com";
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

  res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    fileUrl: fileUrl,
    filename: req.file.filename,
  });
});

// Add comment to lead
const addComment = async (req, res) => {
  try {
    const { leadId, comment } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!leadId || !comment) {
      return res.status(400).json({
        success: false,
        message: "Lead ID and comment are required",
      });
    }

    const lead = await leadModel.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    // Add comment to the lead
    lead.comments.push({
      comment,
      createdBy: userId,
    });

    await lead.save();

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      data: lead.comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get lead comments
const getComments = async (req, res) => {
  try {
    const { leadId } = req.params;

    const lead = await leadModel
      .findById(leadId)
      .populate("comments.createdBy", "firstname lastname");
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.status(200).json({
      success: true,
      data: lead.comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createLead,
  editLead,
  deleteLead,
  deleteAllLead,
  allLeads,
  leadDetails,
  assignedLeads,
  leadSummary,
  bulkUpload,
  bulkAssign,
  bulkDownload,
  dataBank,
  scheduleDemo,
  editScheduleDemo,
  completeDemo,
  saveOrUpdateKYC,
  bulkSms,
  downloadRIFile,
  uploadRIFile,
  addComment,
  getComments,
};
