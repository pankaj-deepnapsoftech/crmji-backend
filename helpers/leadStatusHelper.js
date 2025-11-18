const leadsStatus = require("../models/leadsStatus");


async function insertDefaultLeadStatuses(orgId) {
    // One-time migration: drop legacy unique index on { status: 1 }
    try {
        if (leadsStatus?.collection) {
            const exists = await leadsStatus.collection.indexExists("status_1");
            if (exists) {
                await leadsStatus.collection.dropIndex("status_1");
            }
        }
    } catch (e) {
        if (e.codeName !== "IndexNotFound") {
            console.error("Failed dropping legacy status_1 index:", e.message);
        }
    }

    const defaultStatuses = [
        "New",
        "Assigned",
        "Follow Up",
        "Meeting Scheduled",
        // "Meeting Completed",
        // "In Negotiation",
        // "Deal on Hold",
        // "Deal Won",
        // "Deal Lost",
        // "Deal Done",
        "Customer Occupied",
        "Not Connected",
        "Call Occupied",
        "Not Interested",

    ];

    for (const st of defaultStatuses) {
        try {
            await leadsStatus.updateOne(
                { status: st, organization: orgId },
                {
                    $setOnInsert: {
                        status: st,
                        isDefault: true,
                        organization: orgId,
                    },
                },
                { upsert: true }
            );
        } catch (err) {
            // Ignore duplicate key errors if index exists differently in DB
            if (err && (err.code === 11000 || err.name === 'MongoServerError')) {
                continue;
            }
            throw err;
        }
    }
}

module.exports = { insertDefaultLeadStatuses };
