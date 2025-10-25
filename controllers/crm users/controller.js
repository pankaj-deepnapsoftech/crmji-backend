const { TryCatch } = require("../../helpers/error");
const organizationModel = require("../../models/organization");

const getAllUsers = TryCatch(async (req, res) => {
  const users = await organizationModel
    .find()
    .select("name email phone employeeCount city company account createdAt")
    .populate(
      "account",
      "account_type account_status trial_started trial_start account_name"
    );

  res.status(200).json({
    status: 200,
    success: true,
    users,
  });
});

const getUserDetails = TryCatch(async (req, res) => {
  const { userId } = req.body;
  const user = await organizationModel
    .findById(userId)
    .select("name email phone createdAt employeeCount city company account")
    .populate(
      "account",
      "account_type account_status trial_started trial_start account_name"
    );

  if (!user) {
    throw new Error("User doesn't exist", 400);
  }

  res.status(200).json({
    status: 200,
    success: true,
    user,
  });
});

module.exports = {
  getAllUsers,
  getUserDetails,
};
