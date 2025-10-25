// models/SMSLog.js
const mongoose = require('mongoose');

const SMSLogSchema = new mongoose.Schema({
    mobiles: {
        type: [String],
        required: true,
    },
    name:{
        type: [String],
        required: true,
    },
    templateId: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    senderId: {
        type: String,
        required: true,
    },
    entityId: {
        type: String,
        required: true,
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization', // Assuming you have an Organization model
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('SMSLog', SMSLogSchema);