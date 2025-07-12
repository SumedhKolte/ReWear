const Swap = require('../models/Swap');
const Listing = require('../models/Listing');
const User = require('../models/User');
const PriceCalculatorService = require('../services/priceCalculatorService');

const swapController = {
  async calculateSwapComparison(req, res) {
    try {
      const { initiatorListingId, receiverListingId } = req.body;

      const initiatorListing = await Listing.findById(initiatorListingId);
      const receiverListing = await Listing.findById(receiverListingId);

      if (!initiatorListing || !receiverListing) {
        return res.status(404).json({ error: 'One or both listings not found' });
      }

      const comparison = PriceCalculatorService.calculateSwapComparison(
        initiatorListing, 
        receiverListing
      );

      res.json({
        success: true,
        data: {
          initiatorListing: {
            id: initiatorListing.id,
            title: initiatorListing.title,
            image: initiatorListing.image_url,
            value: comparison.initiatorValue
          },
          receiverListing: {
            id: receiverListing.id,
            title: receiverListing.title,
            image: receiverListing.image_url,
            value: comparison.receiverValue
          },
          comparison
        }
      });
    } catch (error) {
      console.error('Swap comparison error:', error);
      res.status(500).json({ error: 'Failed to calculate swap comparison' });
    }
  },

  async createSwapRequest(req, res) {
    try {
      const {
        receiverListingId,
        initiatorListingId,
        message
      } = req.body;

      const initiatorListing = await Listing.findById(initiatorListingId);
      const receiverListing = await Listing.findById(receiverListingId);

      if (!initiatorListing || !receiverListing) {
        return res.status(404).json({ error: 'One or both listings not found' });
      }

      if (initiatorListing.user_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only swap your own items' });
      }

      if (receiverListing.user_id === req.user.id) {
        return res.status(400).json({ error: 'You cannot swap with yourself' });
      }

      const comparison = PriceCalculatorService.calculateSwapComparison(
        initiatorListing, 
        receiverListing
      );

      const swap = await Swap.create({
        initiatorId: req.user.id,
        receiverId: receiverListing.user_id,
        initiatorListingId,
        receiverListingId,
        initiatorItemValue: comparison.initiatorValue,
        receiverItemValue: comparison.receiverValue,
        priceDifference: comparison.priceDifference,
        extraPaymentRequired: comparison.extraPayment,
        paymentDirection: comparison.paymentDirection,
        initiatorMessage: message
      });

      res.status(201).json({
        success: true,
        message: 'Swap request created successfully',
        data: swap
      });
    } catch (error) {
      console.error('Create swap error:', error);
      res.status(500).json({ error: 'Failed to create swap request' });
    }
  },

  async getUserSwaps(req, res) {
    try {
      const { type = 'all' } = req.query; // all, initiated, received
      const swaps = await Swap.findByUserId(req.user.id, type);
      
      res.json({
        success: true,
        data: swaps
      });
    } catch (error) {
      console.error('Get swaps error:', error);
      res.status(500).json({ error: 'Failed to fetch swaps' });
    }
  },

  async respondToSwap(req, res) {
    try {
      const { id } = req.params;
      const { action, response } = req.body; // action: 'accept' or 'reject'

      const swap = await Swap.findById(id);
      if (!swap) {
        return res.status(404).json({ error: 'Swap not found' });
      }

      if (swap.receiver_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only respond to swaps directed to you' });
      }

      if (swap.status !== 'pending') {
        return res.status(400).json({ error: 'This swap has already been responded to' });
      }

      const newStatus = action === 'accept' ? 'accepted' : 'rejected';
      const updatedSwap = await Swap.updateStatus(id, newStatus, response);

      // If accepted and payment required, create payment record
      if (action === 'accept' && swap.extra_payment_required > 0) {
        const payerId = swap.payment_direction === 'initiator_pays' ? swap.initiator_id : swap.receiver_id;
        const receiverId = swap.payment_direction === 'initiator_pays' ? swap.receiver_id : swap.initiator_id;
        
        await Swap.createPayment({
          swapId: id,
          payerId,
          receiverId,
          amount: swap.extra_payment_required,
          paymentMethod: 'wallet'
        });
      }

      res.json({
        success: true,
        message: `Swap ${action}ed successfully`,
        data: updatedSwap
      });
    } catch (error) {
      console.error('Respond to swap error:', error);
      res.status(500).json({ error: 'Failed to respond to swap' });
    }
  },

  async completeSwap(req, res) {
    try {
      const { id } = req.params;
      
      const swap = await Swap.findById(id);
      if (!swap) {
        return res.status(404).json({ error: 'Swap not found' });
      }

      if (swap.initiator_id !== req.user.id && swap.receiver_id !== req.user.id) {
        return res.status(403).json({ error: 'You are not part of this swap' });
      }

      if (swap.status !== 'accepted') {
        return res.status(400).json({ error: 'Swap must be accepted before completion' });
      }

      // Process payment if required
      if (swap.extra_payment_required > 0) {
        const payerId = swap.payment_direction === 'initiator_pays' ? swap.initiator_id : swap.receiver_id;
        const receiverId = swap.payment_direction === 'initiator_pays' ? swap.receiver_id : swap.initiator_id;
        
        // Deduct from payer's wallet
        await User.updateWalletBalance(payerId, -swap.extra_payment_required);
        
        // Add to receiver's wallet
        await User.updateWalletBalance(receiverId, swap.extra_payment_required);
      }

      const updatedSwap = await Swap.updateStatus(id, 'completed');

      res.json({
        success: true,
        message: 'Swap completed successfully',
        data: updatedSwap
      });
    } catch (error) {
      console.error('Complete swap error:', error);
      res.status(500).json({ error: 'Failed to complete swap' });
    }
  }
};

module.exports = swapController;
