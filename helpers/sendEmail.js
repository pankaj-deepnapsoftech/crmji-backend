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

async function createHostingerTransport(from, password, options = {}) {
  const config = {
    host: "smtp.hostinger.com",
    port: options.port || 465,
    secure: options.secure !== undefined ? options.secure : true,
    auth: {
      user: from,
      pass: password,
    },
    // Add timeout and connection options
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
    // Disable TLS certificate validation issues (if needed)
    tls: {
      rejectUnauthorized: false, // Some servers have certificate issues
    },
  };

  // If using port 587, use STARTTLS instead of SSL
  if (config.port === 587) {
    config.secure = false;
    config.requireTLS = true;
  }

  return nodemailer.createTransport(config);
}

const sendEmail = async (to, subject, htmlText) => {
  // Hardcoded email credentials
  const from = "noreply@itsybizz.com";
  const password = "Noreply@282013";
  
  try {
    
    // Detailed validation with helpful error messages
    if (!from) {
      throw new Error("Email service configuration error: EMAIL_ID is not set.");
    }
    if (!password) {
      throw new Error("Email service configuration error: EMAIL_PASSWORD is not set.");
    }
    
    // Log email being used (without password) for debugging
    console.log(`Attempting to send email from: ${from} to: ${to}`);
    console.log(`SMTP Server: smtp.hostinger.com, Port: 465 (SSL)`);
    
    let transporter = await createHostingerTransport(from, password);
    
    // Verify connection before sending
    console.log("Verifying SMTP connection...");
    let connectionVerified = false;
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
      connectionVerified = true;
    } catch (verifyError) {
      console.error("SMTP verification failed with port 465:", verifyError.message);
      // Try alternative port 587 with STARTTLS
      try {
        console.log("Trying port 587 with STARTTLS...");
        transporter = await createHostingerTransport(from, password, { port: 587, secure: false });
        await transporter.verify();
        console.log("SMTP connection verified successfully with port 587");
        connectionVerified = true;
      } catch (port587Error) {
        console.error("SMTP verification failed with port 587:", port587Error.message);
        // Re-throw the original error for better diagnostics
        throw verifyError;
      }
    }
    
    if (!connectionVerified) {
      throw new Error("Failed to establish SMTP connection with both port 465 and 587");
    }
    
    const mailOptions = {
      from,
      to,
      subject,
      html: `<html><body>${htmlText}</body></html>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Hostinger: Email sent successfully:", info.response);
    return info;
  } catch (err) {
    console.error("sendEmail error details:", {
      code: err.code,
      responseCode: err.responseCode,
      command: err.command,
      message: err.message,
      response: err.response
    });
    
    // Provide user-friendly error messages for common SMTP errors
    if (err.code === 'EAUTH' || err.responseCode === 535 || err.message?.includes('535') || err.message?.includes('authentication failed')) {
      const emailDomain = from ? from.split('@')[1] : 'unknown';
      
      // Log detailed troubleshooting info to console
      console.error("\n=== EMAIL AUTHENTICATION FAILED ===");
      console.error("Email Domain:", emailDomain);
      console.error("EMAIL_ID:", from || 'NOT SET');
      console.error("EMAIL_PASSWORD:", password ? 'Set (length: ' + password.length + ')' : 'NOT SET');
      console.error("\nTroubleshooting steps:");
      console.error("1. Verify EMAIL_ID format: Should be full email (e.g., noreply@" + emailDomain + ")");
      console.error("2. Check EMAIL_PASSWORD: Must be the email account password, NOT your Hostinger hosting account password");
      console.error("3. Verify email account exists: Log into Hostinger control panel → Email → Check if the email account is created and active");
      console.error("4. Reset email password: If unsure, reset the email password in Hostinger control panel");
      console.error("5. Check email account status: Ensure the email account is not suspended or disabled");
      console.error("6. Common mistake: Using hosting account password instead of email account password");
      console.error("=====================================\n");
      
      // Shorter error message for API response
      const errorMsg = `Email service authentication failed. Please verify EMAIL_ID and EMAIL_PASSWORD in your .env file. For Hostinger emails, ensure you're using the email account password (not the hosting account password) and that the email account exists and is active.`;
      
      throw new Error(errorMsg);
    }
    
    if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT') {
      throw new Error("Unable to connect to email server. Please check your internet connection and email server settings.");
    }
    
    // Re-throw with original message if it's already user-friendly
    throw err;
  }
};

const sendBusinessEmail = async (to, subject, htmlText, fromOverride, passwordOverride) => {
  // Hardcoded email credentials (can be overridden by function parameters)
  const from = fromOverride || "noreply@itsybizz.com";
  const password = passwordOverride || "Noreply@282013";
  
  try {
    if (!from || !password) {
      throw new Error("Business email credentials not provided");
    }

    console.log(`Attempting to send business email from: ${from} to: ${to}`);
    let transporter = await createHostingerTransport(from, password);
    
    // Verify connection before sending with fallback
    console.log("Verifying SMTP connection...");
    let connectionVerified = false;
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
      connectionVerified = true;
    } catch (verifyError) {
      console.error("SMTP verification failed with port 465, trying port 587...");
      try {
        transporter = await createHostingerTransport(from, password, { port: 587, secure: false });
        await transporter.verify();
        console.log("SMTP connection verified successfully with port 587");
        connectionVerified = true;
      } catch (port587Error) {
        console.error("SMTP verification failed with port 587:", port587Error.message);
        throw verifyError;
      }
    }
    
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
    
    // Provide user-friendly error messages for common SMTP errors
    if (err.code === 'EAUTH' || err.responseCode === 535 || err.message?.includes('535') || err.message?.includes('authentication failed')) {
      throw new Error("Email service authentication failed. Please check the provided email credentials.");
    }
    
    if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT') {
      throw new Error("Unable to connect to email server. Please check your internet connection and email server settings.");
    }
    
    throw err;
  }
};

module.exports = { sendEmail, sendBusinessEmail };
