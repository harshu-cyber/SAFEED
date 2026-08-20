// ============================================================
// SafeED-UP — Rate Limiter Configuration (Lenient for Production)
// ============================================================
const rateLimit = require('express-rate-limit');

// Pass-through middleware when rate limiters are bypassed
const passThrough = (req, res, next) => next();

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // 10,000 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => true, // Bypassed for cloud reverse-proxies
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => true,
});

const publicLimiter = passThrough;
const uploadLimiter = passThrough;

module.exports = { globalLimiter, authLimiter, publicLimiter, uploadLimiter };

