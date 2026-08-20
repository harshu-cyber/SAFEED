// ============================================================
// SafeED-UP — QR Code Routes
// ============================================================
const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const documentService = require('../services/document.service');
const qrService = require('../services/qr.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);

// GET /api/v1/qr/institution/:institutionId/status
router.get('/institution/:institutionId/status', asyncHandler(async (req, res) => {
  const compliance = await documentService.getCompliance(req.params.institutionId);

  if (compliance.qrUnlocked) {
    let qrRecord = await qrService.getForInstitution(req.params.institutionId);
    if (!qrRecord) {
      qrRecord = await qrService.generateForInstitution(req.params.institutionId, req.user._id);
    }
    return sendSuccess(res, {
      statusCode: 200,
      message: 'All safety documents approved. Safe ID & QR Code unlocked.',
      data: {
        unlocked: true,
        safeId: compliance.safeId || qrRecord?.safeId,
        qrCodeBase64: qrRecord?.qrCodeBase64,
        verificationUrl: qrRecord?.verificationUrl,
      },
    });
  }

  return sendSuccess(res, {
    statusCode: 200,
    message: 'QR Code remains locked until all mandatory documents are approved.',
    data: {
      unlocked: false,
      message: 'QR Code remains locked until all 4 mandatory safety documents (FIRE_SAFETY, BUILDING_SAFETY, ELECTRICAL_SAFETY, EVACUATION_SAFETY) are approved by the assigned inspector.',
      documents: compliance.documents,
    },
  });
}));

module.exports = router;
