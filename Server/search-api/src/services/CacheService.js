const redisConfig = require('../config/redis');
const logger = require('../utils/logger');
const config = require('../config');

class CacheService {
  constructor() {
    this.redis = redisConfig;
    this.config = config.get();
    this.defaultTTL = this.config.cache.ttl.search || 300;
  }

  /**
   * Get value from cache with JSON parsing
   */
  async get(key) {
    try {
      const client = this.redis.getClient();
      if (!client) {
        logger.warn('Redis client not available for GET operation', { key });
        return null;
      }

      const value = await client.get(key);
      
      if (value === null) {
        logger.debug('Cache miss', { key });
        return null;
      }

      logger.debug('Cache hit', { key });
      return JSON.parse(value);

    } catch (error) {
      logger.warn('Cache GET operation failed', { 
        key, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Set value in cache with JSON serialization
   */
  async set(key, value, ttl = null) {
    try {
      const client = this.redis.getClient();
      if (!client) {
        logger.warn('Redis client not available for SET operation', { key });
        return false;
      }

      const serializedValue = JSON.stringify(value);
      const expiration = ttl || this.defaultTTL;

      await client.setex(key, expiration, serializedValue);
      
      logger.debug('Cache SET successful', { 
        key, 
        ttl: expiration,
        size: serializedValue.length 
      });
      
      return true;

    } catch (error) {
      logger.warn('Cache SET operation failed', { 
        key, 
        ttl, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key) {
    try {
      const client = this.redis.getClient();
      if (!client) {
        logger.warn('Redis client not available for DEL operation', { key });
        return false;
      }

      const result = await client.del(key);
      
      logger.debug('Cache DEL operation', { 
        key, 
        deleted: result > 0 
      });
      
      return result > 0;

    } catch (error) {
      logger.warn('Cache DEL operation failed', { 
        key, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    try {
      const client = this.redis.getClient();
      if (!client) {
        return false;
      }

      const result = await client.exists(key);
      return result === 1;

    } catch (error) {
      logger.warn('Cache EXISTS operation failed', { 
        key, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Set expiration time for existing key
   */
  async expire(key, ttl) {
    try {
      const client = this.redis.getClient();
      if (!client) {
        return false;
      }

      const result = await client.expire(key, ttl);
      
      logger.debug('Cache EXPIRE operation', { 
        key, 
        ttl, 
        success: result === 1 
      });
      
      return result === 1;

    } catch (error) {
      logger.warn('Cache EXPIRE operation failed', { 
        key, 
        ttl, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Get time to live for a key
   */
  async ttl(key) {
    try {
      const client = this.redis.getClient();
      if (!client) {
        return -1;
      }

      return await client.ttl(key);

    } catch (error) {
      logger.warn('Cache TTL operation failed', { 
        key, 
        error: error.message 
      });
      return -1;
    }
  }

  /**
   * Increment a numeric value in cache
   */
  async incr(key, amount = 1) {
    try {
      const client = this.redis.getClient();
      if (!client) {
        return null;
      }

      const result = amount === 1 
        ? await client.incr(key)
        : await client.incrby(key, amount);

      logger.debug('Cache INCR operation', { 
        key, 
        amount, 
        newValue: result 
      });

      return result;

    } catch (error) {
      logger.warn('Cache INCR operation failed', { 
        key, 
        amount, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Clear cache keys matching a pattern
   */
  async clearPattern(pattern) {
    try {
      const client = this.redis.getClient();
      if (!client) {
        logger.warn('Redis client not available for pattern clear', { pattern });
        return false;
      }

      const keys = await client.keys(pattern);
      
      if (keys.length === 0) {
        logger.debug('No keys found for pattern', { pattern });
        return true;
      }

      const result = await client.del(...keys);
      
      logger.info('Cache pattern cleared', { 
        pattern, 
        keysFound: keys.length, 
        keysDeleted: result 
      });
      
      return result > 0;

    } catch (error) {
      logger.error('Cache pattern clear failed', { 
        pattern, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget(keys) {
    try {
      const client = this.redis.getClient();
      if (!client || !Array.isArray(keys) || keys.length === 0) {
        return [];
      }

      const values = await client.mget(...keys);
      
      return values.map((value, index) => {
        if (value === null) {
          return null;
        }
        
        try {
          return JSON.parse(value);
        } catch (parseError) {
          logger.warn('Failed to parse cached value', { 
            key: keys[index], 
            error: parseError.message 
          });
          return null;
        }
      });

    } catch (error) {
      logger.warn('Cache MGET operation failed', { 
        keys, 
        error: error.message 
      });
      return new Array(keys.length).fill(null);
    }
  }

  /**
   * Set multiple key-value pairs at once
   */
  async mset(keyValuePairs, ttl = null) {
    try {
      const client = this.redis.getClient();
      if (!client || !Array.isArray(keyValuePairs)) {
        return false;
      }

      // Prepare key-value pairs for Redis
      const redisArgs = [];
      for (const [key, value] of keyValuePairs) {
        redisArgs.push(key, JSON.stringify(value));
      }

      await client.mset(...redisArgs);

      // Set TTL for all keys if specified
      if (ttl) {
        const expirePromises = keyValuePairs.map(([key]) => 
          client.expire(key, ttl)
        );
        await Promise.all(expirePromises);
      }

      logger.debug('Cache MSET successful', { 
        count: keyValuePairs.length, 
        ttl 
      });

      return true;

    } catch (error) {
      logger.warn('Cache MSET operation failed', { 
        count: keyValuePairs?.length, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Cache with automatic key generation for search results
   */
  async cacheSearchResults(query, filters, results, ttl = null) {
    const cacheKey = this.generateSearchCacheKey(query, filters);
    return await this.set(cacheKey, results, ttl || this.config.cache.ttl.search);
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(query, filters) {
    const cacheKey = this.generateSearchCacheKey(query, filters);
    return await this.get(cacheKey);
  }

  /**
   * Cache suggestions with automatic key generation
   */
  async cacheSuggestions(query, suggestions, ttl = null) {
    const cacheKey = this.generateSuggestionsCacheKey(query);
    return await this.set(cacheKey, suggestions, ttl || this.config.cache.ttl.suggestions);
  }

  /**
   * Get cached suggestions
   */
  async getCachedSuggestions(query) {
    const cacheKey = this.generateSuggestionsCacheKey(query);
    return await this.get(cacheKey);
  }

  /**
   * Cache categories with counts
   */
  async cacheCategories(categories, ttl = null) {
    const cacheKey = 'categories:all';
    return await this.set(cacheKey, categories, ttl || this.config.cache.ttl.categories);
  }

  /**
   * Get cached categories
   */
  async getCachedCategories() {
    return await this.get('categories:all');
  }

  /**
   * Cache item details
   */
  async cacheItem(itemId, itemData, ttl = 3600) {
    const cacheKey = `item:${itemId}`;
    return await this.set(cacheKey, itemData, ttl);
  }

  /**
   * Get cached item details
   */
  async getCachedItem(itemId) {
    const cacheKey = `item:${itemId}`;
    return await this.get(cacheKey);
  }

  /**
   * Invalidate item cache when item is updated
   */
  async invalidateItem(itemId) {
    const cacheKey = `item:${itemId}`;
    await this.del(cacheKey);
    
    // Also clear related search caches
    await this.clearPattern('search:*');
    await this.clearPattern('suggestions:*');
    
    logger.debug('Item cache invalidated', { itemId });
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const client = this.redis.getClient();
      if (!client) {
        return { available: false };
      }

      const info = await client.info('memory');
      const keyspace = await client.info('keyspace');
      
      // Parse memory info
      const memoryLines = info.split('\r\n');
      const memoryUsed = memoryLines
        .find(line => line.startsWith('used_memory_human:'))
        ?.split(':')[1];

      // Count keys by pattern
      const searchKeys = await client.keys('search:*');
      const suggestionKeys = await client.keys('suggestions:*');
      const itemKeys = await client.keys('item:*');
      const categoryKeys = await client.keys('categories:*');

      return {
        available: true,
        memory_used: memoryUsed,
        keyspace_info: keyspace,
        key_counts: {
          search: searchKeys.length,
          suggestions: suggestionKeys.length,
          items: itemKeys.length,
          categories: categoryKeys.length,
          total: searchKeys.length + suggestionKeys.length + itemKeys.length + categoryKeys.length
        }
      };

    } catch (error) {
      logger.error('Failed to get cache stats', { error: error.message });
      return { available: false, error: error.message };
    }
  }

  /**
   * Warm up cache with popular data
   */
  async warmUpCache() {
    try {
      logger.info('Starting cache warm-up');

      // This would typically be called during application startup
      // to pre-populate cache with frequently accessed data
      
      // Example: Cache popular categories
      // const categories = await this.getCategoriesFromDB();
      // await this.cacheCategories(categories);

      logger.info('Cache warm-up completed');
      return true;

    } catch (error) {
      logger.error('Cache warm-up failed', { error: error.message });
      return false;
    }
  }

  // Private helper methods
  generateSearchCacheKey(query, filters) {
    const keyData = {
      query: query.trim().toLowerCase(),
      filters: this.normalizeFilters(filters)
    };
    
    return `search:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
  }

  generateSuggestionsCacheKey(query) {
    return `suggestions:${Buffer.from(query.trim().toLowerCase()).toString('base64')}`;
  }

  normalizeFilters(filters) {
    // Sort filter keys to ensure consistent cache keys
    const normalized = {};
    const sortedKeys = Object.keys(filters || {}).sort();
    
    for (const key of sortedKeys) {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        normalized[key] = filters[key];
      }
    }
    
    return normalized;
  }
}

module.exports = CacheService;
