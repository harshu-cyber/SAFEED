// ============================================================
// SafeED-UP — JWT Token Utilities
// ============================================================
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign an access token (short-lived: 15m)
 */
const signAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
    issuer: 'safeedup.gov.in',
    audience: 'safeedup-client',
  });
};

/**
 * Sign a refresh token (long-lived: 7d)
 */
const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
    issuer: 'safeedup.gov.in',
    audience: 'safeedup-client',
  });
};

/**
 * Verify an access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: 'safeedup.gov.in',
    audience: 'safeedup-client',
  });
};

/**
 * Verify a refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'safeedup.gov.in',
    audience: 'safeedup-client',
  });
};

/**
 * Generate a random token for email verification / password reset
 */
const generateOpaqueToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

/**
 * Hash an opaque token for secure storage
 */
const hashOpaqueToken = (token) => {
  return require('crypto').createHash('sha256').update(token).digest('hex');
};

/**
 * Build token pair (access + refresh) for a user
 */
const generateTokenPair = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateOpaqueToken,
  hashOpaqueToken,
  generateTokenPair,
};
