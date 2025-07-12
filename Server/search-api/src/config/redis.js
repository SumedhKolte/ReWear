const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.retryDelay = 3000;
  }

  async initialize() {
    try {
      const redisOptions = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || null,
        db: parseInt(process.env.REDIS_DB) || 0,
        
        // Connection settings
        connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
        commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT) || 5000,
        lazyConnect: true,
        
        // Retry strategy
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        
        // Key prefix for namespacing
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'search-api:',
        
        // Connection pool
        family: 4,
        keepAlive: true,
        enableOfflineQueue: false,
      };

      // Add TLS configuration for production
      if (process.env.NODE_ENV === 'production' && process.env.REDIS_TLS === 'true') {
        redisOptions.tls = {
          checkServerIdentity: () => undefined,
        };
      }

      this.client = new Redis(redisOptions);
      this.setupEventHandlers();
      
      await this.client.connect();
      await this.testConnection();
      this.isConnected = true;
      
      logger.info('Redis connection initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize Redis connection:', error);
      await this.handleConnectionError(error);
    }
  }

  setupEventHandlers() {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
      this.connectionRetries = 0;
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
      this.isConnected = false;
      this.handleRedisError(error);
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', (delay) => {
      logger.info(`Redis reconnecting in ${delay}ms`);
    });
  }

  async handleConnectionError(error) {
    if (this.connectionRetries < this.maxRetries) {
      this.connectionRetries++;
      logger.warn(`Redis connection failed. Retry ${this.connectionRetries}/${this.maxRetries} in ${this.retryDelay}ms`);
      
      setTimeout(async () => {
        await this.initialize();
      }, this.retryDelay);
      
    } else {
      logger.error('Max Redis connection retries exceeded. Continuing without cache...');
      this.isConnected = false;
    }
  }

  handleRedisError(error) {
    switch (error.code) {
      case 'ECONNREFUSED':
        logger.error('Redis connection refused');
        break;
      case 'ENOTFOUND':
        logger.error('Redis host not found');
        break;
      case 'ETIMEDOUT':
        logger.error('Redis connection timeout');
        break;
      case 'NOAUTH':
        logger.error('Redis authentication required');
        break;
      default:
        logger.error('Unknown Redis error:', error);
    }
  }

  async testConnection() {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      const pong = await this.client.ping();
      const info = await this.client.info('server');
      
      logger.info('Redis connection test successful', {
        ping: pong,
        version: info.split('\r\n').find(line => line.startsWith('redis_version:'))?.split(':')[1]
      });
      
      return true;
      
    } catch (error) {
      logger.error('Redis connection test failed:', error);
      throw error;
    }
  }

  getClient() {
    if (!this.isConnected) {
      logger.warn('Redis client not available, operations will be skipped');
      return null;
    }
    return this.client;
  }

  // Cache operations with error handling
  async get(key) {
    try {
      if (!this.isConnected) return null;
      
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
      
    } catch (error) {
      logger.warn('Redis GET operation failed:', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      if (!this.isConnected) return false;
      
      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      
      return true;
      
    } catch (error) {
      logger.warn('Redis SET operation failed:', { key, error: error.message });
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) return false;
      
      const result = await this.client.del(key);
      return result > 0;
      
    } catch (error) {
      logger.warn('Redis DEL operation failed:', { key, error: error.message });
      return false;
    }
  }

  async flushPattern(pattern) {
    try {
      if (!this.isConnected) return false;
      
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      
      return true;
      
    } catch (error) {
      logger.warn('Redis flush pattern operation failed:', { pattern, error: error.message });
      return false;
    }
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected' };
      }
      
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;
      
      const info = await this.client.info('memory');
      const memoryUsed = info.split('\r\n')
        .find(line => line.startsWith('used_memory_human:'))
        ?.split(':')[1];
      
      return {
        status: 'healthy',
        latency: `${latency}ms`,
        memory_used: memoryUsed
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async gracefulShutdown() {
    logger.info('Closing Redis connection...');
    
    try {
      if (this.client) {
        await this.client.quit();
      }
      
      this.isConnected = false;
      logger.info('Redis connection closed successfully');
      
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }
}

module.exports = new RedisConfig();
