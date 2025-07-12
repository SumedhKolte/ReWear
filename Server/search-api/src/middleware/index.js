const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');

const auth = require('./auth');
const validation = require('./validation');
const logger = require('../utils/logger');
const config = require('../config');
const { HTTP_STATUS } = require('../utils');

class MiddlewareManager {
  constructor() {
    this.config = config.get();
  }

  /**
   * Setup basic security middleware
   */
  setupSecurity(app) {
    // Helmet for security headers
    if (this.config.security.helmetEnabled) {
      app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        crossOriginEmbedderPolicy: false
      }));
    }

    // CORS configuration
    app.use(cors({
      origin: this.config.security.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With']
    }));

    // Compression
    if (this.config.security.compressionEnabled) {
      app.use(compression());
    }

    // Body parsing
    app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy for accurate IP addresses
    app.set('trust proxy', 1);
  }

  /**
   * Setup logging middleware
   */
  setupLogging(app) {
    // Custom morgan format for structured logging
    const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';
    
    app.use(morgan(morganFormat, {
      stream: {
        write: (message) => {
          logger.info(message.trim(), { type: 'http_request' });
        }
      }
    }));

    // Request ID middleware
    app.use((req, res, next) => {
      req.requestId = this.generateRequestId();
      res.setHeader('X-Request-ID', req.requestId);
      next();
    });
  }

  /**
   * Setup rate limiting
   */
  setupRateLimiting(app) {
    // Global rate limiting
    const globalLimiter = rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.maxRequests,
      message: {
        success: false,
        error: 'Too many requests from this IP',
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl
        });

        res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
          success: false,
          error: 'Too many requests from this IP',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(this.config.rateLimit.windowMs / 1000),
          timestamp: new Date().toISOString()
        });
      }
    });

    app.use('/api/', globalLimiter);

    // Stricter rate limiting for search endpoints
    const searchLimiter = rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 200, // 200 requests per 5 minutes
      message: {
        success: false,
        error: 'Too many search requests',
        code: 'SEARCH_RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString()
      }
    });

    app.use('/api/search', searchLimiter);
    app.use('/api/suggestions', searchLimiter);
  }

  /**
   * Error handling middleware
   */
  errorHandler(err, req, res, next) {
    // Log the error
    logger.error('Request error', {
      error: err.message,
      stack: err.stack,
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.details || err.message,
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    }

    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        error: 'Service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    }

    if (err.code && err.code.startsWith('23')) { // PostgreSQL constraint violations
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Database constraint violation',
        code: 'CONSTRAINT_VIOLATION',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    }

    if (err.code === 'ETIMEDOUT') {
      return res.status(HTTP_STATUS.GATEWAY_TIMEOUT).json({
        success: false,
        error: 'Request timeout',
        code: 'TIMEOUT',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Default error response
    const statusCode = err.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  /**
   * 404 handler
   */
  notFoundHandler(req, res) {
    logger.warn('Route not found', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      error: `Route ${req.originalUrl} not found`,
      code: 'ROUTE_NOT_FOUND',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Request timeout middleware
   */
  requestTimeout(timeout = 30000) {
    return (req, res, next) => {
      req.setTimeout(timeout, () => {
        const err = new Error('Request timeout');
        err.code = 'ETIMEDOUT';
        err.status = HTTP_STATUS.GATEWAY_TIMEOUT;
        next(err);
      });
      next();
    };
  }

  /**
   * Request size limiter
   */
  requestSizeLimiter(maxSize = '10mb') {
    return (req, res, next) => {
      const contentLength = parseInt(req.get('content-length') || '0');
      const maxBytes = this.parseSize(maxSize);

      if (contentLength > maxBytes) {
        return res.status(HTTP_STATUS.PAYLOAD_TOO_LARGE).json({
          success: false,
          error: 'Request payload too large',
          code: 'PAYLOAD_TOO_LARGE',
          maxSize,
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  }

  // Helper methods
  generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  parseSize(size) {
    const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    
    return Math.floor(value * units[unit]);
  }
}

const middlewareManager = new MiddlewareManager();

module.exports = {
  // Auth middleware
  auth,
  
  // Validation middleware
  validation,
  
  // Middleware manager
  middlewareManager,
  
  // Individual middleware functions
  verifyToken: auth.verifyToken.bind(auth),
  optionalAuth: auth.optionalAuth.bind(auth),
  requireRole: auth.requireRole.bind(auth),
  requirePermission: auth.requirePermission.bind(auth),
  requireOwnership: auth.requireOwnership.bind(auth),
  verifyApiKey: auth.verifyApiKey.bind(auth),
  userRateLimit: auth.userRateLimit.bind(auth),
  
  // Validation functions
  validateSearchQuery: validation.validateSearchQuery.bind(validation),
  validateSuggestionsQuery: validation.validateSuggestionsQuery.bind(validation),
  validateItemCreation: validation.validateItemCreation.bind(validation),
  validateItemUpdate: validation.validateItemUpdate.bind(validation),
  validateUUIDParam: validation.validateUUIDParam.bind(validation),
  validatePagination: validation.validatePagination.bind(validation),
  validateDateRange: validation.validateDateRange.bind(validation),
  sanitizeContent: validation.sanitizeContent.bind(validation),
  validateFileUpload: validation.validateFileUpload.bind(validation),
  
  // Error handlers
  errorHandler: middlewareManager.errorHandler.bind(middlewareManager),
  notFoundHandler: middlewareManager.notFoundHandler.bind(middlewareManager),
  requestTimeout: middlewareManager.requestTimeout.bind(middlewareManager),
  requestSizeLimiter: middlewareManager.requestSizeLimiter.bind(middlewareManager)
};
