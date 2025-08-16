const rateLimit = require('express-rate-limit');
const config = require('../config');

console.log('Rate limiter loaded with NODE_ENV:', config.NODE_ENV);

// Simple middleware that skips rate limiting in development
const apiLimiter = (req, res, next) => {
  // Skip rate limiting in development mode or when NODE_ENV is undefined
  if (config.NODE_ENV === 'development' || !config.NODE_ENV) {
    console.log('Rate limiting disabled in development mode for:', req.path);
    return next();
  }

  console.log('Rate limiting enabled in production mode for:', req.path);
  // Use rate limiting in production
  return rateLimit({
    windowMs: config.RATE_LIMIT.WINDOW * 60 * 1000,
    max: config.RATE_LIMIT.MAX_REQUESTS,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: config.RATE_LIMIT.WINDOW * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.RATE_LIMIT.WINDOW * 60)
      });
    }
  })(req, res, next);
};

// Auth limiter with higher limits in development
const authLimiter = (req, res, next) => {
  // Use higher limits in development or when NODE_ENV is undefined
  if (config.NODE_ENV === 'development' || !config.NODE_ENV) {
    console.log('Auth rate limiting with high limits in development mode for:', req.path);
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Very high limit in development
      message: {
        error: 'Too many login attempts, please try again later.',
        retryAfter: 15 * 60
      },
      standardHeaders: true,
      legacyHeaders: false
    })(req, res, next);
  }

  console.log('Auth rate limiting enabled in production mode for:', req.path);
  // Production auth limiter
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
      error: 'Too many login attempts, please try again later.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false
  })(req, res, next);
};

// Group creation limiter with very high limits
const groupCreationLimiter = (req, res, next) => {
  // Skip rate limiting in development mode or when NODE_ENV is undefined
  if (config.NODE_ENV === 'development' || !config.NODE_ENV) {
    console.log('Group creation rate limiting disabled in development mode');
    return next();
  }

  console.log('Group creation rate limiting enabled in production mode');
  // Use rate limiting in production
  return rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Allow 100 group creations per 15 minutes
  message: {
    error: 'Too many group creation attempts, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Group creation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many group creation attempts, please try again later.',
      retryAfter: Math.ceil(15 * 60)
    });
  }
  })(req, res, next);
};

module.exports = {
  apiLimiter,
  authLimiter,
  groupCreationLimiter
}; 