// ============================================================
// SafeED-UP — Authentication Middleware
// Verifies JWT access token on protected routes
// ============================================================
const { verifyAccessToken } = require('../utils/tokenUtils');
const User = require('../models/User.model');
const { sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Extract token from Authorization header OR HttpOnly cookie
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.signedCookies?.accessToken) {
    token = req.signedCookies.accessToken;
  }

  if (!token) {
    return sendError(res, {
      statusCode: 401,
      message: 'Access denied. No authentication token provided.',
    });
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, { statusCode: 401, message: 'Session expired. Please login again.' });
    }
    return sendError(res, { statusCode: 401, message: 'Invalid authentication token.' });
  }

  // Verify user still exists
  let user;
  if (require('mongoose').connection.readyState !== 1) {
    user = { _id: decoded.id, email: decoded.email, role: decoded.role, isActive: true };
  } else {
    user = await User.findById(decoded.id).select('+isActive +isEmailVerified');
    if (!user) {
      return sendError(res, { statusCode: 401, message: 'User associated with this token no longer exists.' });
    }
  }

  if (!user.isActive) {
    return sendError(res, { statusCode: 403, message: 'Your account has been deactivated. Contact administrator.' });
  }

  req.user = user;
  next();
});

module.exports = authenticate;
