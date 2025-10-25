const RazorPay = require('razorpay');

module.exports = new RazorPay({
    key_id: process.env.RZP_KEY_ID,
    key_secret: process.env.RZP_KEY_SECRET,
})  
