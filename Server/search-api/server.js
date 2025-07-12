#!/usr/bin/env node

/**
 * Items Search API Server
 * Production-ready server entry point
 */

const Application = require('./src/app');
const logger = require('./src/utils/logger');
const config = require('./src/config');

// Handle uncaught exceptions before anything else
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

/**
 * Main server startup function
 */
async function startServer() {
  try {
    logger.info('Starting Items Search API server...');

    // Get configuration
    const appConfig = config.get();
    const port = process.env.PORT || appConfig.app.port || 3000;

    // Initialize application
    const application = new Application();
    await application.initialize();

    // Start server
    const server = await application.start(port);

    // Log startup success
    logger.info('Items Search API server started successfully', {
      port,
      environment: appConfig.app.env,
      version: appConfig.app.version,
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    });

    // Handle server shutdown gracefully
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      try {
        // Stop accepting new connections
        server.close(() => {
          logger.info('HTTP server closed');
        });

        // Give existing connections time to finish
        setTimeout(() => {
          logger.info('Forcing server shutdown');
          process.exit(0);
        }, 10000); // 10 second timeout

      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle PM2 shutdown
    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        gracefulShutdown('PM2_SHUTDOWN');
      }
    });

    return server;

  } catch (error) {
    logger.error('Failed to start server:', {
      error: error.message,
      stack: error.stack
    });
    
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Development mode with auto-restart
 */
if (process.env.NODE_ENV === 'development') {
  // Enable source map support for better error traces
  try {
    require('source-map-support').install();
  } catch (e) {
    // source-map-support is optional
  }

  logger.info('Running in development mode');
}

/**
 * Production optimizations
 */
if (process.env.NODE_ENV === 'production') {
  // Set process title for easier identification
  process.title = 'items-search-api';

  // Optimize garbage collection
  if (process.env.NODE_GC_OPTIMIZATION === 'true') {
    // These flags should be set via NODE_OPTIONS environment variable
    logger.info('Garbage collection optimization enabled');
  }

  logger.info('Running in production mode');
}

/**
 * Memory monitoring
 */
if (process.env.MEMORY_MONITORING === 'true') {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const formatBytes = (bytes) => Math.round(bytes / 1024 / 1024 * 100) / 100;

    logger.debug('Memory usage:', {
      rss: `${formatBytes(memUsage.rss)} MB`,
      heapTotal: `${formatBytes(memUsage.heapTotal)} MB`,
      heapUsed: `${formatBytes(memUsage.heapUsed)} MB`,
      external: `${formatBytes(memUsage.external)} MB`,
      arrayBuffers: `${formatBytes(memUsage.arrayBuffers)} MB`
    });

    // Warn if memory usage is high
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      logger.warn('High memory usage detected', {
        heapUsed: `${formatBytes(memUsage.heapUsed)} MB`
      });
    }
  }, 60000); // Every minute
}

/**
 * Performance monitoring
 */
if (process.env.PERFORMANCE_MONITORING === 'true') {
  const startTime = process.hrtime();
  
  setInterval(() => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const uptime = seconds + nanoseconds / 1e9;
    
    logger.debug('Performance metrics:', {
      uptime: `${Math.round(uptime)} seconds`,
      eventLoopDelay: process.hrtime(),
      activeHandles: process._getActiveHandles().length,
      activeRequests: process._getActiveRequests().length
    });
  }, 300000); // Every 5 minutes
}

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Server startup failed:', error);
    process.exit(1);
  });
}

module.exports = { startServer };
