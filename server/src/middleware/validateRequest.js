// ============================================================
// SafeED-UP — Request Validation Middleware (express-validator)
// ============================================================
const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));
    return sendError(res, {
      statusCode: 422,
      message: 'Validation failed. Please check your input.',
      errors: formattedErrors,
    });
  }
  next();
};

module.exports = validateRequest;
