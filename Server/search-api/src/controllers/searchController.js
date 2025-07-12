const databaseConfig = require('../config/database');
const redisConfig = require('../config/redis');
const config = require('../config');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils');

class SearchController {
  constructor() {
    this.db = databaseConfig;
    this.cache = redisConfig;
    this.config = config.get();
  }

  /**
   * Search items with advanced filtering
   * GET /api/search?q=query&category=electronics&type=phone&page=1&limit=20
   */
  async searchItems(req, res, next) {
    const startTime = Date.now();
    
    try {
      const { 
        q: query, 
        page = 1, 
        limit = 20,
        category,
        type,
        condition,
        status = 'Available',
        uploaderId,
        tags,
        dateFrom,
        dateTo,
        sort = 'relevance'
      } = req.query;

      // Input validation
      const validationResult = this.validateSearchInput({
        query,
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        type,
        condition,
        status,
        uploaderId,
        tags: tags ? tags.split(',') : null,
        dateFrom,
        dateTo,
        sort
      });

      if (!validationResult.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: validationResult.error,
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }

      const searchParams = validationResult.data;

      // Generate cache key
      const cacheKey = this.generateSearchCacheKey(searchParams);

      // Check cache first
      const cachedResult = await this.cache.get(cacheKey);
      if (cachedResult) {
        logger.info('Search cache hit', { 
          query: searchParams.query,
          filters: searchParams.filters,
          executionTime: Date.now() - startTime
        });

        return res.json({
          success: true,
          data: {
            ...cachedResult,
            execution_time: Date.now() - startTime
          },
          cached: true,
          timestamp: new Date().toISOString()
        });
      }

      // Perform search
      const searchResult = await this.performItemsSearch(searchParams);

      // Cache the result
      await this.cache.set(
        cacheKey, 
        searchResult, 
        this.config.cache.ttl.search
      );

      const executionTime = Date.now() - startTime;

      // Log search analytics
      await this.logSearchAnalytics({
        query: searchParams.query,
        filters: searchParams.filters,
        results_count: searchResult.pagination.total,
        execution_time: executionTime,
        user_ip: req.ip,
        user_agent: req.get('User-Agent')
      });

      logger.info('Items search completed successfully', {
        query: searchParams.query,
        results: searchResult.items.length,
        total: searchResult.pagination.total,
        executionTime
      });

      res.json({
        success: true,
        data: {
          ...searchResult,
          execution_time: executionTime
        },
        cached: false,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Items search operation failed', {
        query: req.query.q,
        error: error.message,
        stack: error.stack,
        executionTime: Date.now() - startTime
      });

      next(error);
    }
  }

  /**
   * Get search suggestions/autocomplete for items
   * GET /api/suggestions?q=query&limit=10
   */
  async getItemSuggestions(req, res, next) {
    const startTime = Date.now();

    try {
      const { 
        q: query, 
        limit = 10,
        category = null
      } = req.query;

      // Input validation
      if (!query || query.trim().length < 2) {
        return res.json({
          success: true,
          data: {
            suggestions: [],
            query: query || '',
            execution_time: Date.now() - startTime
          },
          timestamp: new Date().toISOString()
        });
      }

      if (query.length > 100) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Query too long for suggestions. Maximum length is 100 characters',
          code: 'QUERY_TOO_LONG',
          timestamp: new Date().toISOString()
        });
      }

      const suggestionParams = {
        query: query.trim().toLowerCase(),
        limit: Math.min(50, Math.max(1, parseInt(limit))),
        category
      };

      // Generate cache key
      const cacheKey = `suggestions:${Buffer.from(JSON.stringify(suggestionParams)).toString('base64')}`;

      // Check cache
      const cachedSuggestions = await this.cache.get(cacheKey);
      if (cachedSuggestions) {
        return res.json({
          success: true,
          data: {
            ...cachedSuggestions,
            execution_time: Date.now() - startTime
          },
          cached: true,
          timestamp: new Date().toISOString()
        });
      }

      // Get suggestions from database
      const suggestions = await this.db.getItemSuggestions(
        suggestionParams.query,
        suggestionParams.limit
      );

      const result = {
        suggestions,
        query: suggestionParams.query,
        category: suggestionParams.category
      };

      // Cache suggestions
      await this.cache.set(
        cacheKey, 
        result, 
        this.config.cache.ttl.suggestions
      );

      const executionTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          ...result,
          execution_time: executionTime
        },
        cached: false,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Item suggestions operation failed', {
        query: req.query.q,
        error: error.message,
        executionTime: Date.now() - startTime
      });

      next(error);
    }
  }

  /**
   * Get available categories with item counts
   * GET /api/categories
   */
  async getCategories(req, res, next) {
    try {
      const cacheKey = 'categories:all';

      // Check cache
      const cachedCategories = await this.cache.get(cacheKey);
      if (cachedCategories) {
        return res.json({
          success: true,
          data: cachedCategories,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }

      // Get categories from database
      const categories = await this.db.getItemCategories();

      // Cache categories
      await this.cache.set(
        cacheKey, 
        { categories }, 
        this.config.cache.ttl.categories
      );

      res.json({
        success: true,
        data: { categories },
        cached: false,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get categories operation failed', { error: error.message });
      next(error);
    }
  }

  /**
   * Get available types for a category
   * GET /api/types?category=electronics
   */
  async getTypes(req, res, next) {
    try {
      const { category = null } = req.query;
      const cacheKey = `types:${category || 'all'}`;

      // Check cache
      const cachedTypes = await this.cache.get(cacheKey);
      if (cachedTypes) {
        return res.json({
          success: true,
          data: cachedTypes,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }

      // Get types from database
      const types = await this.db.getItemTypes(category);

      const result = { types, category };

      // Cache types
      await this.cache.set(
        cacheKey, 
        result, 
        this.config.cache.ttl.categories
      );

      res.json({
        success: true,
        data: result,
        cached: false,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get types operation failed', { error: error.message });
      next(error);
    }
  }

  /**
   * Get trending items based on search frequency
   * GET /api/trending?limit=10&category=electronics
   */
  async getTrendingItems(req, res, next) {
    try {
      const { 
        limit = 10,
        category = null,
        period = '24h'
      } = req.query;

      const cacheKey = `trending:${period}:${category || 'all'}:${limit}`;

      // Check cache
      const cachedTrending = await this.cache.get(cacheKey);
      if (cachedTrending) {
        return res.json({
          success: true,
          data: cachedTrending,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }

      // Get trending items from analytics
      const trending = await this.getTrendingFromAnalytics(
        parseInt(limit),
        category,
        period
      );

      // Cache trending data
      await this.cache.set(cacheKey, trending, 300); // 5 minutes cache

      res.json({
        success: true,
        data: trending,
        cached: false,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get trending items failed', { error: error.message });
      next(error);
    }
  }

  /**
   * Clear search cache
   * DELETE /api/search/cache
   */
  async clearSearchCache(req, res, next) {
    try {
      const { pattern = 'search:*' } = req.query;

      const cleared = await this.cache.flushPattern(pattern);

      res.json({
        success: true,
        message: 'Search cache cleared successfully',
        pattern,
        cleared,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Cache clear failed', { error: error.message });
      next(error);
    }
  }

  // Private helper methods
  async performItemsSearch(params) {
    const { query, page, limit, filters, sort } = params;
    const offset = (page - 1) * limit;

    // Perform search using database method
    const searchResult = await this.db.searchItems(query, filters, offset, limit, sort);

    return {
      items: searchResult.items,
      pagination: {
        page,
        limit,
        total: searchResult.total,
        total_pages: Math.ceil(searchResult.total / limit),
        has_next: page * limit < searchResult.total,
        has_prev: page > 1
      },
      filters: filters,
      sort,
      query
    };
  }

  validateSearchInput(params) {
    const { query, page, limit, category, type, condition, status, uploaderId, tags, dateFrom, dateTo, sort } = params;

    // Query validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return {
        isValid: false,
        error: 'Query parameter is required and must be a non-empty string'
      };
    }

    if (query.length > this.config.search.maxQueryLength) {
      return {
        isValid: false,
        error: `Query too long. Maximum length is ${this.config.search.maxQueryLength} characters`
      };
    }

    // Pagination validation
    if (!Number.isInteger(page) || page < 1) {
      return {
        isValid: false,
        error: 'Page must be a positive integer'
      };
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > this.config.search.maxResultsPerPage) {
      return {
        isValid: false,
        error: `Limit must be between 1 and ${this.config.search.maxResultsPerPage}`
      };
    }

    // Status validation
    if (status && !this.config.items.validStatuses.includes(status)) {
      return {
        isValid: false,
        error: `Invalid status. Valid options: ${this.config.items.validStatuses.join(', ')}`
      };
    }

    // UUID validation for uploaderId
    if (uploaderId && !this.isValidUUID(uploaderId)) {
      return {
        isValid: false,
        error: 'Invalid uploaderId format'
      };
    }

    // Sort validation
    const validSortOptions = ['relevance', 'newest', 'oldest', 'title', 'category'];
    if (!validSortOptions.includes(sort)) {
      return {
        isValid: false,
        error: `Invalid sort option. Valid options: ${validSortOptions.join(', ')}`
      };
    }

    // Date validation
    if (dateFrom && !this.isValidDate(dateFrom)) {
      return {
        isValid: false,
        error: 'Invalid dateFrom format. Use YYYY-MM-DD'
      };
    }

    if (dateTo && !this.isValidDate(dateTo)) {
      return {
        isValid: false,
        error: 'Invalid dateTo format. Use YYYY-MM-DD'
      };
    }

    // Tags validation
    if (tags && tags.length > this.config.items.maxTags) {
      return {
        isValid: false,
        error: `Too many tags. Maximum allowed: ${this.config.items.maxTags}`
      };
    }

    return {
      isValid: true,
      data: {
        query: query.trim(),
        page,
        limit,
        sort,
        filters: {
          category,
          type,
          condition,
          status,
          uploaderId,
          tags,
          dateFrom,
          dateTo
        }
      }
    };
  }

  generateSearchCacheKey(params) {
    const keyData = {
      query: params.query,
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      filters: params.filters
    };

    return `search:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
  }

  async logSearchAnalytics(data) {
    try {
      await this.db.query(`
        INSERT INTO item_search_analytics (query, filters, results_count, execution_time, user_ip, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        data.query,
        JSON.stringify(data.filters),
        data.results_count,
        data.execution_time,
        data.user_ip,
        data.user_agent
      ]);
    } catch (error) {
      logger.warn('Failed to log search analytics:', error.message);
    }
  }

  async getTrendingFromAnalytics(limit, category, period) {
    try {
      let timeCondition = '';
      switch (period) {
        case '1h':
          timeCondition = "created_at >= NOW() - INTERVAL '1 hour'";
          break;
        case '24h':
          timeCondition = "created_at >= NOW() - INTERVAL '24 hours'";
          break;
        case '7d':
          timeCondition = "created_at >= NOW() - INTERVAL '7 days'";
          break;
        default:
          timeCondition = "created_at >= NOW() - INTERVAL '24 hours'";
      }

      const result = await this.db.query(`
        SELECT query, COUNT(*) as search_count, AVG(results_count) as avg_results
        FROM item_search_analytics
        WHERE ${timeCondition}
        AND results_count > 0
        GROUP BY query
        ORDER BY search_count DESC, avg_results DESC
        LIMIT $1
      `, [limit]);

      return {
        trending_queries: result.rows,
        period,
        category
      };

    } catch (error) {
      logger.error('Failed to get trending data:', error.message);
      return {
        trending_queries: [],
        period,
        category
      };
    }
  }

  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  }
}

module.exports = new SearchController();
