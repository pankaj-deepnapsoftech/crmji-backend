const crypto = require("crypto");
const { TryCatch } = require("../../helpers/error");
const accountModel = require("../../models/account");
const organizationModel = require("../../models/organization");
const subscriptionModel = require("../../models/subscription");
const instance = require("../../utils/razorpay");
const paymentModel = require("../../models/payment");
const subscriptionPaymentModel = require("../../models/subscriptionPayment");

const getRazorpayKey = TryCatch(async (req, res) => {
  const razorpay_key_id = process.env.RZP_KEY_ID;

  if (!razorpay_key_id) {
    throw new Error("RZP_KEY_ID not found", 404);
  }

  res.status(200).json({
    status: 200,
    success: true,
    razorpay_key_id,
  });
});

const createSubscription = TryCatch(async (req, res) => {
  const { quantity } = req.body;
  const organization = await organizationModel.findById(req.organization.id);

  if (!organization) {
    throw new Error("Organization doesn't exist", 404);
  }

  const account = await accountModel.findOne({
    organization: organization._id,
  });
  const isExistingSubscription = await subscriptionModel.findById(
    account?.subscription
  );
  if (isExistingSubscription) {
    return res.status(200).json({
      status: 200,
      success: true,
      subscription_id: isExistingSubscription.razorpaySubscriptionId,
    });
  }

  const plan_id = process.env.RZP_SUBSCRIPTION_PLAN_ID;
  if (!plan_id) {
    throw new Error("Plan id not found", 404);
  }

  // Ensure a valid quantity; fallback to organization's configured count or 1
  const normalizedQuantity = Number(quantity) && Number(quantity) > 0
    ? Number(quantity)
    : (Number(organization?.employeeCount) > 0 ? Number(organization.employeeCount) : 1);

  let subscription;
  try {
    subscription = await instance.subscriptions.create({
      plan_id,
      customer_notify: 1,
      total_count: 240,
      quantity: normalizedQuantity,
    });
  } catch (err) {
    console.error('Razorpay create subscription error:', err?.message || err);
    throw new Error(err?.message || 'Failed to create subscription');
  }

  // console.log(subscription);

  const createdSubscription = await subscriptionModel.create({
    razorpaySubscriptionId: subscription.id,
    startDate: subscription.start_at,
    endDate: subscription.end_at,
    status: subscription.status,
    // payment_status: "pending",
  });

  account.subscription = createdSubscription._id;
  account.account_type = "subscription";
  account.account_name = "Monthly Plan";
  await account.save();

  res.status(200).json({
    status: 200,
    success: true,
    subscription_id: subscription.id,
  });
});

const paymentVerfication = TryCatch(async (req, res) => {
  const { razorpay_payment_id, razorpay_signature } = req.body;

  const account = await accountModel.findOne({
    organization: req?.organization?.id,
  });
  if (!account) {
    throw new Error("Account not found", 404);
  }
  const subscription = await subscriptionModel.findById(account?.subscription);
  if (!subscription) {
    throw new Error("Subscription not found", 404);
  }

  const subscription_id = subscription.razorpaySubscriptionId;
  //   const subscription_id = "sub_P6u63fA26YKNql";
  const generated_signature = crypto
    .createHmac("sha256", process.env.RZP_KEY_SECRET)
    .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
    .digest("hex");

  const isAuthentic = generated_signature === razorpay_signature;
  if (!isAuthentic) {
    throw new Error("Payment verification failed", 400);
  }

  // Check if payment actually exists and is successful
  try {
    const payment = await instance.payments.fetch(razorpay_payment_id);
    
    // If payment is only authorized in sandbox, capture it now
    if (payment?.status === 'authorized' && payment?.captured === false) {
      try {
        await instance.payments.capture(razorpay_payment_id, payment.amount);
      } catch (capErr) {
        console.error('Payment capture error:', capErr);
        throw new Error('Payment authorized but capture failed');
      }
    }

    // Re-fetch to confirm final status post capture attempt
    const verifiedPayment = await instance.payments.fetch(razorpay_payment_id);

    // Check if payment is actually captured/successful
    const isCaptured = verifiedPayment?.status === 'captured' && verifiedPayment?.captured === true;
    const hasError = Boolean(verifiedPayment?.error_code) || Boolean(verifiedPayment?.error_description);
    if (!isCaptured || hasError) {
      const status = verifiedPayment?.status || 'unknown';
      const err = verifiedPayment?.error_description || verifiedPayment?.error_code || 'uncaptured payment';
      throw new Error(`Payment failed. Status: ${status}. ${err}`);
    }

    // Only proceed if payment is successful
    subscription.razorpayPaymentId = razorpay_payment_id;
    subscription.status = 'active';
    
    // Update endDate if not set or if it's in the past
    // For monthly subscription, set endDate to 30 days from startDate or payment date
    if (!subscription.endDate || new Date(subscription.endDate) <= new Date()) {
      const startDate = subscription.startDate 
        ? new Date(subscription.startDate)
        : subscription.createdAt 
        ? new Date(subscription.createdAt)
        : new Date();
      
      // Set endDate to 30 days from startDate for monthly plan
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);
      subscription.endDate = endDate;
    }
    
    // If startDate is not set, set it to current date
    if (!subscription.startDate) {
      subscription.startDate = new Date();
    }
    
    await subscription.save();

    await accountModel.findOneAndUpdate(
      {
        subscription: subscription._id,
      },
      {
        account_status: "active",
      }
    );

    res.status(200).json({
      status: 200,
      success: true,
      razorpay_payment_id,
      message: "Payment successful",
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    throw new Error(`Payment verification failed: ${error.message}`);
  }
});

const cancelSubscription = TryCatch(async (req, res) => {
  const account = await accountModel.findOne({
    organization: req.organization.id,
  });
  if (!account) {
    throw new Error("Account not found", 404);
  }
  const subscription = await subscriptionModel.findById(account?.subscription);
  if (!subscription) {
    throw new Error("Subscription not found", 404);
  }

  await instance.subscriptions.cancel(subscription.razorpaySubscriptionId);
  await subscription.deleteOne();
  account.subscription = undefined;
  account.account_status = "inactive";
  account.account_name = "Trial Plan";
  account.account_type = "trial";
  await account.save();

  res.status(200).json({
    status: 200,
    success: true,
    message: "Your subscription has been cancelled successfully",
  });
});

const webhookHandler = async (req, res) => {
  const event = req.body.event;
  const payload = req.body.payload;

  // subscription.cancelled;
  // payment.authorized;
  // payment.captured;
  // subscription.authenticated;
  // subscription.activated;
  // subscription.charged;

  // console.log(event);

  if (event === "payment.captured" || event === "payment.failed") {
    const razorpayPaymentId = payload.payment.entity.id;
    const customerEmail = payload.payment.entity.email;

    const customer = await organizationModel.findOne({ email: customerEmail });
    if (!customer) {
      return res.status(400).json({});
    }
    const customerAccount = await accountModel.findOne({
      organization: customer._id,
    });
    if (!customerAccount) {
      return res.status(400).json({});
    }
    const subscription = await subscriptionModel.findById(
      customerAccount.subscription
    );
    if (!subscription) {
      return res.status(400).json({});
    }

    subscription.status = payload.payment.entity.status;
    await subscription.save();

    const payment = await subscriptionPaymentModel.create({
      subscription: subscription._id,
      razaorpayPaymentId: payload.payment.entity.id,
      amount: payload.payment.entity.amount / 100,
      status: payload.payment.entity.status,
      captured: payload.payment.entity.captured,
      orderId: payload.payment.entity.order_id,
      invoiceId: payload.payment.entity.invoice_id,
      method: payload.payment.entity.method,
      email: payload.payment.entity.email,
      fee: payload.payment.entity.fee / 100,
      tax: payload.payment.entity.tax / 100,
      error_code: payload.payment.entity.error_code,
      error_description: payload.payment.entity.error_description,
      razorpayCreatedAt: payload.payment.entity.created_at,
    });
  } else if (
    event === "subscription.activated" ||
    event === "subscription.paused" ||
    event === "subscription.resumed" ||
    event === "subscription.activated" ||
    event === "subscription.pending" ||
    event === "subscription.halted" ||
    event === "subscription.cancelled"
  ) {
    const subscriptionId = payload.subscription.entity.id;

    const subscription = await subscriptionModel.findOne({
      razorpaySubscriptionId: subscriptionId,
    });
    if (!subscription) {
      return res.status(200).json({});
    }

    if (event === "subscription.halted") {
      await accountModel.findOneAndUpdate(
        {
          subscription: subscription._id,
        },
        {
          $unset: { subscription: "" },
          $set: { account_status: "inactive" },
        }
      );
      await subscription.deleteOne();
    } else if (event === "subscription.activated") {
      await accountModel.findOneAndUpdate(
        {
          subscription: subscription._id,
        },
        {
          $set: { account_status: "active" },
        }
      );
      await subscription.deleteOne();
    } else {
      subscription.status = payload.subscription.entity.status;
      await subscription.save();
    }
  }

  res.status(200).json({});
};

const planDetails = TryCatch(async (req, res) => {
  const { plan_id } = req.body;

  const plan = await instance.plans.fetch(plan_id);

  res.status(200).json({
    success: true,
    status: 200,
    plan,
  });
});

module.exports = {
  getRazorpayKey,
  createSubscription,
  paymentVerfication,
  cancelSubscription,
  webhookHandler,
  planDetails,
};
