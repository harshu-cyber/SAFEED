// ============================================================
// SafeED-UP — Institution Controller
// ============================================================
const institutionService = require('../services/institution.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/v1/institutions
const register = asyncHandler(async (req, res) => {
  const institution = await institutionService.register(req.body, req.user);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Institution registered successfully. Awaiting verification.',
    data: { institution },
  });
});

// GET /api/v1/institutions
const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, type, district, state, riskLevel, search } = req.query;
  const { institutions, meta } = await institutionService.list({
    page: parseInt(page),
    limit: parseInt(limit),
    status, type, district, state, riskLevel, search,
    userId: req.user._id,
    userRole: req.user.role,
  });
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Institutions retrieved successfully.',
    data: { institutions },
    meta,
  });
});

// GET /api/v1/institutions/:id
const getById = asyncHandler(async (req, res) => {
  const institution = await institutionService.getById(req.params.id, req.user._id, req.user.role);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Institution retrieved successfully.',
    data: { institution },
  });
});

// PATCH /api/v1/institutions/:id
const update = asyncHandler(async (req, res) => {
  const institution = await institutionService.update(req.params.id, req.body, req.user._id, req.user.role);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Institution updated successfully.',
    data: { institution },
  });
});

// PATCH /api/v1/institutions/:id/verify
const verify = asyncHandler(async (req, res) => {
  const { action, rejectionReason } = req.body;
  if (!['APPROVE', 'REJECT'].includes(action)) {
    return sendError(res, { statusCode: 400, message: "Action must be 'APPROVE' or 'REJECT'." });
  }
  const institution = await institutionService.verify(req.params.id, req.user._id, action, rejectionReason);
  return sendSuccess(res, {
    statusCode: 200,
    message: `Institution ${action === 'APPROVE' ? 'verified' : 'rejected'} successfully.`,
    data: { institution },
  });
});

// GET /api/v1/institutions/map-data
const getMapData = asyncHandler(async (req, res) => {
  const { district, state, riskLevel, type } = req.query;
  const filters = {};
  if (district) filters['address.district'] = district;
  if (state) filters['address.state'] = state;
  if (riskLevel) filters.riskLevel = riskLevel;
  if (type) filters.type = type;

  const institutions = await institutionService.getMapData(filters);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Map data retrieved successfully.',
    data: { institutions },
  });
});

module.exports = { register, list, getById, update, verify, getMapData };
