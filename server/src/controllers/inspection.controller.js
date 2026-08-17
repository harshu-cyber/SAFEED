// ============================================================
// SafeED-UP — Inspection Controller
// ============================================================
const inspectionService = require('../services/inspection.service');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const schedule = asyncHandler(async (req, res) => {
  const inspection = await inspectionService.schedule(req.body, req.user);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Inspection scheduled successfully.',
    data: { inspection },
  });
});

const list = asyncHandler(async (req, res) => {
  const { page, limit, status, inspectionType, district, inspectorId, institutionId } = req.query;
  const result = await inspectionService.list({
    page, limit, status, inspectionType, district, inspectorId, institutionId,
    userId: req.user._id,
    userRole: req.user.role,
  });
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Inspections retrieved successfully.',
    data: { inspections: result.inspections },
    meta: result.meta,
  });
});

const getById = asyncHandler(async (req, res) => {
  const inspection = await inspectionService.getById(req.params.id);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Inspection details retrieved.',
    data: { inspection },
  });
});

const submitResults = asyncHandler(async (req, res) => {
  const inspection = await inspectionService.submitResults(req.params.id, req.body, req.user._id);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Inspection report submitted successfully.',
    data: { inspection },
  });
});

module.exports = { schedule, list, getById, submitResults };
