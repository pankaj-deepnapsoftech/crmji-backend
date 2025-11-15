    const mongoose = require("mongoose");

const leadStatusSchema = new mongoose.Schema({
    status: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    organization: {
        type: mongoose.Types.ObjectId,
        ref: "Organization",
        required: true
    }
}, { timestamps: true });

leadStatusSchema.index({ status: 1, organization: 1 }, { unique: true });

module.exports = mongoose.model("LeadStatus", leadStatusSchema);

