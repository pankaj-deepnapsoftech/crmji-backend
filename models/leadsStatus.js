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

// Ensure correct compound unique index
leadStatusSchema.index({ status: 1, organization: 1 }, { unique: true });

// Drop legacy single-field unique index if it exists to avoid conflicts
let droppedLegacyIndexPromise;
leadStatusSchema.pre("save", async function(next) {
    try {
        if (!this.constructor?.collection) return next();
        if (!droppedLegacyIndexPromise) {
            droppedLegacyIndexPromise = (async () => {
                try {
                    const exists = await this.constructor.collection.indexExists("status_1");
                    if (exists) {
                        await this.constructor.collection.dropIndex("status_1");
                    }
                } catch (err) {
                    if (err.codeName !== "IndexNotFound") {
                        console.error("Failed to drop legacy status_1 index on leadstatuses", err);
                    }
                }
            })();
        }
        await droppedLegacyIndexPromise;
        return next();
    } catch (e) {
        return next(e);
    }
});

module.exports = mongoose.model("LeadStatus", leadStatusSchema);

