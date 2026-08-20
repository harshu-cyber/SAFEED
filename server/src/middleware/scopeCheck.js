// ============================================================
// SafeED-UP — Backend Resource Scope Enforcement Middleware
// Enforces District, Institution, and Assigned Inspector Scoping
// ============================================================
const { ROLES } = require('../constants/roles');
const { sendError } = require('../utils/apiResponse');

/**
 * Ensures user has authority over requested district scope
 */
const enforceDistrictScope = (districtParamName = 'district') => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { statusCode: 401, message: 'Authentication required.' });
    }

    const { role, district: userDistrict } = req.user;

    // Super Admin and State Admin have statewide scope
    if (role === ROLES.SUPER_ADMIN || role === ROLES.STATE_ADMIN) {
      return next();
    }

    const targetDistrict = req.params[districtParamName] || req.query[districtParamName] || req.body[districtParamName];

    // If a specific district is targeted, verify user's jurisdiction
    if (targetDistrict && userDistrict && targetDistrict.toLowerCase() !== userDistrict.toLowerCase()) {
      return sendError(res, {
        statusCode: 403,
        message: `Access denied. You do not have permission for district '${targetDistrict}'. Your assigned district is '${userDistrict}'.`,
      });
    }

    next();
  };
};

/**
 * Ensures Institution Admin can only access their own institution
 */
const enforceInstitutionScope = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { statusCode: 401, message: 'Authentication required.' });
    }

    const { role, institutionId, email, _id, id } = req.user;

    // Admins, Officers, and Institution Admins uploading for their session pass scoping
    if (
      [ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN, ROLES.DISTRICT_ADMIN, ROLES.POLICE_OFFICER, ROLES.FIRE_OFFICER, ROLES.INSPECTION_OFFICER, ROLES.SCHOOL_ADMIN, ROLES.COACHING_ADMIN].includes(role)
    ) {
      return next();
    }

    const targetId = String(req.params[paramName] || req.body.institutionId || req.query.institutionId || '').toLowerCase().trim();
    const userInstId = String(institutionId || '').toLowerCase().trim();
    const userId = String(_id || id || '').toLowerCase().trim();
    const userEmail = String(email || '').toLowerCase().trim();

    if (targetId && targetId !== 'inst_user' && userInstId && targetId !== userInstId && targetId !== userId && targetId !== userEmail) {
      return sendError(res, {
        statusCode: 403,
        message: 'Access denied. You are only authorized to access your own institution data.',
      });
    }

    next();
  };
};

module.exports = {
  enforceDistrictScope,
  enforceInstitutionScope,
};
