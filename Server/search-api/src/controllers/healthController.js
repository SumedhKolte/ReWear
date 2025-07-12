const databaseConfig = require('../config/database');
const redisConfig = require('../config/redis');
const config = require('../config');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils');

class HealthController {
  constructor() {
    this.startTime = Date.now();
    this.config = config.get();
    this.version = this.config.app.version;
  }

  /**
   * Basic health check endpoint
   * GET /api/health
   */
  async getHealth(req, res, next) {
    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
        version: this.version,
        environment: this.config.app.env,
        services: {
          database: 'checking',
          cache: 'checking',
          application: 'healthy'
        }
      };

      // Check database health
      try {
        const dbHealth = await databaseConfig.healthCheck();
        healthStatus.services.database = dbHealth.status;
        healthStatus.database_info = {
          status: dbHealth.status,
          total_items: dbHealth.total_items,
          available_items: dbHealth.available_items,
          active_connections: dbHealth.active_connections,
          pool_status: {
            total: dbHealth.pool_total,
            idle: dbHealth.pool_idle,
            waiting: dbHealth.pool_waiting
          }
        };
      } catch (error) {
        healthStatus.services.database = 'unhealthy';
        healthStatus.database_error = error.message;
      }

      // Check Redis health
      try {
        const redisHealth = await redisConfig.healthCheck();
        healthStatus.services.cache = redisHealth.status;
        healthStatus.cache_info = {
          status: redisHealth.status,
          latency: redisHealth.latency,
          memory_used: redisHealth.memory_used
        };
      } catch (error) {
        healthStatus.services.cache = 'unhealthy';
        healthStatus.cache_error = error.message;
      }

      // Determine overall health status
      const unhealthyServices = Object.values(healthStatus.services)
        .filter(status => status === 'unhealthy');

      if (unhealthyServices.length > 0) {
        healthStatus.status = 'degraded';
        
        // If database is down, mark as unhealthy
        if (healthStatus.services.database === 'unhealthy') {
          healthStatus.status = 'unhealthy';
        }
      }

      const statusCode = healthStatus.status === 'unhealthy' 
        ? HTTP_STATUS.SERVICE_UNAVAILABLE 
        : HTTP_STATUS.OK;

      res.status(statusCode).json({
        success: healthStatus.status !== 'unhealthy',
        data: healthStatus
      });

    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message,
          uptime: this.getUptime(),
          version: this.version
        }
      });
    }
  }

  /**
   * Detailed health check with system metrics
   * GET /api/health/detailed
   */
  async getDetailedHealth(req, res, next) {
    try {
      const detailedHealth = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
        version: this.version,
        environment: this.config.app.env,
        system: this.getSystemMetrics(),
        services: {},
        configuration: this.getConfigurationStatus(),
        items_statistics: {}
      };

      // Database detailed health
      try {
        const dbHealth = await this.getDatabaseDetailedHealth();
        detailedHealth.services.database = dbHealth;
      } catch (error) {
        detailedHealth.services.database = {
          status: 'unhealthy',
          error: error.message
        };
      }

      // Redis detailed health
      try {
        const redisHealth = await this.getRedisDetailedHealth();
        detailedHealth.services.cache = redisHealth;
      } catch (error) {
        detailedHealth.services.cache = {
          status: 'unhealthy',
          error: error.message
        };
      }

      // Items statistics
      try {
        const itemsStats = await this.getItemsStatistics();
        detailedHealth.items_statistics = itemsStats;
      } catch (error) {
        detailedHealth.items_statistics = {
          error: error.message
        };
      }

      // Search service health
      try {
        const searchHealth = await this.getSearchServiceHealth();
        detailedHealth.services.search = searchHealth;
      } catch (error) {
        detailedHealth.services.search = {
          status: 'unhealthy',
          error: error.message
        };
      }

      // Determine overall status
      const serviceStatuses = Object.values(detailedHealth.services)
        .map(service => service.status);

      if (serviceStatuses.includes('unhealthy')) {
        detailedHealth.status = serviceStatuses.includes('database') ? 'unhealthy' : 'degraded';
      }

      const statusCode = detailedHealth.status === 'unhealthy' 
        ? HTTP_STATUS.SERVICE_UNAVAILABLE 
        : HTTP_STATUS.OK;

      res.status(statusCode).json({
        success: detailedHealth.status !== 'unhealthy',
        data: detailedHealth
      });

    } catch (error) {
      logger.error('Detailed health check failed', { error: error.message });
      next(error);
    }
  }

  /**
   * Readiness probe for Kubernetes
   * GET /api/health/ready
   */
  async getReadiness(req, res, next) {
    try {
      // Check if all critical services are ready
      const dbReady = await this.isDatabaseReady();
      const cacheReady = await this.isCacheReady();
      const itemsTableReady = await this.isItemsTableReady();

      const isReady = dbReady && cacheReady && itemsTableReady;

      res.status(isReady ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        ready: isReady,
        timestamp: new Date().toISOString(),
        checks: {
          database: dbReady,
          cache: cacheReady,
          items_table: itemsTableReady
        }
      });

    } catch (error) {
      logger.error('Readiness check failed', { error: error.message });
      
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        ready: false,
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Liveness probe for Kubernetes
   * GET /api/health/live
   */
  async getLiveness(req, res, next) {
    try {
      // Simple liveness check - just verify the application is running
      res.json({
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
        pid: process.pid,
        memory_usage: this.getMemoryUsage()
      });

    } catch (error) {
      logger.error('Liveness check failed', { error: error.message });
      
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        alive: false,
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  // Private helper methods
  getUptime() {
    const uptimeMs = Date.now() - this.startTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    return {
      milliseconds: uptimeMs,
      seconds: uptimeSeconds,
      formatted: `${hours}h ${minutes}m ${seconds}s`
    };
  }

  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        rss: this.formatBytes(memUsage.rss),
        heapTotal: this.formatBytes(memUsage.heapTotal),
        heapUsed: this.formatBytes(memUsage.heapUsed),
        external: this.formatBytes(memUsage.external),
        arrayBuffers: this.formatBytes(memUsage.arrayBuffers)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      process: {
        pid: process.pid,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      }
    };
  }

  getMemoryUsage() {
    const memUsage = process.memoryUsage();
    return {
      rss: this.formatBytes(memUsage.rss),
      heapUsed: this.formatBytes(memUsage.heapUsed),
      heapTotal: this.formatBytes(memUsage.heapTotal)
    };
  }

  getConfigurationStatus() {
    return {
      database: {
        host: this.config.database.host,
        port: this.config.database.port,
        database: this.config.database.name,
        ssl: this.config.database.ssl,
        poolSize: this.config.database.pool.max
      },
      cache: {
        host: this.config.redis.host,
        port: this.config.redis.port,
        database: this.config.redis.db,
        tls: this.config.redis.tls
      },
      search: {
        maxQueryLength: this.config.search.maxQueryLength,
        maxResultsPerPage: this.config.search.maxResultsPerPage,
        defaultPageSize: this.config.search.defaultPageSize
      },
      items: {
        maxImages: this.config.items.maxImages,
        maxTags: this.config.items.maxTags,
        validStatuses: this.config.items.validStatuses
      }
    };
  }

  async getDatabaseDetailedHealth() {
    const dbHealth = await databaseConfig.healthCheck();
    
    // Additional database-specific checks
    const client = await databaseConfig.getClient();
    
    try {
      // Check if required extensions are available
      const extensionsResult = await client.query(`
        SELECT extname, extversion 
        FROM pg_extension 
        WHERE extname IN ('pg_trgm', 'unaccent', 'uuid-ossp')
      `);

      // Check Items table indexes
      const indexesResult = await client.query(`
        SELECT schemaname, tablename, indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'items'
        ORDER BY indexname
      `);

      return {
        ...dbHealth,
        extensions: extensionsResult.rows,
        items_indexes: indexesResult.rows,
        connection_info: {
          database: client.database,
          user: client.user,
          host: client.host,
          port: client.port
        }
      };

    } finally {
      client.release();
    }
  }

  async getRedisDetailedHealth() {
    const redisHealth = await redisConfig.healthCheck();
    
    // Additional Redis-specific metrics
    const client = redisConfig.getClient();
    if (!client) {
      return { status: 'disconnected' };
    }

    try {
      const info = await client.info();
      const keyspaceInfo = await client.info('keyspace');
      
      return {
        ...redisHealth,
        keyspace: keyspaceInfo,
        server_info: info.split('\r\n')
          .filter(line => line.includes(':'))
          .slice(0, 10) // Limit to first 10 entries
          .reduce((acc, line) => {
            const [key, value] = line.split(':');
            acc[key] = value;
            return acc;
          }, {})
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async getItemsStatistics() {
    try {
      const result = await databaseConfig.query(`
        SELECT 
          COUNT(*) as total_items,
          COUNT(*) FILTER (WHERE status = 'Available') as available_items,
          COUNT(*) FILTER (WHERE status = 'Swapped') as swapped_items,
          COUNT(*) FILTER (WHERE status = 'Pending') as pending_items,
          COUNT(DISTINCT category) as total_categories,
          COUNT(DISTINCT type) as total_types,
          COUNT(DISTINCT uploaderId) as total_uploaders,
          DATE_TRUNC('day', MIN(createdAt)) as oldest_item,
          DATE_TRUNC('day', MAX(createdAt)) as newest_item
        FROM Items
      `);

      const categoryStats = await databaseConfig.query(`
        SELECT category, COUNT(*) as count
        FROM Items
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
        LIMIT 5
      `);

      return {
        overview: result.rows[0],
        top_categories: categoryStats.rows
      };

    } catch (error) {
      throw new Error(`Failed to get items statistics: ${error.message}`);
    }
  }

  async getSearchServiceHealth() {
    // Test search functionality
    try {
      const testResult = await databaseConfig.searchItems('test', {}, 0, 1);
      
      return {
        status: 'healthy',
        test_search: {
          executed: true,
          results_count: testResult.items.length,
          total_available: testResult.total
        }
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async isDatabaseReady() {
    try {
      const result = await databaseConfig.query('SELECT 1');
      return result.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  async isCacheReady() {
    try {
      const redisHealth = await redisConfig.healthCheck();
      return redisHealth.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  async isItemsTableReady() {
    try {
      const result = await databaseConfig.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'items'
        );
      `);
      return result.rows[0].exists;
    } catch (error) {
      return false;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new HealthController();
