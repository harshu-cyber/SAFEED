// ============================================================
// SafeED-UP — Auth Controller
// ============================================================
const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.cookie('accessToken', result.accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Institution account registered successfully. Your login credentials have been auto-generated.',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      // Auto-generated credentials for popup display
      credentials: result.credentials,
    },
  });
});

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  res.cookie('accessToken', result.accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Login successful.',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

// POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Logged out successfully.',
  });
});

// POST /api/v1/auth/refresh-token
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return sendError(res, { statusCode: 401, message: 'No refresh token provided.' });
  }

  const result = await authService.refreshAccessToken(token);

  res.cookie('accessToken', result.accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Token refreshed successfully.',
    data: { accessToken: result.accessToken },
  });
});

// GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  const publicData = req.user.toPublicJSON ? req.user.toPublicJSON() : req.user;
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Profile retrieved successfully.',
    data: { user: publicData },
  });
});

// POST /api/v1/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);

  // Always success to prevent email enumeration
  return sendSuccess(res, {
    statusCode: 200,
    message: 'If an account with that email exists, a password reset link has been sent.',
  });
});

// POST /api/v1/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  await authService.resetPassword(token, password);

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Password reset successfully. Please login with your new password.',
  });
});

// PATCH /api/v1/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(req.user._id, currentPassword, newPassword);

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Password changed successfully. Please login again.',
  });
});

// GET /api/v1/auth/setup-superadmin
const setupSuperAdmin = asyncHandler(async (req, res) => {
  const User = require('../models/User.model');
  const Institution = require('../models/Institution.model');
  const Inspection = require('../models/Inspection.model');
  const Document = require('../models/Document.model');
  const Compliance = require('../models/Compliance.model');
  const Deficiency = require('../models/Deficiency.model');
  const EmergencyPlan = require('../models/EmergencyPlan.model');
  const SafeID = require('../models/SafeID.model');
  const { ROLES } = require('../constants/roles');

  await User.deleteMany({});
  await Institution.deleteMany({});
  await Inspection.deleteMany({});
  await Document.deleteMany({});
  await Compliance.deleteMany({});
  await Deficiency.deleteMany({});
  await EmergencyPlan.deleteMany({});
  await SafeID.deleteMany({});

  const superAdmin = await User.create({
    name: 'Super Admin (SafeED)',
    email: 'superadmin@safeed.ac.in',
    password: 'harshsafeed',
    role: ROLES.SUPER_ADMIN,
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    isActive: true,
    isEmailVerified: true,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Database cleared and Super Admin superadmin@safeed.ac.in created successfully.',
    data: {
      email: superAdmin.email,
      role: superAdmin.role,
    },
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  setupSuperAdmin,
};
