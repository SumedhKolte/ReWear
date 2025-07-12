const express = require('express');
const router = express.Router();

// Controllers
const searchController = require('../controllers/searchController');
const healthController = require('../controllers/healthController');

// Middleware
const {
  verifyToken,
  optionalAuth,
  requireRole,
  requireOwnership,
  verifyApiKey,
  userRateLimit,
  validateSearchQuery,
  validateSuggestionsQuery,
  validateItemCreation,
  validateItemUpdate,
  validateUUIDParam,
  validatePagination,
  validateDateRange,
  sanitizeContent,
  validateFileUpload,
  requestTimeout,
  requestSizeLimiter
} = require('../middleware');

const logger = require('../utils/logger');

// Rate limiting for different endpoint types
const searchRateLimit = userRateLimit(50, 5 * 60 * 1000); // 50 requests per 5 minutes
const suggestionRateLimit = userRateLimit(100, 5 * 60 * 1000); // 100 requests per 5 minutes

/**
 * SEARCH ROUTES
 */

// Main search endpoint - public access with optional auth for personalization
router.get('/search',
  requestTimeout(30000),
  sanitizeContent,
  optionalAuth,
  searchRateLimit,
  validateSearchQuery(),
  searchController.searchItems
);

// Advanced search with POST for complex filters - requires authentication
router.post('/search/advanced',
  requestTimeout(45000),
  requestSizeLimiter('1mb'),
  sanitizeContent,
  verifyToken,
  searchRateLimit,
  // Custom validation for advanced search body
  (req, res, next) => {
    const { query, filters = {}, sort = {}, pagination = {}, options = {} } = req.body;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required in request body',
        code: 'MISSING_QUERY',
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate pagination
    if (pagination.page && (!Number.isInteger(pagination.page) || pagination.page < 1)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination page',
        code: 'INVALID_PAGINATION',
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  },
  searchController.advancedSearch
);

/**
 * SUGGESTION ROUTES
 */

// Get search suggestions/autocomplete - public access
router.get('/suggestions',
  requestTimeout(10000),
  sanitizeContent,
  optionalAuth,
  suggestionRateLimit,
  validateSuggestionsQuery(),
  searchController.getItemSuggestions
);

// Get trending search terms - public access
router.get('/suggestions/trending',
  requestTimeout(15000),
  optionalAuth,
  validatePagination(),
  searchController.getTrendingItems
);

// Get popular search terms - public access
router.get('/suggestions/popular',
  requestTimeout(15000),
  optionalAuth,
  validatePagination(),
  searchController.getPopularSuggestions
);

/**
 * CATEGORY & TYPE ROUTES
 */

// Get all categories with counts - public access
router.get('/categories',
  requestTimeout(10000),
  optionalAuth,
  searchController.getCategories
);

// Get types for a specific category - public access
router.get('/types',
  requestTimeout(10000),
  optionalAuth,
  searchController.getTypes
);

/**
 * ITEM MANAGEMENT ROUTES (if needed for your API)
 */

// Create new item - requires authentication
router.post('/items',
  requestTimeout(30000),
  requestSizeLimiter('5mb'),
  sanitizeContent,
  verifyToken,
  userRateLimit(10, 60 * 1000), // 10 items per minute
  validateItemCreation(),
  async (req, res, next) => {
    try {
      // Add uploaderId from authenticated user
      req.body.uploaderId = req.user.id;
      
      // This would typically call an ItemController
      // For now, we'll just acknowledge the request
      res.status(201).json({
        success: true,
        message: 'Item creation endpoint - implement ItemController',
        data: {
          uploaderId: req.user.id,
          ...req.body
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update item - requires authentication and ownership
router.put('/items/:itemId',
  requestTimeout(30000),
  requestSizeLimiter('5mb'),
  sanitizeContent,
  verifyToken,
  validateUUIDParam('itemId'),
  validateItemUpdate(),
  requireOwnership,
  async (req, res, next) => {
    try {
      // This would typically call an ItemController
      res.json({
        success: true,
        message: 'Item update endpoint - implement ItemController',
        data: {
          itemId: req.params.itemId,
          ...req.body
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get item by ID - public access
router.get('/items/:itemId',
  requestTimeout(15000),
  optionalAuth,
  validateUUIDParam('itemId'),
  async (req, res, next) => {
    try {
      // This would typically call an ItemController
      res.json({
        success: true,
        message: 'Get item endpoint - implement ItemController',
        data: {
          itemId: req.params.itemId
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete item - requires authentication and ownership
router.delete('/items/:itemId',
  requestTimeout(15000),
  verifyToken,
  validateUUIDParam('itemId'),
  requireOwnership,
  async (req, res, next) => {
    try {
      // This would typically call an ItemController
      res.json({
        success: true,
        message: 'Item deletion endpoint - implement ItemController',
        data: {
          itemId: req.params.itemId,
          deletedBy: req.user.id
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get items by uploader - requires authentication
router.get('/users/:uploaderId/items',
  requestTimeout(20000),
  verifyToken,
  validateUUIDParam('uploaderId'),
  validatePagination(),
  validateDateRange(),
  async (req, res, next) => {
    try {
      // Check if user can access this uploader's items
      if (req.user.id !== req.params.uploaderId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED',
          timestamp: new Date().toISOString()
        });
      }
      
      // This would typically call an ItemController
      res.json({
        success: true,
        message: 'Get user items endpoint - implement ItemController',
        data: {
          uploaderId: req.params.uploaderId,
          query: req.query
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * FILE UPLOAD ROUTES
 */

// Upload item images - requires authentication
router.post('/items/:itemId/images',
  requestTimeout(60000), // Longer timeout for file uploads
  verifyToken,
  validateUUIDParam('itemId'),
  requireOwnership,
  validateFileUpload(),
  async (req, res, next) => {
    try {
      // This would typically handle file upload to S3/CloudFront
      res.json({
        success: true,
        message: 'Image upload endpoint - implement file upload service',
        data: {
          itemId: req.params.itemId,
          files: req.files?.map(file => ({
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype
          })) || []
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * ANALYTICS ROUTES
 */

// Get search analytics - admin only
router.get('/analytics/search',
  requestTimeout(30000),
  verifyToken,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const { period = '24h', metrics = 'queries,results,performance' } = req.query;
      
      // This would typically call searchController.getSearchAnalytics
      res.json({
        success: true,
        message: 'Search analytics endpoint - implement analytics service',
        data: {
          period,
          metrics: metrics.split(',')
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * CACHE MANAGEMENT ROUTES
 */

// Clear search cache - admin only
router.delete('/cache/search',
  requestTimeout(15000),
  verifyToken,
  requireRole('admin'),
  searchController.clearSearchCache
);

// Clear all cache - admin only
router.delete('/cache/all',
  requestTimeout(30000),
  verifyToken,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      // This would typically call cacheService.clearAll()
      res.json({
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * HEALTH CHECK ROUTES
 */

// Basic health check - public access
router.get('/health',
  requestTimeout(10000),
  healthController.getHealth
);

// Detailed health check - admin only
router.get('/health/detailed',
  requestTimeout(15000),
  verifyToken,
  requireRole('admin'),
  healthController.getDetailedHealth
);

// Readiness probe for Kubernetes - public access
router.get('/health/ready',
  requestTimeout(5000),
  healthController.getReadiness
);

// Liveness probe for Kubernetes - public access
router.get('/health/live',
  requestTimeout(5000),
  healthController.getLiveness
);

/**
 * SERVICE-TO-SERVICE ROUTES
 */

// Internal API for service communication - API key required
router.get('/internal/search',
  requestTimeout(30000),
  verifyApiKey,
  sanitizeContent,
  validateSearchQuery(),
  searchController.searchItems
);

// Internal health check - API key required
router.get('/internal/health',
  requestTimeout(10000),
  verifyApiKey,
  healthController.getDetailedHealth
);

/**
 * ERROR HANDLING FOR UNDEFINED ROUTES
 */
router.use('*', (req, res) => {
  logger.warn('API route not found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    success: false,
    error: `API endpoint ${req.method} ${req.originalUrl} not found`,
    code: 'ENDPOINT_NOT_FOUND',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
