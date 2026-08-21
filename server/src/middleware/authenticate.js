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

  if (!token || typeof token !== 'string' || token.trim() === '') {
    return sendError(res, { statusCode: 401, message: 'Authentication required. Please log in.' });
  }

  // Reject fake token strings explicitly
  if (token.startsWith('inst_') || token.startsWith('officer_') || token.startsWith('demo_') || token.startsWith('admin_')) {
    return sendError(res, { statusCode: 401, message: 'Invalid or fake token provided. Please log in with valid credentials.' });
  }

  let decoded = null;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    return sendError(res, { statusCode: 401, message: 'Invalid or expired access token. Please log in again.' });
  }

  if (!decoded || (!decoded.id && !decoded._id)) {
    return sendError(res, { statusCode: 401, message: 'Invalid token payload.' });
  }

  const userId = decoded.id || decoded._id;
  const user = await User.findById(userId).select('+isActive +isEmailVerified');

  if (!user) {
    return sendError(res, { statusCode: 401, message: 'User account not found.' });
  }

  if (user.isActive === false) {
    return sendError(res, { statusCode: 403, message: 'Your account has been deactivated. Contact administrator.' });
  }

  // Auto-heal missing institutionId linkage for institution admins
  if (!user.institutionId && (user.role === 'SCHOOL_ADMIN' || user.role === 'COACHING_ADMIN')) {
    const Institution = require('../models/Institution.model');
    const inst = await Institution.findOne({
      $or: [
        { adminUserId: user._id },
        { email: user.email.toLowerCase() },
        { 'contactPerson.email': user.email.toLowerCase() },
      ],
    });
    if (inst) {
      user.institutionId = inst._id;
      await User.findByIdAndUpdate(user._id, { institutionId: inst._id });
      if (!inst.adminUserId) {
        inst.adminUserId = user._id;
        await inst.save();
      }
    }
  }

  req.user = user;
  next();
});

module.exports = authenticate;
