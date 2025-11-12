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
        // components: [
        //   {
        //     type: "body",
        //     parameters: components,    
        //   },
        // ],
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
    console.log(error)
    res.status(400).json({ message: error });
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


exports.GetApprovedTemplates = async (req, res) => {
  try {
    const WABA_ID = "1789176135196884";
    console.log("Token used:", process.env.whatsapp_token);

    const response = await axios.get(
      `https://graph.facebook.com/v21.0/${WABA_ID}/message_templates`,
      {
        headers: {
          Authorization: `Bearer ${process.env.whatsapp_token}`,
          "Content-Type": "application/json",
        },
        params: {
          fields:
            "name,status,category,language,id,created_timestamp,message_send_ttl_seconds",
          limit: 100,
          status: "APPROVED",
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Approved templates fetched successfully",
      total: response.data.data?.length || 0,
      data: response.data.data,
    });
  } catch (error) {
    console.error("Error fetching approved templates:", error.response?.data || error.message);
    res.status(400).json({
      success: false,
      message: "Error fetching approved templates",
      error: error.response?.data?.error?.message || error.message,
    });
  }
};