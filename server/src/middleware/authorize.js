// ============================================================
// SafeED-UP — Authorization Middleware (RBAC)
// ============================================================
const { ROLE_PERMISSIONS } = require('../constants/roles');
const { sendError } = require('../utils/apiResponse');

/**
 * Authorize based on allowed roles
 * Usage: authorize('SUPER_ADMIN', 'STATE_ADMIN')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { statusCode: 401, message: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: 403,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }
    next();
  };
};

/**
 * Authorize based on a required permission
 * Usage: authorizePermission('verify_institution')
 */
const authorizePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { statusCode: 401, message: 'Authentication required.' });
    }
    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    if (!userPermissions.includes(requiredPermission)) {
      return sendError(res, {
        statusCode: 403,
        message: 'You do not have permission to perform this action.',
      });
    }
    next();
  };
};

module.exports = { authorizeRoles, authorizePermission };
