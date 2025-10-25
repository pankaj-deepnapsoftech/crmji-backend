const {TryCatch} = require('../../helpers/error');
const Setting = require('../../models/setting');

exports.editCompanySettings = TryCatch(async (req, res)=>{
    const company = req.body;
    if(!company){
        throw new Error('No field provided', 400);
    }

    await Setting.findOneAndUpdate({organization: req.user.organization, creator: req.user.id}, {...company});

    res.status(200).json({
        status: 200,
        success: true,
        message: "Settings has been updated successfully"
    })
});

exports.getCompanySettings = TryCatch(async (req, res)=>{
    const setting = await Setting.findOne({organization: req.user.organization, creator: req.user.id});
    if(!setting){
        throw new Error('Settings not found', 404);
    }

    res.status(200).json({
        success: true,
        status: 200,
        ...setting._doc
    })
})