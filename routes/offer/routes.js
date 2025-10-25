const express = require('express');
const { createOffer, getAllOffers, deleteOffer, editOffer, getOfferDetails, downloadOffer } = require('../../controllers/offer/controller');
const { createOfferValidator, validateHandler, editOfferValidator, deleteOfferValidator, offerDetailsValidator, downloadOfferValidator } = require('../../validators/offer/validator');
const { checkAccess } = require('../../helpers/checkAccess');
const router = express.Router();

router.post('/create-offer', checkAccess, createOfferValidator(), validateHandler, createOffer);
router.post('/all-offers', getAllOffers);
router.post('/delete-offer', checkAccess, deleteOfferValidator(), validateHandler, deleteOffer);
router.post('/edit-offer', checkAccess, editOfferValidator(), validateHandler, editOffer);
router.post('/offer-details', checkAccess, offerDetailsValidator(), validateHandler, getOfferDetails);
router.post('/download-offer', checkAccess, downloadOfferValidator(), validateHandler, downloadOffer);

module.exports = router;
