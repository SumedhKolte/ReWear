const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils');

class AuthMiddleware {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  /**
   * Verify JWT token and extract user information
   */
  verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Authorization header is required',
          code: 'MISSING_AUTH_HEADER',
          timestamp: new Date().toISOString()
        });
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      if (!token) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Token is required',
          code: 'MISSING_TOKEN',
          timestamp: new Date().toISOString()
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Add user information to request object
      req.user = {
        id: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role || 'user',
        permissions: decoded.permissions || []
      };

      // Log successful authentication
      logger.debug('User authenticated successfully', {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      next();

    } catch (error) {
      logger.warn('Authentication failed', {
        error: error.message,
        token: req.headers.authorization?.substring(0, 20) + '...',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      if (error.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Token has expired',
          code: 'TOKEN_EXPIRED',
          timestamp: new Date().toISOString()
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Invalid token',
          code: 'INVALID_TOKEN',
          timestamp: new Date().toISOString()
        });
      }

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Optional authentication - doesn't fail if no token provided
   */
  optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.user = null;
      return next();
    }

    // Use verifyToken but don't fail on error
    this.verifyToken(req, res, (error) => {
      if (error) {
        req.user = null;
      }
      next();
    });
  }

  /**
   * Check if user has required role
   */
  requireRole(requiredRole) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        });
      }

      if (req.user.role !== requiredRole && req.user.role !== 'admin') {
        logger.warn('Insufficient permissions', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRole,
          endpoint: req.originalUrl
        });

        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: `${requiredRole} role required`,
          code: 'INSUFFICIENT_PERMISSIONS',
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  }

  /**
   * Check if user has specific permission
   */
  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        });
      }

      if (!req.user.permissions.includes(permission) && req.user.role !== 'admin') {
        logger.warn('Missing permission', {
          userId: req.user.id,
          userPermissions: req.user.permissions,
          requiredPermission: permission,
          endpoint: req.originalUrl
        });

        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: `Permission '${permission}' required`,
          code: 'MISSING_PERMISSION',
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  }

  /**
   * Check if user owns the resource (for Items)
   */
  requireOwnership(req, res, next) {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        timestamp: new Date().toISOString()
      });
    }

    // Extract uploaderId from request params or body
    const resourceOwnerId = req.params.uploaderId || req.body.uploaderId;
    
    if (!resourceOwnerId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Resource owner ID not found',
        code: 'MISSING_OWNER_ID',
        timestamp: new Date().toISOString()
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    if (req.user.id !== resourceOwnerId) {
      logger.warn('Unauthorized resource access attempt', {
        userId: req.user.id,
        resourceOwnerId,
        endpoint: req.originalUrl
      });

      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Access denied. You can only access your own resources',
        code: 'RESOURCE_ACCESS_DENIED',
        timestamp: new Date().toISOString()
      });
    }

    next();
  }

  /**
   * API Key authentication for service-to-service communication
   */
  verifyApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

    if (!apiKey) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'API key is required',
        code: 'MISSING_API_KEY',
        timestamp: new Date().toISOString()
      });
    }

    if (!validApiKeys.includes(apiKey)) {
      logger.warn('Invalid API key attempt', {
        apiKey: apiKey.substring(0, 8) + '...',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid API key',
        code: 'INVALID_API_KEY',
        timestamp: new Date().toISOString()
      });
    }

    // Set service flag for internal requests
    req.isServiceRequest = true;
    next();
  }

  /**
   * Rate limiting per user
   */
  userRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const userRequests = new Map();

    return (req, res, next) => {
      if (!req.user) {
        return next();
      }

      const userId = req.user.id;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      if (userRequests.has(userId)) {
        const userRequestList = userRequests.get(userId);
        const validRequests = userRequestList.filter(timestamp => timestamp > windowStart);
        userRequests.set(userId, validRequests);
      }

      // Check current user's request count
      const currentRequests = userRequests.get(userId) || [];
      
      if (currentRequests.length >= maxRequests) {
        logger.warn('User rate limit exceeded', {
          userId,
          requestCount: currentRequests.length,
          maxRequests,
          windowMs
        });

        return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
          success: false,
          error: 'Rate limit exceeded',
          code: 'USER_RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(windowMs / 1000),
          timestamp: new Date().toISOString()
        });
      }

      // Add current request
      currentRequests.push(now);
      userRequests.set(userId, currentRequests);

      next();
    };
  }
}

module.exports = new AuthMiddleware();
