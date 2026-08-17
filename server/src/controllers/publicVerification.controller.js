// ============================================================
// SafeED-UP — Public Verification Controller
// ============================================================
const Institution = require('../models/Institution.model');
const SafeID = require('../models/SafeID.model');
const Document = require('../models/Document.model');
const Inspection = require('../models/Inspection.model');
const qrService = require('../services/qr.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/v1/public/verify/:safeId
const verifyInstitution = asyncHandler(async (req, res) => {
  const { safeId } = req.params;

  const institution = await Institution.findOne({ safeId, isPubliclyVisible: true })
    .select('name type address status verificationStatus riskLevel complianceScore safeId lastInspectionDate nextInspectionDue totalStudents affiliationBoard qrCodeBase64')
    .lean();

  if (!institution) {
    return sendError(res, {
      statusCode: 404,
      message: 'Institution not found. This Safe ID may be invalid or the institution may be inactive.',
    });
  }

  // Log the QR scan
  await qrService.logScan(safeId);

  // Get document summary (count by status)
  const docStats = await Document.aggregate([
    { $match: { institutionId: institution._id, isLatestVersion: true } },
    { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
  ]);

  const documentSummary = docStats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, { APPROVED: 0, PENDING: 0, REJECTED: 0, EXPIRED: 0 });

  // Get last inspection summary
  const lastInspection = await Inspection.findOne({
    institutionId: institution._id,
    status: 'COMPLETED',
  })
    .sort({ conductedDate: -1 })
    .select('inspectionId inspectionType conductedDate overallPercentage findings')
    .lean();

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Institution verified successfully.',
    data: {
      institution,
      documentSummary,
      lastInspection,
      verifiedAt: new Date().toISOString(),
    },
  });
});

// POST /api/v1/public/qr-scan/:safeId
const logQRScan = asyncHandler(async (req, res) => {
  const record = await qrService.logScan(req.params.safeId);
  if (!record) {
    return sendError(res, { statusCode: 404, message: 'Safe ID not found.' });
  }
  return sendSuccess(res, { statusCode: 200, message: 'Scan logged.', data: { scanCount: record.scanCount } });
});

// GET /api/v1/public/stats
const getPublicStats = asyncHandler(async (req, res) => {
  const Deficiency = require('../models/Deficiency.model');

  const [
    totalInstitutions,
    policeVerified,
    fireCertified,
    safeIdIssued,
    completedInspections,
    openDeficiencies,
  ] = await Promise.all([
    Institution.countDocuments(),
    Institution.countDocuments({ verificationStatus: 'VERIFIED' }),
    Institution.countDocuments({ complianceScore: { $gte: 70 } }),
    Institution.countDocuments({ safeId: { $ne: null, $exists: true } }),
    Inspection.countDocuments({ status: 'COMPLETED' }),
    Deficiency.countDocuments({ status: 'OPEN' }),
  ]);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Public stats retrieved successfully.',
    data: {
      totalInstitutions,
      policeVerified,
      fireCertified,
      safeIdIssued,
      completedInspections,
      openDeficiencies,
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = { verifyInstitution, logQRScan, getPublicStats };

