const { Pool } = require('pg');
const logger = require('../utils/logger');

class DatabaseConfig {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
  }

  async initialize() {
    try {
      this.pool = new Pool({
        host: process.env.RDS_HOSTNAME,
        port: parseInt(process.env.RDS_PORT) || 5432,
        database: process.env.RDS_DB_NAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        
        // SSL Configuration for RDS
        ssl: process.env.NODE_ENV === 'production' 
          ? { 
              rejectUnauthorized: false,
              ca: process.env.RDS_CA_CERT || null
            } 
          : false,
        
        // Connection Pool Settings optimized for Items table operations
        max: parseInt(process.env.DB_POOL_MAX) || 25, // Increased for high read operations
        min: parseInt(process.env.DB_POOL_MIN) || 5,
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
        maxUses: parseInt(process.env.DB_MAX_USES) || 7500,
        
        // Query timeout optimized for search operations
        query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
        statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 60000,
        application_name: process.env.APP_NAME || 'items-search-api',
      });

      this.setupPoolEventHandlers();
      await this.testConnection();
      this.isConnected = true;
      
      logger.info('Database connection pool initialized successfully for Items schema');
      
    } catch (error) {
      logger.error('Failed to initialize database connection:', error);
      await this.handleConnectionError(error);
    }
  }

  setupPoolEventHandlers() {
    this.pool.on('connect', (client) => {
      logger.debug('New database client connected');
      
      // Set session-level configurations optimized for Items operations
      client.query(`
        SET search_path TO public;
        SET timezone TO 'UTC';
        SET statement_timeout TO '${process.env.DB_STATEMENT_TIMEOUT || 60000}ms';
        SET work_mem TO '16MB';
        SET random_page_cost TO 1.1;
        SET effective_cache_size TO '1GB';
      `).catch(err => {
        logger.warn('Failed to set session configurations:', err);
      });
    });

    this.pool.on('error', (err, client) => {
      logger.error('Unexpected database pool error:', err);
      this.handlePoolError(err);
    });
  }

  async handleConnectionError(error) {
    if (this.connectionRetries < this.maxRetries) {
      this.connectionRetries++;
      logger.warn(`Database connection failed. Retry ${this.connectionRetries}/${this.maxRetries} in ${this.retryDelay}ms`);
      
      setTimeout(async () => {
        await this.initialize();
      }, this.retryDelay);
      
    } else {
      logger.error('Max database connection retries exceeded. Exiting...');
      process.exit(1);
    }
  }

  async testConnection() {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    
    try {
      // Test basic connectivity
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      
      // Test UUID extension
      await client.query("SELECT uuid_generate_v4()");
      
      // Test search-specific extensions
      await client.query("SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'");
      
      // Test Items table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'items'
        );
      `);
      
      logger.info('Database connection test successful', {
        timestamp: result.rows[0].current_time,
        version: result.rows[0].pg_version.split(' ')[0],
        items_table_exists: tableCheck.rows[0].exists
      });
      
      return true;
      
    } finally {
      client.release();
    }
  }

  // Items-specific query methods
  async searchItems(query, filters = {}, offset = 0, limit = 10, sort = 'relevance') {
    const client = await this.getClient();
    
    try {
      let searchQuery = `
        WITH search_results AS (
          SELECT 
            itemId, uploaderId, title, description, category, type, size, condition,
            tags, images, status, createdAt,
            ts_rank(search_vector, plainto_tsquery('english', $1)) as rank,
            ts_headline('english', COALESCE(description, title), plainto_tsquery('english', $1), 
              'MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=FALSE, MaxFragments=2') as highlight
          FROM Items
          WHERE 
            search_vector @@ plainto_tsquery('english', $1)
            ${this.buildItemsFilterClause(filters)}
          ORDER BY ${this.buildItemsSortClause(sort)}
          LIMIT $2 OFFSET $3
        ),
        total_count AS (
          SELECT COUNT(*) as total
          FROM Items
          WHERE 
            search_vector @@ plainto_tsquery('english', $1)
            ${this.buildItemsFilterClause(filters)}
        )
        SELECT sr.*, tc.total
        FROM search_results sr
        CROSS JOIN total_count tc;
      `;

      const values = [query, limit, offset];
      const result = await client.query(searchQuery, values);
      
      return {
        items: result.rows.map(row => ({
          itemId: row.itemid,
          uploaderId: row.uploaderid,
          title: row.title,
          description: row.description,
          category: row.category,
          type: row.type,
          size: row.size,
          condition: row.condition,
          tags: row.tags,
          images: row.images,
          status: row.status,
          createdAt: row.createdat,
          relevance_score: parseFloat(row.rank),
          highlight: row.highlight
        })),
        total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0
      };

    } finally {
      client.release();
    }
  }

  buildItemsFilterClause(filters) {
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
    
    if (filters.status) {
      clauses.push(`AND status = '${filters.status.replace(/'/g, "''")}'`);
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

    return clauses.join(' ');
  }

  buildItemsSortClause(sort) {
    switch (sort) {
      case 'newest':
        return 'createdAt DESC';
      case 'oldest':
        return 'createdAt ASC';
      case 'title':
        return 'title ASC';
      case 'category':
        return 'category ASC, title ASC';
      case 'relevance':
      default:
        return 'rank DESC, createdAt DESC';
    }
  }

  async getItemSuggestions(query, limit = 10) {
    const client = await this.getClient();
    
    try {
      const suggestionQuery = `
        SELECT DISTINCT title, similarity(title, $1) as sim
        FROM Items
        WHERE title % $1 AND status = 'Available'
        ORDER BY sim DESC
        LIMIT $2;
      `;

      const result = await client.query(suggestionQuery, [query, limit]);
      
      return result.rows.map(row => ({
        text: row.title,
        score: row.sim
      }));

    } finally {
      client.release();
    }
  }

  async getItemCategories() {
    const client = await this.getClient();
    
    try {
      const result = await client.query(`
        SELECT category, COUNT(*) as count
        FROM Items
        WHERE category IS NOT NULL AND status = 'Available'
        GROUP BY category
        ORDER BY count DESC, category ASC;
      `);
      
      return result.rows;

    } finally {
      client.release();
    }
  }

  async getItemTypes(category = null) {
    const client = await this.getClient();
    
    try {
      let query = `
        SELECT type, COUNT(*) as count
        FROM Items
        WHERE type IS NOT NULL AND status = 'Available'
      `;
      
      const params = [];
      if (category) {
        query += ` AND category = $1`;
        params.push(category);
      }
      
      query += ` GROUP BY type ORDER BY count DESC, type ASC;`;
      
      const result = await client.query(query, params);
      return result.rows;

    } finally {
      client.release();
    }
  }

  async getClient() {
    const pool = this.getPool();
    return await pool.connect();
  }

  getPool() {
    if (!this.pool || !this.isConnected) {
      throw new Error('Database pool not available');
    }
    return this.pool;
  }

  async query(text, params = []) {
    const client = await this.getClient();
    
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Query executed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
      
      return result;
      
    } catch (error) {
      logger.error('Query execution failed:', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        error: error.message,
        code: error.code
      });
      throw error;
      
    } finally {
      client.release();
    }
  }

  async transaction(callback) {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back:', error);
      throw error;
      
    } finally {
      client.release();
    }
  }

  async healthCheck() {
    try {
      const result = await this.query(`
        SELECT 
          COUNT(*) as active_connections,
          (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections,
          (SELECT COUNT(*) FROM Items) as total_items,
          (SELECT COUNT(*) FROM Items WHERE status = 'Available') as available_items
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);
      
      return {
        status: 'healthy',
        active_connections: parseInt(result.rows[0].active_connections),
        max_connections: parseInt(result.rows[0].max_connections),
        total_items: parseInt(result.rows[0].total_items),
        available_items: parseInt(result.rows[0].available_items),
        pool_total: this.pool.totalCount,
        pool_idle: this.pool.idleCount,
        pool_waiting: this.pool.waitingCount
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async gracefulShutdown() {
    if (this.pool) {
      logger.info('Closing database connection pool...');
      
      try {
        await this.pool.end();
        this.isConnected = false;
        logger.info('Database connection pool closed successfully');
        
      } catch (error) {
        logger.error('Error closing database pool:', error);
      }
    }
  }
}

module.exports = new DatabaseConfig();
