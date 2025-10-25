const mongoose = require("mongoose");

// id: 'pay_P7EVlv7OpkEoUD',
// entity: 'payment',
// amount: 500000,
// currency: 'INR',
// status: 'captured',
// order_id: 'order_P7EVWmUXijI6TP',
// invoice_id: 'inv_P7EVWfqgFpM6p3',
// international: false,
// method: 'upi',
// amount_refunded: 0,
// amount_transferred: 0,
// refund_status: null,
// captured: '1',
// description: 'Test Transaction',
// card_id: null,
// bank: null,
// wallet: null,
// vpa: 'success@razorpay',
// email: 'mjha199402@gmail.com',
// contact: '+919898787878',
// customer_id: null,
// token_id: 'token_P7EVmK5ze2jsgV',
// notes: [Object],
// fee: 11800,
// tax: 1800,
// error_code: null,
// error_description: null,
// acquirer_data: [Object],
// created_at: 1728541052
// }

const paymentSchema = mongoose.Schema(
  {
    subscription: {
      type: mongoose.Types.ObjectId,
      ref: "Subscription",
      required: [true, "subscription is a required field"],
    },
    razaorpayPaymentId: {
      type: String,
    },
    amount: {
      type: Number,
    },
    status: {
      type: String,
    },
    captured: {
      type: String,
    },
    orderId: {
      type: String,
    },
    invoiceId: {
      type: String,
    },
    invoiceId: {
      type: String,
    },
    method: {
      type: String,
    },
    email: {
      type: String,
    },
    fee: {
      type: Number,
    },
    tax: {
      type: Number,
    },
    error_code: {
      type: String,
    },
    error_description: {
      type: String,
    },
    razorpayCreatedAt: {
        type: String
    }
  },
  { timestamps: true }
);

const subscriptionPaymentModel = mongoose.model("Subscription Payment", paymentSchema);
module.exports = subscriptionPaymentModel;
