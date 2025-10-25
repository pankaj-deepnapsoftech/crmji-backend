// const nodemailer = require("nodemailer");

// const sendEmail = async (to, subject, text) => {
//   const mailOptions = {
//     from: process.env.EMAIL_ID,
//     to: to,
//     subject: subject,
//     html: `
//     <html>
//     <body>
//     ${text}
//     </body>
//     </html>
//     `,
//   };
  
//   const transporter = nodemailer.createTransport({
//     host: "smtp.hostinger.com",
//     port: 465,
//     secure: true,
//     auth: {
//       user: process.env.EMAIL_ID,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//         //  console.error("Error sending email: ", error);
//     } else {
//       //  console.log("Email sent: ", info.response);
//     }
//   });
// };

// const sendBusinessEmail = async (to, subject, text, from, password) => {
//   const mailOptions = {
//     from,
//     to: to,
//     subject: subject,
//     html: `
//     <html>
//     <body>
//     ${text}
//     </body>
//     </html>
//     `,
//   };
  
//   const transporter = nodemailer.createTransport({
//     service: "Gmail",
//     host: "smtp.gmail.com",
//     port: 465,
//     secure: true,
//     auth: {
//       user: from,
//       pass: password,
//     },
//   });

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       //   console.error("Error sending email: ", error);
//     } else {
//       //   console.log("Email sent: ", info.response);
//     }
//   });
// };

// module.exports = { sendEmail, sendBusinessEmail };




// sendEmail.js
const nodemailer = require("nodemailer");

async function createHostingerTransport(from, password) {
  return nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: from,
      pass: password,
    },
  });
}

const sendEmail = async (to, subject, htmlText) => {
  try {
    const from = process.env.EMAIL_ID;
    const password = process.env.EMAIL_PASSWORD;
    if (!from || !password) {
      throw new Error("Hostinger email credentials not set in env");
    }

    const transporter = await createHostingerTransport(from, password);
    const mailOptions = {
      from,
      to,
      subject,
      html: `<html><body>${htmlText}</body></html>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Hostinger: Email sent:", info.response);
    return info;
  } catch (err) {
    console.error("sendEmail error:", err);
    throw err;
  }
};

const sendBusinessEmail = async (to, subject, htmlText, fromOverride, passwordOverride) => {
  try {
    const from = fromOverride || process.env.EMAIL_ID;
    const password = passwordOverride || process.env.EMAIL_PASSWORD;
    if (!from || !password) {
      throw new Error("Business email credentials not provided");
    }

    const transporter = await createHostingerTransport(from, password);
    const mailOptions = {
      from,
      to,
      subject,
      html: `<html><body>${htmlText}</body></html>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Hostinger: Business email sent:", info.response);
    return info;
  } catch (err) {
    console.error("sendBusinessEmail error:", err);
    throw err;
  }
};

module.exports = { sendEmail, sendBusinessEmail };
