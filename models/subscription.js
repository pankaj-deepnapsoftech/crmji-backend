const mongoose = require('mongoose');

const subscriptionSchema = mongoose.Schema({
    razorpaySubscriptionId: {
        type: String,
        required: [true, "razorpaySubscriptionId is a required field"]
    },
    startDate: {
        type: Date,
        // required: [true, 'startDate is a required field']
    },
    endDate: {
        type: Date,
        // required: [true, 'endDate is a required field']
    },
    status: {
        type: String,
    },
    amount: {
        type: Number,
        // required: [true, 'amount is a required field']
    },
    // payment_status: {
    //     type: String,
    //     enum: ["pending", "success", 'failed', 'expired'],
    //     required: [true, "payment_status is a required field"]
    // },
    razorpayPaymentId: {
        type: String,
        // required: [true, 'razorpayPaymentId is a required field']
    }
}, {
    timestamps: true
});

const subscriptionModel = mongoose.model('Subscription', subscriptionSchema);

module.exports = subscriptionModel;