const Listing = require('../models/Listing');
const PriceCalculatorService = require('../services/priceCalculatorService');

const listingController = {
  async getUserListings(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const listings = await Listing.findByUserId(req.user.id, limit, offset);
      
      res.json({
        success: true,
        data: listings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: listings.length
        }
      });
    } catch (error) {
      console.error('Get listings error:', error);
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  },

  async getAvailableListings(req, res) {
    try {
      const { category, limit = 20 } = req.query;
      const listings = await Listing.findAvailableForSwap(req.user.id, category, limit);
      
      res.json({
        success: true,
        data: listings
      });
    } catch (error) {
      console.error('Get available listings error:', error);
      res.status(500).json({ error: 'Failed to fetch available listings' });
    }
  },

  async calculatePrice(req, res) {
    try {
      const priceData = PriceCalculatorService.calculatePrice(req.body);
      
      res.json({
        success: true,
        data: priceData
      });
    } catch (error) {
      console.error('Price calculation error:', error);
      res.status(500).json({ error: 'Failed to calculate price' });
    }
  },

  async createListing(req, res) {
    try {
      const {
        title, description, category, subcategory, brand, type, size,
        condition, tags, status, originalPrice, purchaseDate, finalPrice
      } = req.body;

      // Calculate price using the service
      const priceData = PriceCalculatorService.calculatePrice({
        category, brand, originalPrice, purchaseDate, condition
      });

      const listing = await Listing.create({
        userId: req.user.id,
        title,
        description,
        category,
        subcategory,
        brand,
        type,
        size,
        condition,
        tags: Array.isArray(tags) ? tags : JSON.parse(tags || '[]'),
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
        status: status || 'Active',
        originalPrice: parseFloat(originalPrice),
        purchaseDate,
        calculatedPrice: priceData.calculatedPrice,
        finalPrice: parseFloat(finalPrice) || priceData.calculatedPrice,
        priceFactors: priceData.priceFactors
      });

      res.status(201).json({
        success: true,
        message: 'Listing created successfully',
        data: listing
      });
    } catch (error) {
      console.error('Create listing error:', error);
      res.status(500).json({ error: 'Failed to create listing' });
    }
  },

  async updateListing(req, res) {
    try {
      const { id } = req.params;
      const {
        title, description, category, subcategory, brand, type, size,
        condition, tags, status, originalPrice, purchaseDate, finalPrice
      } = req.body;

      // Check if listing belongs to user
      const existingListing = await Listing.findById(id);
      if (!existingListing || existingListing.user_id !== req.user.id) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Recalculate price if pricing factors changed
      const priceData = PriceCalculatorService.calculatePrice({
        category, brand, originalPrice, purchaseDate, condition
      });

      const updatedListing = await Listing.update(id, {
        title,
        description,
        category,
        subcategory,
        brand,
        type,
        size,
        condition,
        tags: Array.isArray(tags) ? tags : JSON.parse(tags || '[]'),
        imageUrl: req.file ? `/uploads/${req.file.filename}` : existingListing.image_url,
        status,
        originalPrice: parseFloat(originalPrice),
        purchaseDate,
        calculatedPrice: priceData.calculatedPrice,
        finalPrice: parseFloat(finalPrice) || priceData.calculatedPrice,
        priceFactors: priceData.priceFactors
      });

      res.json({
        success: true,
        message: 'Listing updated successfully',
        data: updatedListing
      });
    } catch (error) {
      console.error('Update listing error:', error);
      res.status(500).json({ error: 'Failed to update listing' });
    }
  },

  async deleteListing(req, res) {
    try {
      const { id } = req.params;
      
      const deletedListing = await Listing.delete(id, req.user.id);
      if (!deletedListing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      res.json({
        success: true,
        message: 'Listing deleted successfully'
      });
    } catch (error) {
      console.error('Delete listing error:', error);
      res.status(500).json({ error: 'Failed to delete listing' });
    }
  },

  // NEW METHOD: Increment view count
  async incrementViews(req, res) {
    try {
      const { id } = req.params;
      
      // Validate that the listing exists
      const listing = await Listing.findById(id);
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      const result = await Listing.incrementViews(id);
      
      res.json({
        success: true,
        message: 'View count updated successfully',
        data: { 
          views: result.views,
          listingId: id 
        }
      });
    } catch (error) {
      console.error('Increment views error:', error);
      res.status(500).json({ error: 'Failed to update view count' });
    }
  },

  // NEW METHOD: Get listing overview for dashboard
  async getListingsOverview(req, res) {
    try {
      const overview = await Listing.getOverview(req.user.id);
      
      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error('Get listings overview error:', error);
      res.status(500).json({ error: 'Failed to fetch listings overview' });
    }
  },

  // NEW METHOD: Get single listing by ID (for public viewing)
  async getListingById(req, res) {
    try {
      const { id } = req.params;
      const listing = await Listing.findById(id);
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Increment view count when someone views the listing
      await Listing.incrementViews(id);
      
      res.json({
        success: true,
        data: listing
      });
    } catch (error) {
      console.error('Get listing by ID error:', error);
      res.status(500).json({ error: 'Failed to fetch listing' });
    }
  },

  // NEW METHOD: Search listings
  async searchListings(req, res) {
    try {
      const { 
        query, 
        category, 
        minPrice, 
        maxPrice, 
        condition, 
        size, 
        page = 1, 
        limit = 20 
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      const listings = await Listing.search({
        query,
        category,
        minPrice,
        maxPrice,
        condition,
        size,
        limit,
        offset,
        excludeUserId: req.user?.id // Exclude current user's listings if authenticated
      });
      
      res.json({
        success: true,
        data: listings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: listings.length
        }
      });
    } catch (error) {
      console.error('Search listings error:', error);
      res.status(500).json({ error: 'Failed to search listings' });
    }
  }
};

module.exports = listingController;
