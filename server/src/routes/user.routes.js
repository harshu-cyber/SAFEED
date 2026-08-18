// ============================================================
// SafeED-UP — User Management Routes
// ============================================================
const User = require('../models/User.model');
const { sendSuccess, sendError, buildPaginationMeta } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const { authorizeRoles } = require('../middleware/authorize');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

// List users (Super Admin & State Admin)
router.get('/', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN, ROLES.DISTRICT_ADMIN), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, state, district, search } = req.query;
  const query = {};
  if (role) query.role = role;
  if (state) query.state = state;
  if (district) query.district = district;
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).select('-refreshToken'),
    User.countDocuments(query),
  ]);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'User list retrieved.',
    data: { users },
    meta: buildPaginationMeta(total, page, limit),
  });
}));

// Create official user (Super Admin & State Admin)
router.post('/', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN), asyncHandler(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email.toLowerCase() });
  if (existing) {
    return sendError(res, { statusCode: 409, message: 'User email already registered.' });
  }

  const user = await User.create({
    ...req.body,
    createdBy: req.user._id,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: `Official user account created for ${user.name} (${user.role}).`,
    data: { user: user.toPublicJSON() },
  });
}));

// Toggle active status
router.patch('/:id/toggle-status', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return sendError(res, { statusCode: 404, message: 'User not found.' });
  }
  user.isActive = !user.isActive;
  await user.save();
  return sendSuccess(res, {
    statusCode: 200,
    message: `User status changed to ${user.isActive ? 'Active' : 'Inactive'}.`,
    data: { user: user.toPublicJSON() },
  });
}));

// Delete user permanently (Super Admin only)
router.delete('/:id', authorizeRoles(ROLES.SUPER_ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return sendError(res, { statusCode: 404, message: 'User not found.' });
  }
  if (user.role === ROLES.SUPER_ADMIN) {
    return sendError(res, { statusCode: 403, message: 'Super Admin account cannot be deleted.' });
  }
  await User.findByIdAndDelete(req.params.id);
  return sendSuccess(res, {
    statusCode: 200,
    message: `User account (${user.email}) permanently deleted from database.`,
  });
}));

// GET /api/v1/users/audit-logs (Security Monitoring)
const AuditLog = require('../models/AuditLog.model');
router.get('/audit-logs', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, action, status, search } = req.query;
  const query = {};
  if (action) query.action = action;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { userEmail: new RegExp(search, 'i') },
      { action: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { ipAddress: new RegExp(search, 'i') },
    ];
  }

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    AuditLog.countDocuments(query),
  ]);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Audit logs retrieved successfully.',
    data: { logs },
    meta: buildPaginationMeta(total, page, limit),
  });
}));

module.exports = router;
