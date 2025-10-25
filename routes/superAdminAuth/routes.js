const express = require("express");
const router = express.Router();
const { isSuperAdminAuthenticated } = require("../../controllers/superAdminAuth/controller");

const {
  registerSuperAdmin,
  loginSuperAdmin,
  checkSuperAdminExists,
  getSuperAdminProfile,
  updateSuperAdminProfile,
  changeSuperAdminPassword,
} = require("../../controllers/superAdminAuth/controller");

// Public routes (no authentication required)
router.post("/register", registerSuperAdmin);
router.post("/login", loginSuperAdmin);
router.get("/check-exists", checkSuperAdminExists);

// Protected routes (Super Admin authentication required)
router.get("/profile", isSuperAdminAuthenticated, getSuperAdminProfile);
router.put("/profile", isSuperAdminAuthenticated, updateSuperAdminProfile);
router.put("/change-password", isSuperAdminAuthenticated, changeSuperAdminPassword);

module.exports = router;
