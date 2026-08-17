// ============================================================
// SafeED-UP — Compliance Routes & Controller
// ============================================================
const Compliance = require('../models/Compliance.model');
const EmergencyPlan = require('../models/EmergencyPlan.model');
const Institution = require('../models/Institution.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const router = require('express').Router();
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/institution/:id', asyncHandler(async (req, res) => {
  const compliance = await Compliance.find({ institutionId: req.params.id }).sort({ complianceYear: -1 });
  const emergencyPlan = await EmergencyPlan.findOne({ institutionId: req.params.id });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Compliance history fetched.',
    data: { compliance, emergencyPlan },
  });
}));

router.post('/emergency-plan/:institutionId', asyncHandler(async (req, res) => {
  let plan = await EmergencyPlan.findOne({ institutionId: req.params.institutionId });

  if (plan) {
    Object.assign(plan, req.body, { updatedBy: req.user._id });
    await plan.save();
  } else {
    plan = await EmergencyPlan.create({
      ...req.body,
      institutionId: req.params.institutionId,
      updatedBy: req.user._id,
    });
  }

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Emergency readiness plan saved.',
    data: { emergencyPlan: plan },
  });
}));

module.exports = router;
