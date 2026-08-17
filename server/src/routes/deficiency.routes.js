// ============================================================
// SafeED-UP — Deficiency Controller & Routes
// ============================================================
const Deficiency = require('../models/Deficiency.model');
const Notification = require('../models/Notification.model');
const Institution = require('../models/Institution.model');
const { sendSuccess, sendError, buildPaginationMeta } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { DEFICIENCY_STATUS } = require('../constants/statusTypes');
const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const { authorizePermission } = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/roles');

// Service Logic embedded for simplicity
const listDeficiencies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, severity, institutionId } = req.query;
  const query = {};
  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (institutionId) query.institutionId = institutionId;

  const skip = (page - 1) * limit;
  const [deficiencies, total] = await Promise.all([
    Deficiency.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('institutionId', 'name safeId address')
      .populate('inspectionId', 'inspectionId')
      .lean(),
    Deficiency.countDocuments(query),
  ]);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Deficiencies listed.',
    data: { deficiencies },
    meta: buildPaginationMeta(total, page, limit),
  });
});

const createDeficiency = asyncHandler(async (req, res) => {
  const deficiency = await Deficiency.create({
    ...req.body,
    createdBy: req.user._id,
  });

  const institution = await Institution.findById(req.body.institutionId);
  if (institution) {
    await Notification.create({
      userId: institution.adminUserId,
      type: 'DANGER',
      title: 'Safety Deficiency Issued',
      message: `A ${deficiency.severity} deficiency "${deficiency.title}" has been issued to your institution. Rectification required by ${new Date(deficiency.rectificationDeadline).toLocaleDateString('en-IN')}.`,
      link: `/dashboard/institution/compliance`,
      module: 'DEFICIENCY',
      referenceId: deficiency._id,
    });
  }

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Deficiency record created.',
    data: { deficiency },
  });
});

const resolveDeficiency = asyncHandler(async (req, res) => {
  const { rectificationDescription, rectificationProofUrls } = req.body;
  const deficiency = await Deficiency.findById(req.params.id);

  if (!deficiency) {
    return sendError(res, { statusCode: 404, message: 'Deficiency not found.' });
  }

  deficiency.status = DEFICIENCY_STATUS.IN_PROGRESS;
  deficiency.rectificationDescription = rectificationDescription;
  deficiency.rectificationProofUrls = rectificationProofUrls || [];
  deficiency.rectificationSubmittedAt = new Date();
  deficiency.rectificationSubmittedBy = req.user._id;

  await deficiency.save();

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Rectification proof submitted. Pending verification by inspector.',
    data: { deficiency },
  });
});

const closeDeficiency = asyncHandler(async (req, res) => {
  const { closureRemarks } = req.body;
  const deficiency = await Deficiency.findById(req.params.id);

  if (!deficiency) {
    return sendError(res, { statusCode: 404, message: 'Deficiency not found.' });
  }

  deficiency.status = DEFICIENCY_STATUS.RESOLVED;
  deficiency.closedAt = new Date();
  deficiency.closedBy = req.user._id;
  deficiency.closureRemarks = closureRemarks;

  await deficiency.save();

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Deficiency closed successfully.',
    data: { deficiency },
  });
});

// Route bindings
router.use(authenticate);
router.get('/', listDeficiencies);
router.post('/', authorizePermission(PERMISSIONS.CREATE_DEFICIENCY), createDeficiency);
router.patch('/:id/resolve', resolveDeficiency);
router.patch('/:id/close', authorizePermission(PERMISSIONS.CLOSE_DEFICIENCY), closeDeficiency);

module.exports = router;
