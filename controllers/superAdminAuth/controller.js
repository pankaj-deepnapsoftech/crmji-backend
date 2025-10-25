const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { TryCatch, ErrorHandler } = require("../../helpers/error");
const superAdminModel = require("../../models/superAdmin");

// Super Admin Registration (Only one can exist)
const registerSuperAdmin = TryCatch(async (req, res) => {
  const { name, email, phone, password, designation } = req.body;

  // Check if Super Admin already exists
  const existingSuperAdmin = await superAdminModel.findOne();
  if (existingSuperAdmin) {
    throw new ErrorHandler("Super Admin already exists. Only one Super Admin is allowed.", 400);
  }

  const isExistingUserWithEmail = await superAdminModel.findOne({ email });
  if (isExistingUserWithEmail) {
    throw new ErrorHandler("A Super Admin with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const superAdmin = await superAdminModel.create({
    name,
    email,
    phone,
    password: hashedPassword,
    designation: designation || "Super Administrator",
    verified: true, // Super Admin is auto-verified
  });

  const access_token = jwt.sign(
    {
      _id: superAdmin._id,
      email: superAdmin.email,
      name: superAdmin.name,
      role: "Super Admin",
      iat: Math.floor(Date.now() / 1000) - 30,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "Super Admin created successfully",
    access_token,
    superAdmin: {
      id: superAdmin._id,
      name: superAdmin.name,
      email: superAdmin.email,
      phone: superAdmin.phone,
      designation: superAdmin.designation,
      role: "Super Admin",
    },
  });
});

// Super Admin Login
const loginSuperAdmin = TryCatch(async (req, res) => {
  const { email, password } = req.body;

  const existingSuperAdmin = await superAdminModel
    .findOne({ email })
    .select("password email name phone designation verified isActive");

  if (!existingSuperAdmin) {
    throw new ErrorHandler("Super Admin not found", 404);
  }

  if (!existingSuperAdmin.isActive) {
    throw new ErrorHandler("Super Admin account is deactivated", 403);
  }

  const passwordMatched = await bcrypt.compare(password, existingSuperAdmin.password);

  if (!passwordMatched) {
    throw new Error("Invalid credentials", 401);
  }

  const access_token = jwt.sign(
    {
      _id: existingSuperAdmin._id,
      email: existingSuperAdmin.email,
      name: existingSuperAdmin.name,
      role: "Super Admin",
      iat: Math.floor(Date.now() / 1000) - 30,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "Super Admin login successful",
    access_token,
    superAdmin: {
      id: existingSuperAdmin._id,
      name: existingSuperAdmin.name,
      email: existingSuperAdmin.email,
      phone: existingSuperAdmin.phone,
      designation: existingSuperAdmin.designation,
      role: "Super Admin",
    },
  });
});

// Check if Super Admin exists
const checkSuperAdminExists = TryCatch(async (req, res) => {
  const superAdmin = await superAdminModel.findOne();
  
  res.status(200).json({
    status: 200,
    success: true,
    exists: !!superAdmin,
    message: superAdmin ? "Super Admin exists" : "No Super Admin found",
  });
});

// Get Super Admin profile
const getSuperAdminProfile = TryCatch(async (req, res) => {
  const superAdmin = await superAdminModel.findById(req.user._id).select('-password');
  
  if (!superAdmin) {
    throw new ErrorHandler("Super Admin not found", 404);
  }

  res.status(200).json({
    status: 200,
    success: true,
    superAdmin,
  });
});

// Update Super Admin profile
const updateSuperAdminProfile = TryCatch(async (req, res) => {
  const { name, phone, designation } = req.body;
  
  const superAdmin = await superAdminModel.findByIdAndUpdate(
    req.user._id,
    { name, phone, designation },
    { new: true }
  ).select('-password');

  res.status(200).json({
    status: 200,
    success: true,
    message: "Profile updated successfully",
    superAdmin,
  });
});

// Change Super Admin password
const changeSuperAdminPassword = TryCatch(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const superAdmin = await superAdminModel.findById(req.user._id).select('password');
  
  const passwordMatched = await bcrypt.compare(currentPassword, superAdmin.password);
  if (!passwordMatched) {
    throw new ErrorHandler("Current password is incorrect", 400);
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);
  await superAdminModel.findByIdAndUpdate(
    req.user._id,
    { password: hashedNewPassword }
  );

  res.status(200).json({
    status: 200,
    success: true,
    message: "Password changed successfully",
  });
});

module.exports = {
  registerSuperAdmin,
  loginSuperAdmin,
  checkSuperAdminExists,
  getSuperAdminProfile,
  updateSuperAdminProfile,
  changeSuperAdminPassword,
};

// SUPER ADMIN AUTH MIDDLEWARE
// Verifies JWT from Authorization: Bearer <token> or access_token cookie
const isSuperAdminAuthenticated = TryCatch(async (req, res, next) => {
  const authHeader = req.headers?.authorization || "";
  let token = null;

  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // Fallback to cookie if provided
  if (!token && req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const superAdmin = await superAdminModel.findById(decoded?._id).select("_id email name");
  if (!superAdmin) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  req.user = {
    _id: superAdmin._id,
    email: superAdmin.email,
    name: superAdmin.name,
    role: "Super Admin",
  };

  next();
});

module.exports.isSuperAdminAuthenticated = isSuperAdminAuthenticated;
