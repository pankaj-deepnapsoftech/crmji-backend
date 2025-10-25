const { createTransport } = require("nodemailer");
require("dotenv").config();
const path = require("path");
const ejs = require("ejs");

const transporter = createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function SendMail(templateName, templateData, reciverData) {
  try {
    const newPath = path.join(__dirname, "..", "template", templateName);

    const Emailtemplate = await ejs.renderFile(newPath, templateData);

    await transporter.sendMail({
      from: process.env.EMAIL_ID,
      to: reciverData.email,
      subject: reciverData.subject,
      text: "Itsybizz OTP",
      html: Emailtemplate,
    });

    console.log("send mail");
  } catch (error) {
    console.log("mail not send ", error);
  }
}

async function SendBulkMail(reciverData) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_ID,
      to: reciverData.email,
      subject: reciverData.subject,
      html: `
        <html>
          <body>${reciverData.message}</body>
        </html>`
      ,
    });

    console.log("send mail");
  } catch (error) {
    console.log("mail not send ", error);
  }
}

module.exports = { SendMail,SendBulkMail };
