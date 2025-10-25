const express = require('express');
const { createPeople, editPeople, deletePeople, personDetails, allPersons, OtpVerification, ResendOTP, VerifyedPeople, SendBulkEmailVerifiedUser, getAllEmailSentData, getAllWhatsappSentData } = require('../../controllers/people/controller');
const { createPeopleValidator, validateHandler, editPeopleValidator, deletePeopleValidator, peopleDetailsValidator } = require('../../validators/people/validator');
const { checkAccess } = require('../../helpers/checkAccess');
const router = express.Router();

router.post('/create-people', checkAccess, createPeopleValidator(), validateHandler, createPeople);
router.post('/edit-people', checkAccess, editPeopleValidator(), validateHandler, editPeople);
router.post('/delete-people', checkAccess, deletePeopleValidator(), validateHandler, deletePeople);
router.post('/person-details', checkAccess, peopleDetailsValidator(), validateHandler, personDetails);
router.post('/all-persons', allPersons);
router.patch("/verify-people/:id",checkAccess, OtpVerification);
router.post("/resend-otp/:id",checkAccess, ResendOTP);
router.get("/verified-peoples",VerifyedPeople)
router.post("/send-bulk-mail",SendBulkEmailVerifiedUser)
router.get("/get-bulk-mail",getAllEmailSentData);
router.get("/get-bulk-whatsapp",getAllWhatsappSentData);

module.exports = router;