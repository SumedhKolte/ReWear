const databaseConfig = require('../config/database');
const logger = require('../utils/logger');
const config = require('../config');

class SearchService {
  constructor() {
    this.db = databaseConfig;
    this.config = config.get();
  }

  /**
   * Perform advanced search on Items with full-text search and filtering
   */
  async performAdvancedSearch(query, offset = 0, limit = 20, filters = {}, options = {}) {
    const startTime = Date.now();
    
    try {
      const client = await this.db.getClient();
      
      try {
        // Build the search query with weighted ranking
        const searchQuery = `
          WITH search_results AS (
            SELECT 
              itemId,
              uploaderId,
              title,
              description,
              category,
              type,
              size,
              condition,
              tags,
              images,
              status,
              createdAt,
              updatedAt,
              ts_rank(
                search_vector, 
                plainto_tsquery('english', $1),
                32 /* rank normalization */
              ) as relevance_score,
              ts_headline(
                'english', 
                COALESCE(description, title), 
                plainto_tsquery('english', $1),
                'MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=FALSE, MaxFragments=2'
              ) as highlight
            FROM Items
            WHERE 
              search_vector @@ plainto_tsquery('english', $1)
              AND status = COALESCE($4, status)
              ${this.buildAdvancedFilterClause(filters)}
            ORDER BY ${this.buildSortClause(options.sort || 'relevance')}
            LIMIT $2 OFFSET $3
          ),
          total_count AS (
            SELECT COUNT(*) as total
            FROM Items
            WHERE 
              search_vector @@ plainto_tsquery('english', $1)
              AND status = COALESCE($4, status)
              ${this.buildAdvancedFilterClause(filters)}
          ),
          facets AS (
            SELECT 
              json_build_object(
                'categories', (
                  SELECT json_agg(json_build_object('name', category, 'count', count))
                  FROM (
                    SELECT category, COUNT(*) as count
                    FROM Items
                    WHERE search_vector @@ plainto_tsquery('english', $1)
                    AND category IS NOT NULL
                    GROUP BY category
                    ORDER BY count DESC
                    LIMIT 10
                  ) cat_counts
                ),
                'types', (
                  SELECT json_agg(json_build_object('name', type, 'count', count))
                  FROM (
                    SELECT type, COUNT(*) as count
                    FROM Items
                    WHERE search_vector @@ plainto_tsquery('english', $1)
                    AND type IS NOT NULL
                    GROUP BY type
                    ORDER BY count DESC
                    LIMIT 10
                  ) type_counts
                ),
                'conditions', (
                  SELECT json_agg(json_build_object('name', condition, 'count', count))
                  FROM (
                    SELECT condition, COUNT(*) as count
                    FROM Items
                    WHERE search_vector @@ plainto_tsquery('english', $1)
                    AND condition IS NOT NULL
                    GROUP BY condition
                    ORDER BY count DESC
                  ) cond_counts
                )
              ) as facet_data
          )
          SELECT 
            sr.*,
            tc.total,
            ${options.includeFacets ? 'f.facet_data' : 'NULL as facet_data'}
          FROM search_results sr
          CROSS JOIN total_count tc
          ${options.includeFacets ? 'CROSS JOIN facets f' : ''}
        `;

        const values = [
          query.trim(),
          limit,
          offset,
          filters.status || null
        ];

        const result = await client.query(searchQuery, values);
        const executionTime = Date.now() - startTime;

        // Format results
        const items = result.rows.map(row => ({
          itemId: row.itemid,
          uploaderId: row.uploaderid,
          title: row.title,
          description: row.description,
          category: row.category,
          type: row.type,
          size: row.size,
          condition: row.condition,
          tags: row.tags || [],
          images: row.images || [],
          status: row.status,
          createdAt: row.createdat,
          updatedAt: row.updatedat,
          relevanceScore: parseFloat(row.relevance_score || 0),
          highlight: options.includeHighlight ? row.highlight : undefined
        }));

        const total = result.rows.length > 0 ? parseInt(result.rows[0].total) : 0;
        const facets = options.includeFacets && result.rows.length > 0 
          ? result.rows[0].facet_data 
          : null;

        logger.info('Advanced search completed', {
          query,
          filters,
          results: items.length,
          total,
          executionTime
        });

        return {
          items,
          total,
          facets,
          executionTime,
          query,
          filters
        };

      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('Advanced search failed', {
        query,
        filters,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get search suggestions with fuzzy matching
   */
  async getSuggestions(query, limit = 10, options = {}) {
    try {
      const client = await this.db.getClient();
      
      try {
        let suggestionQuery = `
          WITH title_suggestions AS (
            SELECT DISTINCT 
              title as suggestion,
              similarity(title, $1) as score,
              'title' as source,
              category
            FROM Items
            WHERE 
              title % $1 
              AND status = 'Available'
              ${options.category ? 'AND category = $3' : ''}
            ORDER BY score DESC
            LIMIT $2
          ),
          category_suggestions AS (
            SELECT DISTINCT 
              category as suggestion,
              similarity(category, $1) as score,
              'category' as source,
              category
            FROM Items
            WHERE 
              category % $1 
              AND category IS NOT NULL
              AND status = 'Available'
              ${options.category ? 'AND category = $3' : ''}
            ORDER BY score DESC
            LIMIT 5
          ),
          type_suggestions AS (
            SELECT DISTINCT 
              type as suggestion,
              similarity(type, $1) as score,
              'type' as source,
              category
            FROM Items
            WHERE 
              type % $1 
              AND type IS NOT NULL
              AND status = 'Available'
              ${options.category ? 'AND category = $3' : ''}
            ORDER BY score DESC
            LIMIT 5
          )
          SELECT suggestion, score, source, category
          FROM (
            SELECT * FROM title_suggestions
            UNION ALL
            SELECT * FROM category_suggestions
            UNION ALL
            SELECT * FROM type_suggestions
          ) combined
          ORDER BY score DESC, source
          LIMIT $2
        `;

        const values = options.category 
          ? [query.toLowerCase(), limit, options.category]
          : [query.toLowerCase(), limit];

        const result = await client.query(suggestionQuery, values);

        const suggestions = result.rows.map(row => ({
          text: row.suggestion,
          score: parseFloat(row.score),
          source: row.source,
          category: row.category
        }));

        return {
          suggestions,
          query,
          category: options.category
        };

      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('Get suggestions failed', {
        query,
        options,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get trending search terms from analytics
   */
  async getTrendingSuggestions(limit = 10, period = '24h', category = null) {
    try {
      const client = await this.db.getClient();
      
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
          case '30d':
            timeCondition = "created_at >= NOW() - INTERVAL '30 days'";
            break;
          default:
            timeCondition = "created_at >= NOW() - INTERVAL '24 hours'";
        }

        const trendingQuery = `
          SELECT 
            query,
            COUNT(*) as search_count,
            AVG(results_count) as avg_results,
            MAX(created_at) as last_searched
          FROM item_search_analytics
          WHERE 
            ${timeCondition}
            AND results_count > 0
            AND LENGTH(query) > 2
            ${category ? "AND filters->>'category' = $2" : ''}
          GROUP BY query
          HAVING COUNT(*) > 1
          ORDER BY search_count DESC, avg_results DESC
          LIMIT $1
        `;

        const values = category ? [limit, category] : [limit];
        const result = await client.query(trendingQuery, values);

        return {
          trending: result.rows.map(row => ({
            query: row.query,
            searchCount: parseInt(row.search_count),
            avgResults: parseFloat(row.avg_results),
            lastSearched: row.last_searched
          })),
          period,
          category
        };

      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('Get trending suggestions failed', {
        period,
        category,
        error: error.message
      });
      return { trending: [], period, category };
    }
  }

  /**
   * Get popular search terms by category
   */
  async getPopularSuggestions(category = null, limit = 10, timeframe = '7d') {
    try {
      const client = await this.db.getClient();
      
      try {
        let timeCondition = '';
        switch (timeframe) {
          case '24h':
            timeCondition = "created_at >= NOW() - INTERVAL '24 hours'";
            break;
          case '7d':
            timeCondition = "created_at >= NOW() - INTERVAL '7 days'";
            break;
          case '30d':
            timeCondition = "created_at >= NOW() - INTERVAL '30 days'";
            break;
          default:
            timeCondition = "created_at >= NOW() - INTERVAL '7 days'";
        }

        const popularQuery = `
          SELECT 
            query,
            COUNT(*) as frequency,
            AVG(results_count) as avg_results,
            COUNT(DISTINCT user_ip) as unique_users
          FROM item_search_analytics
          WHERE 
            ${timeCondition}
            AND results_count > 0
            ${category ? "AND filters->>'category' = $2" : ''}
          GROUP BY query
          HAVING COUNT(*) >= 2
          ORDER BY frequency DESC, unique_users DESC, avg_results DESC
          LIMIT $1
        `;

        const values = category ? [limit, category] : [limit];
        const result = await client.query(popularQuery, values);

        return {
          popular: result.rows.map(row => ({
            query: row.query,
            frequency: parseInt(row.frequency),
            avgResults: parseFloat(row.avg_results),
            uniqueUsers: parseInt(row.unique_users)
          })),
          category,
          timeframe
        };

      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('Get popular suggestions failed', {
        category,
        timeframe,
        error: error.message
      });
      return { popular: [], category, timeframe };
    }
  }

  /**
   * Record suggestion interaction for analytics
   */
  async recordSuggestionInteraction(interactionData) {
    try {
      const client = await this.db.getClient();
      
      try {
        await client.query(`
          INSERT INTO suggestion_interactions 
          (query, suggestion, action, position, session_id, user_agent, ip_address, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          interactionData.query,
          interactionData.suggestion,
          interactionData.action,
          interactionData.position,
          interactionData.sessionId,
          interactionData.userAgent,
          interactionData.ip,
          interactionData.timestamp
        ]);

        logger.debug('Suggestion interaction recorded', interactionData);

      } finally {
        client.release();
      }

    } catch (error) {
      logger.warn('Failed to record suggestion interaction', {
        interactionData,
        error: error.message
      });
      // Don't throw error as this is not critical
    }
  }

  /**
   * Get search analytics for a specific period
   */
  async getSearchAnalytics(period = '24h', metrics = ['queries', 'results', 'performance']) {
    try {
      const client = await this.db.getClient();
      
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
          case '30d':
            timeCondition = "created_at >= NOW() - INTERVAL '30 days'";
            break;
          default:
            timeCondition = "created_at >= NOW() - INTERVAL '24 hours'";
        }

        const analytics = {};

        // Query analytics
        if (metrics.includes('queries')) {
          const queryResult = await client.query(`
            SELECT 
              COUNT(*) as total_searches,
              COUNT(DISTINCT query) as unique_queries,
              COUNT(DISTINCT user_ip) as unique_users,
              AVG(results_count) as avg_results_per_search
            FROM item_search_analytics
            WHERE ${timeCondition}
          `);

          analytics.queries = queryResult.rows[0];
        }

        // Performance analytics
        if (metrics.includes('performance')) {
          const perfResult = await client.query(`
            SELECT 
              AVG(execution_time) as avg_execution_time,
              MIN(execution_time) as min_execution_time,
              MAX(execution_time) as max_execution_time,
              PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time) as p95_execution_time
            FROM item_search_analytics
            WHERE ${timeCondition} AND execution_time IS NOT NULL
          `);

          analytics.performance = perfResult.rows[0];
        }

        // Results analytics
        if (metrics.includes('results')) {
          const resultsAnalysis = await client.query(`
            SELECT 
              COUNT(*) FILTER (WHERE results_count = 0) as zero_result_searches,
              COUNT(*) FILTER (WHERE results_count > 0) as successful_searches,
              AVG(results_count) FILTER (WHERE results_count > 0) as avg_results_when_found
            FROM item_search_analytics
            WHERE ${timeCondition}
          `);

          analytics.results = resultsAnalysis.rows[0];
        }

        return {
          analytics,
          period,
          metrics
        };

      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('Get search analytics failed', {
        period,
        metrics,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get similar items based on content similarity
   */
  async getSimilarItems(itemId, limit = 10) {
    try {
      const client = await this.db.getClient();
      
      try {
        const similarQuery = `
          WITH target_item AS (
            SELECT search_vector, category, type
            FROM Items
            WHERE itemId = $1
          )
          SELECT 
            i.itemId,
            i.title,
            i.category,
            i.type,
            i.images,
            i.status,
            i.createdAt,
            ts_rank(i.search_vector, ti.search_vector) as similarity_score
          FROM Items i
          CROSS JOIN target_item ti
          WHERE 
            i.itemId != $1
            AND i.status = 'Available'
            AND (i.category = ti.category OR i.type = ti.type)
          ORDER BY similarity_score DESC, i.createdAt DESC
          LIMIT $2
        `;

        const result = await client.query(similarQuery, [itemId, limit]);

        return result.rows.map(row => ({
          itemId: row.itemid,
          title: row.title,
          category: row.category,
          type: row.type,
          images: row.images || [],
          status: row.status,
          createdAt: row.createdat,
          similarityScore: parseFloat(row.similarity_score)
        }));

      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('Get similar items failed', {
        itemId,
        error: error.message
      });
      throw error;
    }
  }

  // Private helper methods
  buildAdvancedFilterClause(filters) {
    const clauses = [];
    
    if (filters.category) {
      clauses.push(`AND category = '${filters.category.replace(/'/g, "''")}'`);
    }
    
    if (filters.type) {
      clauses.push(`AND type = '${filters.type.replace(/'/g, "''")}'`);
    }
    
    if (filters.condition) {
      clauses.push(`AND condition = '${filters.condition.replace(/'/g, "''")}'`);
    }
    
    if (filters.uploaderId) {
      clauses.push(`AND uploaderId = '${filters.uploaderId}'`);
    }
    
    if (filters.tags && Array.isArray(filters.tags)) {
      const tagConditions = filters.tags.map(tag => `'${tag.replace(/'/g, "''")}'`).join(',');
      clauses.push(`AND tags && ARRAY[${tagConditions}]`);
    }
    
    if (filters.dateFrom) {
      clauses.push(`AND createdAt >= '${filters.dateFrom}'`);
    }
    
    if (filters.dateTo) {
      clauses.push(`AND createdAt <= '${filters.dateTo}'`);
    }

    if (filters.size) {
      clauses.push(`AND size = '${filters.size.replace(/'/g, "''")}'`);
    }

    return clauses.join(' ');
  }

  buildSortClause(sort) {
    switch (sort) {
      case 'newest':
        return 'createdAt DESC, relevance_score DESC';
      case 'oldest':
        return 'createdAt ASC, relevance_score DESC';
      case 'title':
        return 'title ASC, relevance_score DESC';
      case 'category':
        return 'category ASC, title ASC, relevance_score DESC';
      case 'relevance':
      default:
        return 'relevance_score DESC, createdAt DESC';
    }
  }
}

module.exports = SearchService;
