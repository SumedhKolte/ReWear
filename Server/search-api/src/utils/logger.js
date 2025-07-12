const winston = require('winston');
const path = require('path');

class Logger {
  constructor() {
    this.logger = this.createLogger();
  }

  createLogger() {
    const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    const logFormat = process.env.LOG_FORMAT || 'json';

    // Define log format
    const customFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const logEntry = {
          timestamp,
          level,
          message,
          service: process.env.APP_NAME || 'items-search-api',
          environment: process.env.NODE_ENV || 'development',
          pid: process.pid,
          ...meta
        };

        return logFormat === 'json' 
          ? JSON.stringify(logEntry)
          : `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
      })
    );

    // Create transports
    const transports = [];

    // Console transport
    transports.push(
      new winston.transports.Console({
        level: logLevel,
        format: customFormat,
        handleExceptions: true,
        handleRejections: true
      })
    );

    // File transports for production
    if (process.env.NODE_ENV === 'production') {
      // Error log file
      transports.push(
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'error.log'),
          level: 'error',
          format: customFormat,
          maxsize: 10485760, // 10MB
          maxFiles: 5,
          handleExceptions: true
        })
      );

      // Combined log file
      transports.push(
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'combined.log'),
          format: customFormat,
          maxsize: 10485760, // 10MB
          maxFiles: 10
        })
      );

      // Access log file for HTTP requests
      transports.push(
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'access.log'),
          level: 'info',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
          maxsize: 10485760, // 10MB
          maxFiles: 7
        })
      );
    }

    return winston.createLogger({
      level: logLevel,
      format: customFormat,
      transports,
      exitOnError: false,
      silent: process.env.NODE_ENV === 'test'
    });
  }

  // Log levels
  error(message, meta = {}) {
    this.logger.error(message, this.sanitizeMeta(meta));
  }

  warn(message, meta = {}) {
    this.logger.warn(message, this.sanitizeMeta(meta));
  }

  info(message, meta = {}) {
    this.logger.info(message, this.sanitizeMeta(meta));
  }

  debug(message, meta = {}) {
    this.logger.debug(message, this.sanitizeMeta(meta));
  }

  // HTTP request logging
  http(message, meta = {}) {
    this.logger.info(message, { ...this.sanitizeMeta(meta), type: 'http' });
  }

  // Database query logging
  query(message, meta = {}) {
    this.logger.debug(message, { ...this.sanitizeMeta(meta), type: 'database' });
  }

  // Cache operation logging
  cache(message, meta = {}) {
    this.logger.debug(message, { ...this.sanitizeMeta(meta), type: 'cache' });
  }

  // Search operation logging
  search(message, meta = {}) {
    this.logger.info(message, { ...this.sanitizeMeta(meta), type: 'search' });
  }

  // Security event logging
  security(message, meta = {}) {
    this.logger.warn(message, { ...this.sanitizeMeta(meta), type: 'security' });
  }

  // Performance logging
  performance(message, meta = {}) {
    this.logger.info(message, { ...this.sanitizeMeta(meta), type: 'performance' });
  }

  // Sanitize sensitive data from logs
  sanitizeMeta(meta) {
    if (!meta || typeof meta !== 'object') {
      return meta;
    }

    const sanitized = { ...meta };
    const sensitiveKeys = ['password', 'token', 'authorization', 'cookie', 'secret', 'key'];

    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const lowerKey = key.toLowerCase();
          
          if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
            obj[key] = '***REDACTED***';
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  // Create child logger with additional context
  child(defaultMeta) {
    return {
      error: (message, meta = {}) => this.error(message, { ...defaultMeta, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...defaultMeta, ...meta }),
      info: (message, meta = {}) => this.info(message, { ...defaultMeta, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { ...defaultMeta, ...meta }),
      http: (message, meta = {}) => this.http(message, { ...defaultMeta, ...meta }),
      query: (message, meta = {}) => this.query(message, { ...defaultMeta, ...meta }),
      cache: (message, meta = {}) => this.cache(message, { ...defaultMeta, ...meta }),
      search: (message, meta = {}) => this.search(message, { ...defaultMeta, ...meta }),
      security: (message, meta = {}) => this.security(message, { ...defaultMeta, ...meta }),
      performance: (message, meta = {}) => this.performance(message, { ...defaultMeta, ...meta })
    };
  }
}

module.exports = new Logger();
