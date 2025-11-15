const { TryCatch, ErrorHandler } = require("../../helpers/error");
const generateOTP = require("../../helpers/generateOTP");
const organizationModel = require("../../models/organization");
const bcrypt = require("bcryptjs");
const otpModel = require("../../models/otp");
const adminModel = require("../../models/admin");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../../helpers/sendEmail");
const websiteConfigurationModel = require("../../models/websiteConfiguration");
const settingModel = require("../../models/setting");
const accountModel = require("../../models/account");
const subscriptionModel = require("../../models/subscription");
const getDateDifference = require("../../helpers/getDateDifference");

const create = TryCatch(async (req, res) => {
  const { name, email, phone, password, company, city, employeeCount } =
    req.body;

  let isExistingOrganization = await organizationModel.findOne({ email });
  if (isExistingOrganization) {
    throw new ErrorHandler("Email id is already used", 400);
  }
  isExistingOrganization = await organizationModel.findOne({ phone });
  if (isExistingOrganization) {
    throw new ErrorHandler("Phone no. is already used", 400);
  }

  const hashedPass = await bcrypt.hash(password, 12);
  const organization = await organizationModel.create({
    name,
    email,
    phone,
    password: hashedPass,
    company,
    city,
    employeeCount,
  });

  const otp = generateOTP();
  await otpModel.create({
    email,
    otp,
  });

  try {
    await sendEmail(
      email,
      "OTP Verification",
      `
      <div>Hi ${organization.name},</div>
      <br>
      <div>${otp} is your OTP(One-Time-Password) to verify your account. OTP is valid for 5 minutes. Do not share your OTP with anyone.</div>
      <br>    
      <div>Best Regards</div>
      <div>Deepnap Softech</div>
      `
    );
  } catch (emailError) {
    console.error("Failed to send registration email:", emailError);
    // Log the OTP for debugging in development (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    }
    throw emailError; // Re-throw to prevent registration if email fails
  }

  res.status(200).json({
    status: 200,
    success: true,
    message: "Your organization has been registerd successfully",
  });
});

const verifyOTP = TryCatch(async (req, res) => {
  const { email, otp } = req.body;

  const isOTPValid = await otpModel.findOne({ email, otp });
  if (!isOTPValid) {
    throw new ErrorHandler("Invalid OTP", 400);
  }

  await otpModel.deleteOne({ email, otp });
  const organization = await organizationModel.findOneAndUpdate(
    { email: email },
    { verified: true },
    { new: true }
  );

  const account = await accountModel.create({
    organization: organization._id,
  });

  account.trial_started = true;
  account.trial_start = new Date();
  await account.save();

  const user = await adminModel.create({
    organization: organization._id,
    name: organization.name,
    email: organization.email,
    phone: organization.phone,
    password: organization.password,
    designation: "Owner",
    role: "Super Admin",
    allowedroutes: [
      "admin",
      "dashboard",
      "people",
      "company",
      "lead",
      "product",
      "category",
      "expense",
      "expense-category",
      "offer",
      "proforma-invoice",
      "invoice",
      "payment",
      "customer",
      "report",
      "support",
      "website configuration",
    ],
    verified: true,
  });

  await websiteConfigurationModel.create({
    creator: user._id,
    organization: organization._id,
    indiamart_api: "",
    facebook_api: "",
  });

  await settingModel.create({
    creator: user._id,
    organization: organization._id,
  });

  organization.account = account._id;
  await organization.save();

  await sendEmail(
    email,
    "Registration Successful",
    `
          <div>Hi ${user.name},</div>
          <br>
          <div>Congratulations and welcome!</div>
          <br>
          <div>We’re thrilled to let you know that your registration has been successfully completed.</div>
          <br>
          <div>Best Regards</div>
          <div>Deepnap Softech</div>
          `
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "OTP verified successfully",
  });
});

const login = TryCatch(async (req, res) => {
  const { email, password } = req.body;

  const isExistingOrganization = await organizationModel
    .findOne({ email })
    .populate({ path: "account", populate: { path: "subscription" } });
  if (!isExistingOrganization) {
    throw new ErrorHandler("Organization not found", 404);
  }
  console.log(isExistingOrganization.password)
  const isPasswordMatched = await bcrypt.compare(
    password,
    isExistingOrganization.password
  );
  if (!isPasswordMatched) {
    throw new ErrorHandler("Make sure you have entered the correct credentials", 401);
  }

  const isVerified = await organizationModel
    .findOne({ email })
    .select("verified");
  if (!isVerified.verified) {
    const otpExists = await otpModel.findOne({ email });
    if (!otpExists) {
      const otp = generateOTP();
      await otpModel.create({
        email,
        otp,
      });
    }

    return res.status(401).json({
      status: 401,
      success: false,
      verified: false,
      message: "Account not verified.",
    });
  }

  const organization_access_token = jwt.sign(
    {
      _id: isExistingOrganization._id,
      email: isExistingOrganization.email,
      name: isExistingOrganization.name,
      iat: Math.floor(Date.now() / 1000) - 30,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  const admin = await adminModel.findOne({email: isExistingOrganization.email});
  
  if (!admin) {
    throw new ErrorHandler("Admin user not found for this organization", 404);
  }

  const admin_access_token = jwt.sign(
    {
      _id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      allowedroutes: admin.allowedroutes,
      iat: Math.floor(Date.now() / 1000) - 30,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "Logged in successfully",
    organization_access_token,
    admin_access_token,
    organization: {
      ...isExistingOrganization._doc,
      password: undefined,
    },
  });
});

const loginWithAccessToken = TryCatch(async (req, res, next) => {
  if (!req.headers.authorization) {
    throw new ErrorHandler("Access token not provided", 401);
  }

  const access_token = req.headers.authorization.split(" ")[1];

  const verified = jwt.verify(access_token, process.env.JWT_SECRET);
  const currTimeInSeconds  = Math.floor(Date.now() / 1000);
  // access_token is not expired
  if (
    verified &&
    verified.iat < currTimeInSeconds &&
    verified.exp > currTimeInSeconds
  ) {
    
    const user = await organizationModel
    .findById(verified._id)
    .populate({ path: "account", populate: { path: "subscription" } });
    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }

    return res.status(200).json({
      status: 200,
      success: true,
      message: "User has been logged in successfully",
      organization: {
        ...user._doc,
        password: undefined,
      },
    });
  } else {
    throw new Error("Session expired!");
  }
});

const getOTP = TryCatch(async (req, res) => {
  const { email } = req.body;

  const user = await organizationModel.findOne({ email: email });
  if (!user) {
    throw new ErrorHandler("User doesn't exists", 404);
  }
  const isExistingOtp = await otpModel.findOne({ email: email });

  if (isExistingOtp) {
    await sendEmail(
      email,
      "OTP Verification",
      `
      <div>Hi ${user.name},</div>
      <br>
      <div>${isExistingOtp.otp} is your OTP(One-Time-Password) to verify your account. OTP is valid for 5 minutes. Do not share your OTP with anyone.</div>
      <br>    
      <div>Best Regards</div>
      <div>Deepnap Softech</div>
      `
    );

    return res.status(200).json({
      status: 200,
      success: true,
      message: "OTP has been sent to your email id",
    });
  }

  const otp = generateOTP();

  await otpModel.create({
    email: user.email,
    otp,
  });

  await sendEmail(
    email,
    "OTP Verification",
    `
      <div>Hi ${user.name},</div>
      <br>
      <div>${otp} is your OTP(One-Time-Password) to verify your account. OTP is valid for 5 minutes. Do not share your OTP with anyone.</div>
      <br>    
      <div>Best Regards</div>
      <div>Deepnap Softech</div>
      `
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "OTP has been sent to your email id",
  });
});

const passwordResetOTPVerify = TryCatch(async (req, res) => {
  const { email, otp } = req.body;

  const user = await organizationModel.findOne({ email: email });
  if (!user) {
    throw new ErrorHandler("User doesn't exists", 404);
  }

  const isOTPValid = await otpModel.findOne({ email: email, otp: otp });
  if (!isOTPValid) {
    throw new ErrorHandler("Invalid OTP", 400);
  }

  await otpModel.deleteOne({ email: email });

  const resetToken = jwt.sign(
    {
      email: email,
    },
    process.env.PASSWORD_RESET_SECRET,
    {
      expiresIn: "1m",
    }
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "OTP verified successfully",
    resetToken,
  });
});

const resetPassword = TryCatch(async (req, res) => {
  const { resetToken, email, newPassword } = req.body;

  try {
    const verified = jwt.verify(resetToken, process.env.PASSWORD_RESET_SECRET);
    const currTimeInMilliSeconds = Math.floor(Date.now() / 1000);

    if (
      verified &&
      verified.iat < currTimeInMilliSeconds &&
      verified.exp > currTimeInMilliSeconds &&
      verified.email === email
    ) {
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await organizationModel.findOneAndUpdate(
        { email },
        { password: hashedPassword }
      );

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Your password has been reset successfully",
      });
    }

    throw new Error("Invalid token");
  } catch (err) {
    return res.status(401).json({
      status: 401,
      success: false,
      message: "Something went wrong",
    });
  }
});

const isAuthenticatedOrganization = TryCatch(async (req, res, next) => {
  let access_token = req.headers?.authorization?.split(" ")[1];

  try {
    const verified = jwt.verify(access_token, process.env.JWT_SECRET);
    const currTimeInMilliSeconds = Math.floor(Date.now() / 1000);

    // access_token is not expired
    if (
      verified &&
      verified.iat < currTimeInMilliSeconds &&
      verified.exp > currTimeInMilliSeconds
    ) {
      const organization = await organizationModel.findById(verified._id);
      if (!organization) {
        throw new ErrorHandler("Organization doesn't exists", 404);
      }

      req.organization = {
        id: organization._id,
        email: organization.email,
        name: organization.name,
      };
      next();
    } else {
      throw new Error("Session expired!");
    }
  } catch (err) {
    return res.status(401).json({
      status: 401,
      success: false,
      message: err.message,
    });
  }
});

// trial account activation logic
const activateTrialAccount = TryCatch(async (req, res) => {
  const account = await accountModel.findOne({
    organization: req.organization.id,
  });

  if (!account) {
    throw new ErrorHandler("Account not found", 404);
  }

  account.trial_started = true;
  account.trial_start = new Date();
  await account.save();

  return res.status(200).json({
    status: 200,
    success: true,
    message: "Your trial account has been activated successfully",
  });
});

// Test email configuration endpoint (for debugging)
const testEmailConfig = TryCatch(async (req, res) => {
  const { testEmail } = req.body;
  
  if (!testEmail) {
    throw new ErrorHandler("Test email address is required", 400);
  }

  try {
    await sendEmail(
      testEmail,
      "Test Email - Email Configuration",
      `
      <div>Hi,</div>
      <br>
      <div>This is a test email to verify your email configuration.</div>
      <br>
      <div>If you received this email, your SMTP configuration is working correctly!</div>
      <br>
      <div>Best Regards</div>
      <div>CRM System</div>
      `
    );

    res.status(200).json({
      status: 200,
      success: true,
      message: "Test email sent successfully! Check your inbox.",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      message: error.message,
      details: "Email configuration test failed. Please check your EMAIL_ID and EMAIL_PASSWORD in .env file.",
    });
  }
});

// Get subscription/trial days remaining
const getSubscriptionDays = TryCatch(async (req, res) => {
  const organizationId = req.user.organization;

  if (!organizationId) {
    throw new ErrorHandler("Organization not found", 404);
  }

  const account = await accountModel
    .findOne({ organization: organizationId })
    .populate("subscription");

  if (!account) {
    return res.status(200).json({
      status: 200,
      success: true,
      daysRemaining: 0,
      accountType: null,
      message: "No account found",
    });
  }

  let daysRemaining = 0;
  let accountType = account.account_type;
  let planName = account.account_name || "";

  // Check if it's a trial account
  if (account.account_type === "trial" && account.trial_started && account.trial_start) {
    const daysElapsed = getDateDifference(account.trial_start, new Date());
    daysRemaining = Math.max(0, 3 - daysElapsed); // Trial is 3 days
    planName = "Free Trial";
  }
  // Check if it's a subscription account
  else if (
    account.account_type === "subscription" &&
    account.account_status === "active" &&
    account.subscription
  ) {
    let endDate = null;
    
    // If endDate exists and is valid (in future), use it
    if (account.subscription.endDate) {
      const checkEndDate = new Date(account.subscription.endDate);
      const now = new Date();
      if (checkEndDate > now) {
        endDate = checkEndDate;
      }
    }
    
    // If endDate is null or in past, calculate 30 days from startDate or payment date
    if (!endDate) {
      const startDate = account.subscription.startDate 
        ? new Date(account.subscription.startDate)
        : account.subscription.createdAt 
        ? new Date(account.subscription.createdAt)
        : new Date();
      
      // Add 30 days for monthly subscription
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);
      
      // Update the subscription endDate in database for future use
      if (account.subscription._id) {
        await subscriptionModel.findByIdAndUpdate(
          account.subscription._id,
          { endDate: endDate },
          { new: true }
        );
      }
    }
    
    const now = new Date();
    const diffTime = endDate - now;
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysRemaining = Math.max(0, daysRemaining); // Ensure non-negative
    planName = account.account_name || "Monthly Plan";
    
    // If subscription expired (daysRemaining === 0), update account status to inactive
    if (daysRemaining === 0 && account.account_status === "active") {
      await accountModel.findByIdAndUpdate(
        account._id,
        { account_status: "inactive" }
      );
      account.account_status = "inactive";
    }
  }
  // Check if it's a lifetime/fulltime account
  else if (account.account_type === "fulltime" && account.account_status === "active") {
    daysRemaining = -1; // -1 indicates lifetime/unlimited
    planName = "Lifetime Plan";
  }

  return res.status(200).json({
    status: 200,
    success: true,
    daysRemaining,
    accountType,
    planName,
    isActive: account.account_status === "active",
    trialStarted: account.trial_started || false,
  });
});

module.exports = {
  create,
  verifyOTP,
  login,
  loginWithAccessToken,
  getOTP,
  resetPassword,
  passwordResetOTPVerify,
  isAuthenticatedOrganization,
  activateTrialAccount,
  testEmailConfig,
  getSubscriptionDays,
};
