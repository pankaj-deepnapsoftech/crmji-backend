const express = require("express");
const { editCompanySettings, getCompanySettings } = require("../../controllers/setting/controller");
const { checkAccess } = require("../../helpers/checkAccess");
const { isAuthenticated } = require("../../controllers/auth/controller");
const router = express.Router();

router.post("/edit", isAuthenticated, checkAccess, editCompanySettings);
router.get("/get", isAuthenticated, checkAccess, getCompanySettings);

module.exports = router;