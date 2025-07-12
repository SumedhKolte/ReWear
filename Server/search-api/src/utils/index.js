const crypto = require('crypto');
const { promisify } = require('util');

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// Search Constants
const SEARCH_CONSTANTS = {
  MAX_QUERY_LENGTH: parseInt(process.env.SEARCH_MAX_QUERY_LENGTH) || 500,
  MAX_RESULTS_PER_PAGE: parseInt(process.env.SEARCH_MAX_RESULTS_PER_PAGE) || 100,
  DEFAULT_PAGE_SIZE: parseInt(process.env.SEARCH_DEFAULT_PAGE_SIZE) || 20,
  MIN_SUGGESTION_LENGTH: 2,
  MAX_SUGGESTION_LENGTH: 100,
  DEFAULT_CACHE_TTL: 300, // 5 minutes
  SEARCH_TIMEOUT: 30000, // 30 seconds
  SUGGESTION_TIMEOUT: 10000 // 10 seconds
};

// Items Constants
const ITEMS_CONSTANTS = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_TAGS: parseInt(process.env.ITEMS_MAX_TAGS) || 20,
  MAX_IMAGES: parseInt(process.env.ITEMS_MAX_IMAGES) || 10,
  VALID_STATUSES: ['Available', 'Swapped', 'Pending'],
  VALID_CONDITIONS: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
  MAX_CATEGORY_LENGTH: 100,
  MAX_TYPE_LENGTH: 100,
  MAX_SIZE_LENGTH: 50,
  MAX_CONDITION_LENGTH: 50
};

// Cache Constants
const CACHE_CONSTANTS = {
  TTL: {
    SEARCH: parseInt(process.env.CACHE_TTL_SEARCH) || 300,
    SUGGESTIONS: parseInt(process.env.CACHE_TTL_SUGGESTIONS) || 600,
    CATEGORIES: parseInt(process.env.CACHE_TTL_CATEGORIES) || 3600,
    ITEMS: parseInt(process.env.CACHE_TTL_ITEMS) || 1800,
    HEALTH: parseInt(process.env.CACHE_TTL_HEALTH) || 60
  },
  KEYS: {
    SEARCH_PREFIX: 'search:',
    SUGGESTION_PREFIX: 'suggestions:',
    CATEGORY_PREFIX: 'categories:',
    ITEM_PREFIX: 'item:',
    ANALYTICS_PREFIX: 'analytics:',
    HEALTH_PREFIX: 'health:'
  }
};

// Rate Limiting Constants
const RATE_LIMIT_CONSTANTS = {
  GLOBAL: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000
  },
  SEARCH: {
    WINDOW_MS: 5 * 60 * 1000, // 5 minutes
    MAX_REQUESTS: 50
  },
  SUGGESTIONS: {
    WINDOW_MS: 5 * 60 * 1000, // 5 minutes
    MAX_REQUESTS: 100
  },
  ITEM_CREATION: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 10
  }
};

// Error Codes
const ERROR_CODES = {
  // Authentication & Authorization
  MISSING_AUTH_HEADER: 'MISSING_AUTH_HEADER',
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  AUTH_FAILED: 'AUTH_FAILED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED: 'ACCESS_DENIED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_QUERY: 'MISSING_QUERY',
  QUERY_TOO_LONG: 'QUERY_TOO_LONG',
  INVALID_PAGINATION: 'INVALID_PAGINATION',
  INVALID_UUID: 'INVALID_UUID',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  USER_RATE_LIMIT_EXCEEDED: 'USER_RATE_LIMIT_EXCEEDED',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',

  // Cache
  CACHE_ERROR: 'CACHE_ERROR',
  CACHE_UNAVAILABLE: 'CACHE_UNAVAILABLE',

  // Search
  SEARCH_ERROR: 'SEARCH_ERROR',
  SEARCH_TIMEOUT: 'SEARCH_TIMEOUT',
  NO_RESULTS_FOUND: 'NO_RESULTS_FOUND',

  // Items
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  ITEM_ALREADY_EXISTS: 'ITEM_ALREADY_EXISTS',
  INVALID_ITEM_STATUS: 'INVALID_ITEM_STATUS',

  // File Upload
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',

  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED'
};

// Helper Functions
const helpers = {
  /**
   * Generate unique ID
   */
  generateId: () => {
    return crypto.randomBytes(16).toString('hex');
  },

  /**
   * Generate UUID v4
   */
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Validate UUID format
   */
  isValidUUID: (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Validate email format
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate URL format
   */
  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Sanitize string for search
   */
  sanitizeSearchQuery: (query) => {
    if (!query || typeof query !== 'string') {
      return '';
    }
    
    return query
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes that could break SQL
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, SEARCH_CONSTANTS.MAX_QUERY_LENGTH);
  },

  /**
   * Format bytes to human readable
   */
  formatBytes: (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * Format duration in milliseconds to human readable
   */
  formatDuration: (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  },

  /**
   * Deep clone object
   */
  deepClone: (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => helpers.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = helpers.deepClone(obj[key]);
        }
      }
      return cloned;
    }
  },

  /**
   * Debounce function
   */
  debounce: (func, wait, immediate = false) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  /**
   * Throttle function
   */
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Retry function with exponential backoff
   */
  retry: async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i === maxRetries) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },

  /**
   * Create pagination metadata
   */
  createPaginationMeta: (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    };
  },

  /**
   * Generate cache key
   */
  generateCacheKey: (prefix, data) => {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    
    return `${prefix}${hash}`;
  },

  /**
   * Sleep function
   */
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Check if object is empty
   */
  isEmpty: (obj) => {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    return Object.keys(obj).length === 0;
  },

  /**
   * Pick specific properties from object
   */
  pick: (obj, keys) => {
    const result = {};
    keys.forEach(key => {
      if (obj.hasOwnProperty(key)) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  /**
   * Omit specific properties from object
   */
  omit: (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },

  /**
   * Flatten nested object
   */
  flatten: (obj, prefix = '') => {
    const flattened = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, helpers.flatten(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }
    
    return flattened;
  }
};

module.exports = {
  HTTP_STATUS,
  SEARCH_CONSTANTS,
  ITEMS_CONSTANTS,
  CACHE_CONSTANTS,
  RATE_LIMIT_CONSTANTS,
  ERROR_CODES,
  helpers
};
