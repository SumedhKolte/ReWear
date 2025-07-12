const express = require('express');
const { middlewareManager } = require('./middleware');
const routes = require('./routes');
const logger = require('./utils/logger');
const config = require('./config');
const databaseConfig = require('./config/database');
const redisConfig = require('./config/redis');

class Application {
  constructor() {
    this.app = express();
    this.config = config.get();
    this.isShuttingDown = false;
  }

  async initialize() {
    try {
      logger.info('Initializing Items Search API...');

      // Initialize configurations
      await this.initializeConfigurations();

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      logger.info('Items Search API initialized successfully', {
        environment: this.config.app.env,
        version: this.config.app.version
      });

      return this.app;

    } catch (error) {
      logger.error('Failed to initialize application', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async initializeConfigurations() {
    try {
      // Print configuration (without sensitive data)
      config.printConfiguration();

      // Initialize database connection
      logger.info('Initializing database connection...');
      await databaseConfig.initialize();

      // Initialize Redis connection
      logger.info('Initializing Redis connection...');
      await redisConfig.initialize();

      logger.info('All configurations initialized successfully');

    } catch (error) {
      logger.error('Configuration initialization failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  setupMiddleware() {
    logger.info('Setting up middleware...');

    // Security middleware
    middlewareManager.setupSecurity(this.app);

    // Logging middleware
    middlewareManager.setupLogging(this.app);

    // Rate limiting
    middlewareManager.setupRateLimiting(this.app);

    // Request timeout
    this.app.use(middlewareManager.requestTimeout(30000));

    logger.info('Middleware setup completed');
  }

  setupRoutes() {
    logger.info('Setting up routes...');

    // Mount all routes
    this.app.use('/', routes);

    logger.info('Routes setup completed');
  }

  setupErrorHandling() {
    logger.info('Setting up error handling...');

    // 404 handler
    this.app.use(middlewareManager.notFoundHandler);

    // Global error handler
    this.app.use(middlewareManager.errorHandler);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
      });
      
      this.gracefulShutdown('SIGTERM', 1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack,
        promise: promise.toString()
      });
      
      this.gracefulShutdown('SIGTERM', 1);
    });

    logger.info('Error handling setup completed');
  }

  setupGracefulShutdown() {
    logger.info('Setting up graceful shutdown handlers...');

    // Handle shutdown signals
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));

    // Handle PM2 shutdown
    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        this.gracefulShutdown('PM2_SHUTDOWN');
      }
    });

    logger.info('Graceful shutdown handlers setup completed');
  }

  async gracefulShutdown(signal, exitCode = 0) {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress, forcing exit...');
      process.exit(1);
    }

    this.isShuttingDown = true;

    logger.info(`Received ${signal}, starting graceful shutdown...`);

    try {
      // Stop accepting new connections
      if (this.server) {
        logger.info('Closing HTTP server...');
        await new Promise((resolve, reject) => {
          this.server.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        logger.info('HTTP server closed');
      }

      // Close database connections
      logger.info('Closing database connections...');
      await databaseConfig.gracefulShutdown();

      // Close Redis connections
      logger.info('Closing Redis connections...');
      await redisConfig.gracefulShutdown();

      logger.info('Graceful shutdown completed successfully');
      process.exit(exitCode);

    } catch (error) {
      logger.error('Error during graceful shutdown', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    }
  }

  async start(port = null) {
    try {
      const serverPort = port || this.config.app.port;

      this.server = this.app.listen(serverPort, () => {
        logger.info('Items Search API server started', {
          port: serverPort,
          environment: this.config.app.env,
          version: this.config.app.version,
          pid: process.pid
        });

        // Log server URLs
        logger.info('Server URLs:', {
          local: `http://localhost:${serverPort}`,
          health: `http://localhost:${serverPort}/health`,
          api_docs: `http://localhost:${serverPort}/`,
          search: `http://localhost:${serverPort}/api/search`
        });
      });

      // Handle server errors
      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${serverPort} is already in use`);
        } else {
          logger.error('Server error', { error: error.message });
        }
        process.exit(1);
      });

      return this.server;

    } catch (error) {
      logger.error('Failed to start server', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  getApp() {
    return this.app;
  }

  getServer() {
    return this.server;
  }
}

module.exports = Application;
