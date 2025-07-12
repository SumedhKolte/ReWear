const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateListing } = require('../middleware/validation');

// Public routes (no authentication required)
router.get('/search', listingController.searchListings);
router.get('/trending', listingController.getTrending);
router.get('/recent', listingController.getRecent);
router.get('/:id/public', listingController.getListingById);

// Protected routes (authentication required)
router.get('/', auth, listingController.getUserListings);
router.get('/available', auth, listingController.getAvailableListings);
router.get('/overview', auth, listingController.getListingsOverview);
router.post('/calculate-price', auth, listingController.calculatePrice);
router.post('/', auth, upload.single('image'), validateListing, listingController.createListing);
router.put('/:id', auth, upload.single('image'), validateListing, listingController.updateListing);
router.delete('/:id', auth, listingController.deleteListing);

// NEW ROUTE: Increment view count
router.patch('/:id/views', listingController.incrementViews);

module.exports = router;
