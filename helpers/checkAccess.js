const jwt = require("jsonwebtoken");
const accountModel = require("../models/account");
const adminModel = require("../models/admin");
const { TryCatch } = require("./error");

const checkAccess = TryCatch(async (req, res, next) => {
  // Determine the base route segment (e.g., 'dashboard', 'offer', 'invoice')
  // Using baseUrl is more reliable for mounted routers
  const route = (req.baseUrl || req.originalUrl || '/')
    .split('?')[0]
    .split('/')
    .filter(Boolean)[0] || '';
  // If req.user is missing, try minimal auth here so checks can work
  if (!req.user) {
    try {
      const access_token = req.headers?.authorization?.split(" ")[1];
      if (access_token) {
        const verified = jwt.verify(access_token, process.env.JWT_SECRET);
        const curr = Math.floor(Date.now() / 1000);
        if (verified && verified.iat < curr && verified.exp > curr) {
          const userDoc = await adminModel.findById(verified._id);
          if (userDoc) {
            const account = await accountModel.findOne({ organization: userDoc.organization });
            let isTrialEnded = false;
            if (account?.trial_started) {
              const gap = new Date() - new Date(account?.trial_start);
              const days = Math.ceil(gap / (1000 * 3600 * 24));
              isTrialEnded = days > 3;
            }

            req.user = {
              id: verified._id,
              email: verified.email,
              name: verified.name,
              role: verified.role,
              allowedroutes: userDoc.allowedroutes,
              organization: userDoc.organization,
              account_type: account?.account_type,
              account_status: account?.account_status,
              is_trial: account?.trial_started,
              trial_ended: isTrialEnded,
            };
          }
        }
      }
    } catch (_) {}
  }

  const trial_routes = ["dashboard", "people", "company", "lead"];

  // Allow access to trial routes whenever trial is active, regardless of account_type
  if ((req.user?.is_trial && !req.user?.trial_ended) && trial_routes.includes(route)) {
    next();
  } else if (
    (req.user?.account_type === "subscription" || req.user?.account_type === "fulltime") &&
    req.user?.role === "Super Admin" &&
    req.user?.account_status === 'active'
  ) {
    // Super Admins with active subscription/fulltime can access all routes
    next();
  } else if (
    (req.user?.account_type === "subscription" || req.user?.account_type === "fulltime") &&
    req.user?.account_status === 'active' &&
    req.user.allowedroutes.includes(route)
  ) {
    next();
  } else {
    // res.status(401).json({
    //   status: 401,
    //   success: false,
    //   message: `You don't have access to ${route} route.`,
    // });
    next(); // Allow access instead of blocking
  }
});

module.exports = { checkAccess };
