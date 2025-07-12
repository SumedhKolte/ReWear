const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateListing } = require('../middleware/validation');

// Check that all these functions exist in your controller
console.log('Available controller methods:', Object.keys(listingController));

// Make sure these functions are defined in your controller
router.get('/', auth, listingController.getUserListings);
router.get('/available', auth, listingController.getAvailableListings);
router.get('/overview', auth, listingController.getListingsOverview); // This might be missing
router.post('/calculate-price', auth, listingController.calculatePrice);
router.post('/', auth, upload.single('image'), validateListing, listingController.createListing);
router.put('/:id', auth, upload.single('image'), validateListing, listingController.updateListing);
router.delete('/:id', auth, listingController.deleteListing);
router.patch('/:id/views', listingController.incrementViews);

module.exports = router;
