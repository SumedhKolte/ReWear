const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const config = require('../config');

// Import API routes
const apiRoutes = require('./api');

// API Documentation route
router.get('/', (req, res) => {
  const appConfig = config.get();
  
  res.json({
    success: true,
    message: 'Items Search API',
    version: appConfig.app.version,
    environment: appConfig.app.env,
    timestamp: new Date().toISOString(),
    endpoints: {
      search: {
        'GET /api/search': 'Search items with query and filters',
        'POST /api/search/advanced': 'Advanced search with complex filters',
        'GET /api/suggestions': 'Get search suggestions/autocomplete',
        'GET /api/suggestions/trending': 'Get trending search terms',
        'GET /api/suggestions/popular': 'Get popular search terms'
      },
      categories: {
        'GET /api/categories': 'Get all categories with counts',
        'GET /api/types': 'Get types for a category'
      },
      items: {
        'POST /api/items': 'Create new item (auth required)',
        'GET /api/items/:itemId': 'Get item by ID',
        'PUT /api/items/:itemId': 'Update item (auth + ownership required)',
        'DELETE /api/items/:itemId': 'Delete item (auth + ownership required)',
        'GET /api/users/:uploaderId/items': 'Get items by uploader (auth required)',
        'POST /api/items/:itemId/images': 'Upload item images (auth + ownership required)'
      },
      health: {
        'GET /api/health': 'Basic health check',
        'GET /api/health/detailed': 'Detailed health check (admin only)',
        'GET /api/health/ready': 'Readiness probe',
        'GET /api/health/live': 'Liveness probe'
      },
      admin: {
        'GET /api/analytics/search': 'Search analytics (admin only)',
        'DELETE /api/cache/search': 'Clear search cache (admin only)',
        'DELETE /api/cache/all': 'Clear all cache (admin only)'
      },
      internal: {
        'GET /api/internal/search': 'Internal search API (API key required)',
        'GET /api/internal/health': 'Internal health check (API key required)'
      }
    },
    authentication: {
      jwt: 'Bearer token in Authorization header',
      apiKey: 'X-API-Key header for internal endpoints'
    },
    rateLimit: {
      global: '1000 requests per 15 minutes',
      search: '50 requests per 5 minutes per user',
      suggestions: '100 requests per 5 minutes per user',
      itemCreation: '10 requests per minute per user'
    }
  });
});

// Mount API routes
router.use('/api', apiRoutes);

// Health check at root level for load balancers
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Robots.txt for web crawlers
router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Disallow: /api/
Disallow: /internal/
Allow: /health
Allow: /`);
});

// Favicon handler to prevent 404s
router.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Global 404 handler for non-API routes
router.use('*', (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Check if it's an API request
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      code: 'API_ENDPOINT_NOT_FOUND',
      timestamp: new Date().toISOString()
    });
  }

  // For non-API requests, return HTML or redirect
  res.status(404).json({
    success: false,
    error: 'Page not found',
    code: 'PAGE_NOT_FOUND',
    message: 'This is an API server. Please check the documentation at /',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
