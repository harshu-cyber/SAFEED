// ============================================================
// SafeED-UP — Rate Limiter Configuration
// ============================================================
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { sendError } = require('../utils/apiResponse');

// Global API rate limiter
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, {
      statusCode: 429,
      message: 'Too many requests. Please try again after 15 minutes.',
    });
  },
});

// Strict limiter for auth routes (5 per 15 min)
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, {
      statusCode: 429,
      message: 'Too many login attempts. Please try again after 15 minutes.',
    });
  },
});

// More lenient limiter for public verification (100 per 5 min)
const publicLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, {
      statusCode: 429,
      message: 'Too many verification requests.',
    });
  },
});

// Upload rate limiter (20 file uploads per 15 min)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, {
      statusCode: 429,
      message: 'Upload rate limit reached. Please wait before uploading more files.',
    });
  },
});

module.exports = { globalLimiter, authLimiter, publicLimiter, uploadLimiter };
