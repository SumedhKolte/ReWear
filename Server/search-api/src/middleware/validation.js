const { body, query, param, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils');

class ValidationMiddleware {
  constructor() {
    this.maxQueryLength = parseInt(process.env.SEARCH_MAX_QUERY_LENGTH) || 500;
    this.maxResultsPerPage = parseInt(process.env.SEARCH_MAX_RESULTS_PER_PAGE) || 100;
    this.maxTags = parseInt(process.env.ITEMS_MAX_TAGS) || 20;
    this.maxImages = parseInt(process.env.ITEMS_MAX_IMAGES) || 10;
    this.validStatuses = ['Available', 'Swapped', 'Pending'];
    this.validSortOptions = ['relevance', 'newest', 'oldest', 'title', 'category'];
  }

  /**
   * Handle validation errors
   */
  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      logger.warn('Validation failed', {
        errors: formattedErrors,
        endpoint: req.originalUrl,
        method: req.method,
        body: req.body,
        query: req.query
      });

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
        timestamp: new Date().toISOString()
      });
    }

    next();
  }

  /**
   * Search query validation
   */
  validateSearchQuery() {
    return [
      query('q')
        .notEmpty()
        .withMessage('Query parameter is required')
        .isLength({ min: 1, max: this.maxQueryLength })
        .withMessage(`Query must be between 1 and ${this.maxQueryLength} characters`)
        .trim()
        .escape(),

      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),

      query('limit')
        .optional()
        .isInt({ min: 1, max: this.maxResultsPerPage })
        .withMessage(`Limit must be between 1 and ${this.maxResultsPerPage}`)
        .toInt(),

      query('category')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Category must be between 1 and 100 characters')
        .trim()
        .escape(),

      query('type')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Type must be between 1 and 100 characters')
        .trim()
        .escape(),

      query('condition')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Condition must be between 1 and 50 characters')
        .trim()
        .escape(),

      query('status')
        .optional()
        .isIn(this.validStatuses)
        .withMessage(`Status must be one of: ${this.validStatuses.join(', ')}`),

      query('uploaderId')
        .optional()
        .isUUID()
        .withMessage('UploaderId must be a valid UUID'),

      query('tags')
        .optional()
        .custom((value) => {
          if (typeof value === 'string') {
            const tags = value.split(',').map(tag => tag.trim());
            if (tags.length > this.maxTags) {
              throw new Error(`Maximum ${this.maxTags} tags allowed`);
            }
            return true;
          }
          return true;
        }),

      query('dateFrom')
        .optional()
        .isISO8601()
        .withMessage('DateFrom must be a valid ISO 8601 date'),

      query('dateTo')
        .optional()
        .isISO8601()
        .withMessage('DateTo must be a valid ISO 8601 date'),

      query('sort')
        .optional()
        .isIn(this.validSortOptions)
        .withMessage(`Sort must be one of: ${this.validSortOptions.join(', ')}`),

      this.handleValidationErrors
    ];
  }

  /**
   * Suggestions query validation
   */
  validateSuggestionsQuery() {
    return [
      query('q')
        .notEmpty()
        .withMessage('Query parameter is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Query must be between 2 and 100 characters')
        .trim()
        .escape(),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
        .toInt(),

      query('category')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Category must be between 1 and 100 characters')
        .trim()
        .escape(),

      this.handleValidationErrors
    ];
  }

  /**
   * Item creation validation
   */
  validateItemCreation() {
    return [
      body('title')
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters')
        .trim()
        .escape(),

      body('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters')
        .trim()
        .escape(),

      body('category')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Category must be between 1 and 100 characters')
        .trim()
        .escape(),

      body('type')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Type must be between 1 and 100 characters')
        .trim()
        .escape(),

      body('size')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Size must be between 1 and 50 characters')
        .trim()
        .escape(),

      body('condition')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Condition must be between 1 and 50 characters')
        .trim()
        .escape(),

      body('tags')
        .optional()
        .isArray({ max: this.maxTags })
        .withMessage(`Maximum ${this.maxTags} tags allowed`)
        .custom((tags) => {
          if (Array.isArray(tags)) {
            for (const tag of tags) {
              if (typeof tag !== 'string' || tag.trim().length === 0 || tag.length > 50) {
                throw new Error('Each tag must be a non-empty string with maximum 50 characters');
              }
            }
          }
          return true;
        }),

      body('images')
        .optional()
        .isArray({ max: this.maxImages })
        .withMessage(`Maximum ${this.maxImages} images allowed`)
        .custom((images) => {
          if (Array.isArray(images)) {
            for (const image of images) {
              if (typeof image !== 'string' || !this.isValidUrl(image)) {
                throw new Error('Each image must be a valid URL');
              }
            }
          }
          return true;
        }),

      body('status')
        .optional()
        .isIn(this.validStatuses)
        .withMessage(`Status must be one of: ${this.validStatuses.join(', ')}`),

      this.handleValidationErrors
    ];
  }

  /**
   * Item update validation
   */
  validateItemUpdate() {
    return [
      param('itemId')
        .isUUID()
        .withMessage('ItemId must be a valid UUID'),

      body('title')
        .optional()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters')
        .trim()
        .escape(),

      body('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters')
        .trim()
        .escape(),

      body('category')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Category must be between 1 and 100 characters')
        .trim()
        .escape(),

      body('type')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Type must be between 1 and 100 characters')
        .trim()
        .escape(),

      body('size')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Size must be between 1 and 50 characters')
        .trim()
        .escape(),

      body('condition')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Condition must be between 1 and 50 characters')
        .trim()
        .escape(),

      body('tags')
        .optional()
        .isArray({ max: this.maxTags })
        .withMessage(`Maximum ${this.maxTags} tags allowed`),

      body('images')
        .optional()
        .isArray({ max: this.maxImages })
        .withMessage(`Maximum ${this.maxImages} images allowed`),

      body('status')
        .optional()
        .isIn(this.validStatuses)
        .withMessage(`Status must be one of: ${this.validStatuses.join(', ')}`),

      this.handleValidationErrors
    ];
  }

  /**
   * UUID parameter validation
   */
  validateUUIDParam(paramName) {
    return [
      param(paramName)
        .isUUID()
        .withMessage(`${paramName} must be a valid UUID`),

      this.handleValidationErrors
    ];
  }

  /**
   * Pagination validation
   */
  validatePagination() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),

      query('limit')
        .optional()
        .isInt({ min: 1, max: this.maxResultsPerPage })
        .withMessage(`Limit must be between 1 and ${this.maxResultsPerPage}`)
        .toInt(),

      this.handleValidationErrors
    ];
  }

  /**
   * Date range validation
   */
  validateDateRange() {
    return [
      query('dateFrom')
        .optional()
        .isISO8601()
        .withMessage('DateFrom must be a valid ISO 8601 date'),

      query('dateTo')
        .optional()
        .isISO8601()
        .withMessage('DateTo must be a valid ISO 8601 date')
        .custom((dateTo, { req }) => {
          if (req.query.dateFrom && dateTo) {
            const from = new Date(req.query.dateFrom);
            const to = new Date(dateTo);
            if (from >= to) {
              throw new Error('DateTo must be after DateFrom');
            }
          }
          return true;
        }),

      this.handleValidationErrors
    ];
  }

  /**
   * Content sanitization
   */
  sanitizeContent(req, res, next) {
    // Remove potentially harmful content
    if (req.body) {
      this.sanitizeObject(req.body);
    }

    if (req.query) {
      this.sanitizeObject(req.query);
    }

    next();
  }

  /**
   * File upload validation
   */
  validateFileUpload() {
    return (req, res, next) => {
      if (!req.files || req.files.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'At least one file is required',
          code: 'NO_FILES_UPLOADED',
          timestamp: new Date().toISOString()
        });
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxFileSize = 5 * 1024 * 1024; // 5MB

      for (const file of req.files) {
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed',
            code: 'INVALID_FILE_TYPE',
            timestamp: new Date().toISOString()
          });
        }

        if (file.size > maxFileSize) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: 'File size too large. Maximum size is 5MB',
            code: 'FILE_TOO_LARGE',
            timestamp: new Date().toISOString()
          });
        }
      }

      next();
    };
  }

  // Helper methods
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  sanitizeObject(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove script tags and other potentially harmful content
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.sanitizeObject(obj[key]);
      }
    }
  }
}

module.exports = new ValidationMiddleware();
