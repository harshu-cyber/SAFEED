// ============================================================
// SafeED-UP — Audit Logger Middleware
// Logs every state-changing request automatically
// ============================================================
const AuditLog = require('../models/AuditLog.model');

/**
 * Factory: creates an audit log entry middleware
 * @param {string} action - e.g. 'INSTITUTION_VERIFIED'
 * @param {string} module - e.g. 'INSTITUTION'
 * @param {Function} targetIdExtractor - extracts targetId from req (optional)
 */
const auditLog = (action, module, targetIdExtractor = null) => {
  return async (req, res, next) => {
    // Capture original json method to intercept response
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      // Log after the response is formed
      try {
        await AuditLog.create({
          userId: req.user?._id || null,
          userEmail: req.user?.email || 'anonymous',
          userRole: req.user?.role || 'SYSTEM',
          action,
          module,
          targetId: targetIdExtractor ? targetIdExtractor(req) : (req.params?.id || null),
          description: `${action} by ${req.user?.email || 'anonymous'}`,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('User-Agent'),
          status: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE',
          errorMessage: body?.success === false ? body?.message : null,
        });
      } catch (_) {
        // Audit logging must never block responses
      }
      return originalJson(body);
    };

    next();
  };
};

module.exports = auditLog;
