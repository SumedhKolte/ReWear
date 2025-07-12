const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swapController');
const auth = require('../middleware/auth');
const { validateSwapRequest } = require('../middleware/validation');

// Calculate swap comparison
router.post('/calculate', auth, swapController.calculateSwapComparison);

// Create swap request
router.post('/', auth, validateSwapRequest, swapController.createSwapRequest);

// Get user's swaps
router.get('/', auth, swapController.getUserSwaps);

// Respond to swap (accept/reject)
router.patch('/:id/respond', auth, swapController.respondToSwap);

// Complete swap
router.patch('/:id/complete', auth, swapController.completeSwap);

module.exports = router;
