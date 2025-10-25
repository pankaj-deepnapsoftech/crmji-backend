// utils/sendWhatsappTemplate.js
const axios = require("axios");
const TotalWhatsapp = require("../models/totalWhatsapp");

const sendWhatsappTemplate = async (
  phone,
  template_name,
  template_lang,
  components = []
) => {
  try {
    const templateData = {
      messaging_product: "whatsapp",
      to: `91${phone}`, // Indian numbers
      type: "template",
      template: {
        name: template_name,
        language: {
          code: template_lang,
        },
        ...(components.length > 0 && {
          components: [
            {
              type: "body",
              parameters: components,
            },
          ],
        }),
      },
    };

    const res = await axios.post(
      "https://graph.facebook.com/v22.0/575068729020861/messages", // 👈 your Phone Number ID
      templateData,
      {
        headers: {
          Authorization: `Bearer ${process.env.whatsapp_token}`, // 👈 your permanent token in .env
          "Content-Type": "application/json",
        },
      }
    );

    // log into DB
    await TotalWhatsapp.create({ phone });

    console.log("WhatsApp sent:", res.data);
    return res.data;
  } catch (err) {
    console.error("WhatsApp send error:", err.response?.data || err.message);
    throw err;
  }
};

module.exports = sendWhatsappTemplate;
