const path = require('path');
const logger = require('../utils/logger');

class ConfigManager {
  constructor() {
    this.loadEnvironment();
    this.validateRequiredVariables();
    this.setDefaults();
    this.config = this.buildConfig();
  }

  loadEnvironment() {
    if (process.env.NODE_ENV !== 'production') {
      require('dotenv').config({
        path: path.resolve(process.cwd(), '.env')
      });
    }
  }

  validateRequiredVariables() {
    const requiredVars = [
      'RDS_HOSTNAME',
      'RDS_DB_NAME',
      'RDS_USERNAME',
      'RDS_PASSWORD'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      logger.error('Missing required environment variables:', missingVars);
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  setDefaults() {
    // Application defaults
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    process.env.PORT = process.env.PORT || '3000';
    process.env.APP_NAME = process.env.APP_NAME || 'items-search-api';
    
    // Database defaults (optimized for Items operations)
    process.env.RDS_PORT = process.env.RDS_PORT || '5432';
    process.env.DB_POOL_MAX = process.env.DB_POOL_MAX || '25'; // Increased for read-heavy operations
    process.env.DB_POOL_MIN = process.env.DB_POOL_MIN || '5';
    process.env.DB_IDLE_TIMEOUT = process.env.DB_IDLE_TIMEOUT || '30000';
    process.env.DB_CONNECTION_TIMEOUT = process.env.DB_CONNECTION_TIMEOUT || '5000';
    process.env.DB_QUERY_TIMEOUT = process.env.DB_QUERY_TIMEOUT || '30000';
    process.env.DB_STATEMENT_TIMEOUT = process.env.DB_STATEMENT_TIMEOUT || '60000';
    process.env.DB_MAX_USES = process.env.DB_MAX_USES || '7500';
    
    // Redis defaults
    process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
    process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
    process.env.REDIS_DB = process.env.REDIS_DB || '0';
    process.env.REDIS_KEY_PREFIX = process.env.REDIS_KEY_PREFIX || 'items-api:';
    
    // Cache settings (optimized for Items data)
    process.env.CACHE_TTL_SEARCH = process.env.CACHE_TTL_SEARCH || '300'; // 5 minutes
    process.env.CACHE_TTL_SUGGESTIONS = process.env.CACHE_TTL_SUGGESTIONS || '600'; // 10 minutes
    process.env.CACHE_TTL_CATEGORIES = process.env.CACHE_TTL_CATEGORIES || '3600'; // 1 hour
    process.env.CACHE_TTL_HEALTH = process.env.CACHE_TTL_HEALTH || '60';
    
    // Search settings (Items-specific)
    process.env.SEARCH_MAX_QUERY_LENGTH = process.env.SEARCH_MAX_QUERY_LENGTH || '200';
    process.env.SEARCH_MAX_RESULTS_PER_PAGE = process.env.SEARCH_MAX_RESULTS_PER_PAGE || '50';
    process.env.SEARCH_DEFAULT_PAGE_SIZE = process.env.SEARCH_DEFAULT_PAGE_SIZE || '20';
    
    // Items-specific settings
    process.env.ITEMS_MAX_IMAGES = process.env.ITEMS_MAX_IMAGES || '10';
    process.env.ITEMS_MAX_TAGS = process.env.ITEMS_MAX_TAGS || '20';
    process.env.ITEMS_DEFAULT_STATUS = process.env.ITEMS_DEFAULT_STATUS || 'Available';
    
    // Rate limiting
    process.env.RATE_LIMIT_WINDOW = process.env.RATE_LIMIT_WINDOW || '900000';
    process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || '1000';
  }

  buildConfig() {
    return {
      // Application
      app: {
        name: process.env.APP_NAME,
        env: process.env.NODE_ENV,
        port: parseInt(process.env.PORT),
        version: process.env.npm_package_version || '1.0.0'
      },
      // Add this block at the bottom of the return object:
      security: {
        helmetEnabled: process.env.HELMET_ENABLED === 'true' // or default to true
      },
      // Database (optimized for Items schema)
      database: {
        host: process.env.RDS_HOSTNAME,
        port: parseInt(process.env.RDS_PORT),
        name: process.env.RDS_DB_NAME,
        username: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        ssl: process.env.NODE_ENV === 'production',
        pool: {
          max: parseInt(process.env.DB_POOL_MAX),
          min: parseInt(process.env.DB_POOL_MIN),
          idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT),
          connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT),
          queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT),
          statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT),
          maxUses: parseInt(process.env.DB_MAX_USES)
        }
      },

      // Redis
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB),
        keyPrefix: process.env.REDIS_KEY_PREFIX,
        tls: process.env.REDIS_TLS === 'true'
      },

      // Cache (Items-optimized TTL)
      cache: {
        ttl: {
          search: parseInt(process.env.CACHE_TTL_SEARCH),
          suggestions: parseInt(process.env.CACHE_TTL_SUGGESTIONS),
          categories: parseInt(process.env.CACHE_TTL_CATEGORIES),
          health: parseInt(process.env.CACHE_TTL_HEALTH)
        }
      },

      // Search (Items-specific)
      search: {
        maxQueryLength: parseInt(process.env.SEARCH_MAX_QUERY_LENGTH),
        maxResultsPerPage: parseInt(process.env.SEARCH_MAX_RESULTS_PER_PAGE),
        defaultPageSize: parseInt(process.env.SEARCH_DEFAULT_PAGE_SIZE)
      },

      // Items-specific configuration
      items: {
        maxImages: parseInt(process.env.ITEMS_MAX_IMAGES),
        maxTags: parseInt(process.env.ITEMS_MAX_TAGS),
        defaultStatus: process.env.ITEMS_DEFAULT_STATUS,
        validStatuses: ['Available', 'Swapped', 'Pending']
      },

      // Rate limiting
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
      }
    };
  }

  get() {
    return this.config;
  }

  isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  printConfiguration() {
    const safeConfig = {
      ...this.config,
      database: {
        ...this.config.database,
        password: '***HIDDEN***'
      },
      redis: {
        ...this.config.redis,
        password: this.config.redis.password ? '***HIDDEN***' : undefined
      }
    };

    logger.info('Items API configuration loaded:', safeConfig);
  }
}

module.exports = new ConfigManager();
