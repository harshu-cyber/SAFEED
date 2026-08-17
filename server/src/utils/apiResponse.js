// ============================================================
// SafeED-UP — Standard API Response Utility
// ============================================================

/**
 * Send a success response
 */
const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 */
const sendError = (res, { statusCode = 500, message = 'Internal Server Error', errors = null } = {}) => {
  const response = { success: false, message };
  if (errors !== null) response.errors = errors;
  return res.status(statusCode).json(response);
};

/**
 * Build pagination meta object
 */
const buildPaginationMeta = (total, page, limit) => ({
  total,
  page: parseInt(page, 10),
  limit: parseInt(limit, 10),
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

module.exports = { sendSuccess, sendError, buildPaginationMeta };
