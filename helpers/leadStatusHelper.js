const leadsStatus = require("../models/leadsStatus");


async function insertDefaultLeadStatuses(orgId) {
    const defaultStatuses = [
        "New",
        "Assigned",
        "Follow Up",
        "Meeting Scheduled",
        "Meeting Completed",
        "In Negotiation",
        "Deal on Hold",
        "Deal Won",
        "Deal Lost",
        "Deal Done",
    ];

    for (const st of defaultStatuses) {
        const exists = await leadsStatus.findOne({ status: st, organization: orgId });
        if (!exists) {
            await leadsStatus.create({
                status: st,
                isDefault: true,
                organization: orgId
            });
        }
    }
}

module.exports = { insertDefaultLeadStatuses };
