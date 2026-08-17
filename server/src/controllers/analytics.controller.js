// ============================================================
// SafeED-UP — Analytics Controller
// ============================================================
const Institution = require('../models/Institution.model');
const Inspection = require('../models/Inspection.model');
const Document = require('../models/Document.model');
const Deficiency = require('../models/Deficiency.model');
const User = require('../models/User.model');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/v1/analytics/state
const getStateAnalytics = asyncHandler(async (req, res) => {
  const { state } = req.query;
  const stateFilter = state || req.user.state;

  const [
    totalInstitutions,
    activeInstitutions,
    pendingVerification,
    highRisk,
    totalInspections,
    completedInspections,
    openDeficiencies,
    institutionsByType,
    institutionsByRisk,
    institutionsByDistrict,
    monthlyInspections,
  ] = await Promise.all([
    Institution.countDocuments({ 'address.state': stateFilter }),
    Institution.countDocuments({ 'address.state': stateFilter, status: 'ACTIVE' }),
    Institution.countDocuments({ 'address.state': stateFilter, verificationStatus: 'UNVERIFIED' }),
    Institution.countDocuments({ 'address.state': stateFilter, riskLevel: { $in: ['HIGH', 'CRITICAL'] } }),
    Inspection.countDocuments(),
    Inspection.countDocuments({ status: 'COMPLETED' }),
    Deficiency.countDocuments({ status: 'OPEN' }),
    Institution.aggregate([
      { $match: { 'address.state': stateFilter } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Institution.aggregate([
      { $match: { 'address.state': stateFilter } },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
    ]),
    Institution.aggregate([
      { $match: { 'address.state': stateFilter } },
      { $group: { _id: '$address.district', count: { $sum: 1 }, avgCompliance: { $avg: '$complianceScore' } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    Inspection.aggregate([
      {
        $match: {
          scheduledDate: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $month: '$scheduledDate' },
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
        },
      },
      { $sort: { '_id': 1 } },
    ]),
  ]);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'State analytics retrieved successfully.',
    data: {
      summary: {
        totalInstitutions,
        activeInstitutions,
        pendingVerification,
        highRisk,
        totalInspections,
        completedInspections,
        openDeficiencies,
        complianceRate: totalInstitutions > 0
          ? Math.round((activeInstitutions / totalInstitutions) * 100)
          : 0,
      },
      charts: {
        institutionsByType,
        institutionsByRisk,
        institutionsByDistrict,
        monthlyInspections,
      },
    },
  });
});

// GET /api/v1/analytics/district/:district
const getDistrictAnalytics = asyncHandler(async (req, res) => {
  const { district } = req.params;

  const [
    totalInstitutions,
    activeInstitutions,
    pendingVerification,
    highRiskCount,
    totalInspections,
    openDeficiencies,
    institutionsByType,
    institutionsByRisk,
    avgComplianceScore,
    recentInspections,
  ] = await Promise.all([
    Institution.countDocuments({ 'address.district': district }),
    Institution.countDocuments({ 'address.district': district, status: 'ACTIVE' }),
    Institution.countDocuments({ 'address.district': district, verificationStatus: 'UNVERIFIED' }),
    Institution.countDocuments({ 'address.district': district, riskLevel: { $in: ['HIGH', 'CRITICAL'] } }),
    Inspection.countDocuments(),
    Deficiency.countDocuments({ status: 'OPEN' }),
    Institution.aggregate([
      { $match: { 'address.district': district } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Institution.aggregate([
      { $match: { 'address.district': district } },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
    ]),
    Institution.aggregate([
      { $match: { 'address.district': district } },
      { $group: { _id: null, avg: { $avg: '$complianceScore' } } },
    ]),
    Inspection.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('institutionId', 'name')
      .populate('inspectorId', 'name')
      .lean(),
  ]);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'District analytics retrieved successfully.',
    data: {
      summary: {
        totalInstitutions,
        activeInstitutions,
        pendingVerification,
        highRiskCount,
        totalInspections,
        openDeficiencies,
        avgComplianceScore: avgComplianceScore[0]?.avg?.toFixed(1) || 0,
      },
      charts: {
        institutionsByType,
        institutionsByRisk,
      },
      recentInspections,
    },
  });
});

// GET /api/v1/analytics/institution/:id
const getInstitutionAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [institution, docStats, deficiencyStats, inspections] = await Promise.all([
    Institution.findById(id).select('name complianceScore riskLevel').lean(),
    Document.aggregate([
      { $match: { institutionId: require('mongoose').Types.ObjectId.createFromHexString(id), isLatestVersion: true } },
      { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
    ]),
    Deficiency.aggregate([
      { $match: { institutionId: require('mongoose').Types.ObjectId.createFromHexString(id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Inspection.find({ institutionId: id })
      .sort({ conductedDate: -1 })
      .limit(6)
      .select('inspectionId inspectionType conductedDate overallPercentage status')
      .lean(),
  ]);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Institution analytics retrieved successfully.',
    data: {
      institution,
      documents: docStats,
      deficiencies: deficiencyStats,
      inspectionHistory: inspections,
    },
  });
});

module.exports = { getStateAnalytics, getDistrictAnalytics, getInstitutionAnalytics };
