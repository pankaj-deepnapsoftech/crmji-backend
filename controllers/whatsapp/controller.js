const axios = require("axios");
const peopleModel = require("../../models/people");
const TotalWhatsapp = require("../../models/totalWhatsapp");

exports.SendTemplate = async (req, res) => {
  try {
    const { phone, components, template_name, template_lang } = req.body;


    const templateData = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `91${phone}`,
      type: "template",
      template: {
        name: template_name,
        language: {
          code: template_lang,
        },
        components: [
          {
            type: "body",
            parameters: components,    
          },
        ],
      },
    };


    const data = await axios.post(
      "https://graph.facebook.com/v21.0/575068729020861/messages",
      templateData,
      {
        headers: {
          Authorization: `Bearer ${process.env.whatsapp_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    

    // await peopleModel.findOneAndUpdate(
    //   { phone }, 
    //   { whatsappSentDate: new Date() }, 
    // );

    await TotalWhatsapp.create({ phone });


    return res.status(200).json({
      message: "Message send successful",
      data: data.data,
    });
  } catch (error) {
    res.status(400).json({ message: `message sending error ` });
  }
};

exports.NavigateTowhatsapp = async (req, res) => {
  return res.redirect("https://wa.me/919205404076");
};


exports.totalWhatsapp = async (req,res)=>{
  try {
    const count = await TotalWhatsapp.find();

    return res.status(200).json({
      total: count,
      message: "Total WhatsApp messages count retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching total WhatsApp messages count:", error);
    return res.status(500).json({
      message: "Error retrieving total WhatsApp messages count",
    });
  }
}
