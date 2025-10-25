// const request = require("request");

// const sendSms = (apiKey, apiSecret, mobile, templateId, senderId, entityId, message) => {
//   try {
//     if (!templateId || templateId.trim().length === 0) {
//       return res.status(400).json({
//         status: 400,
//         success: false,
//         message: "Please provide the template id field",
//       });
//     }
//     if (!senderId || senderId.trim().length === 0) {
//       return res.status(400).json({
//         status: 400,
//         success: false,
//         message: "Please provide the sender id field",
//       });
//     }
//     if (!entityId || entityId.trim().length === 0) {
//       return res.status(400).json({
//         status: 400,
//         success: false,
//         message: "Please provide the entity id field",
//       });
//     } 
//     if (!message || message.trim().length === 0) {
//       return res.status(400).json({
//         status: 400,
//         success: false,
//         message: "Please provide the message field",
//       });
//     }

//     if (!mobile) {
//       return res.status(400).json({
//         status: 400,
//         success: false,
//         message: "Mobile no. not provided",
//       });
//     }

//     let options = {
//       // url: `${process.env.SEND_SINGLE_MSG_API}UserID=${process.env.API_KEY}&Password=${process.env.API_SECRET}&SenderID=${senderId}&Phno=${req.body.mobile}&EntityID=${entityId}&TemplateID=${templateId}&Msg=${message}`,
//       url: `${process.env.SEND_SINGLE_MSG_API}UserID=${apiKey}&Password=${apiSecret}&SenderID=${senderId}&Phno=${mobile}&EntityID=${entityId}&TemplateID=${templateId}&Msg=${message}`,
//       headers: { "content-type": "application/x-www-form-urlencoded" },
//     };

//     request.post(options, function (error, response, body) {
//       if (!error && response.statusCode == 200) {
//         return;
//       } else {
//         return;
//       }
//     });
//   } catch (err) {
//     throw err;
//   }
// };

// module.exports = sendSms;


// sendSms.js


const request = require("request");

const sendSms = (apiKey, apiSecret, mobile, templateId, senderId, entityId, message) => {
  return new Promise((resolve, reject) => {
    try {
      // Basic validation (log but don't crash)
      if (!apiKey || !apiSecret) {
        const e = new Error("Missing SMS API credentials");
        console.error(e);
        return reject(e);
      }
      if (!mobile) {
        const e = new Error("Mobile number not provided");
        console.error(e);
        return reject(e);
      }
      if (!templateId || !senderId || !entityId || !message) {
        const e = new Error("Missing SMS parameters");
        console.error(e, { templateId, senderId, entityId, message, mobile });
        return reject(e);
      }

      const base = process.env.SEND_SINGLE_MSG_API;
      if (!base) {
        const e = new Error("SEND_SINGLE_MSG_API not set in env");
        console.error(e);
        return reject(e);
      }

      const encodedMsg = encodeURIComponent(message);
      const url = `${base}UserID=${apiKey}&Password=${apiSecret}&SenderID=${encodeURIComponent(senderId)}&Phno=${encodeURIComponent(mobile)}&EntityID=${encodeURIComponent(entityId)}&TemplateID=${encodeURIComponent(templateId)}&Msg=${encodedMsg}`;

      request.post({ url, headers: { "content-type": "application/x-www-form-urlencoded" } }, (error, response, body) => {
        if (error) {
          console.error("SMS send error:", error);
          return reject(error);
        }
        console.log("SMS API response:", response && response.statusCode, body);
        resolve({ statusCode: response && response.statusCode, body });
      });
    } catch (err) {
      console.error("sendSms exception:", err);
      reject(err);
    }
  });
};

module.exports = sendSms;

