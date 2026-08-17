// ============================================================
// SafeED-UP — Central Error Handler Middleware
// ============================================================
const env = require('../config/env');
const { sendError } = require('../utils/apiResponse');
const AuditLog = require('../models/AuditLog.model');

const errorHandler = async (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = 'Validation failed';

    // Log to console in dev
    if (env.NODE_ENV === 'development') {
      console.error('❌ ValidationError:', err);
    }

    return sendError(res, { statusCode, message, errors });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    return sendError(res, { statusCode, message });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    return sendError(res, { statusCode, message });
  }

  // JWT Errors (handled in authenticate, but belt-and-suspenders)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
    return sendError(res, { statusCode, message });
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired.';
    return sendError(res, { statusCode, message });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = `File too large. Maximum allowed size is ${env.MAX_FILE_SIZE_MB}MB.`;
    return sendError(res, { statusCode, message });
  }

  // Log unhandled errors
  if (env.NODE_ENV === 'development') {
    console.error('❌ Unhandled Error:', err);
  }

  // Persist error to audit log (non-blocking)
  try {
    if (statusCode >= 500) {
      await AuditLog.create({
        userId: req.user?._id || null,
        userEmail: req.user?.email || 'anonymous',
        userRole: req.user?.role || 'SYSTEM',
        action: 'UNHANDLED_ERROR',
        module: 'SYSTEM',
        description: message,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'FAILURE',
        errorMessage: err.message,
      });
    }
  } catch (_) {
    // Audit logging must never crash the response
  }

  // In production, mask internal error details
  const responseMessage =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'Something went wrong. Please try again later.'
      : message;

  return sendError(res, { statusCode, message: responseMessage });
};

module.exports = errorHandler;
