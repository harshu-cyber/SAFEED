// ============================================================
// SafeED-UP — Inspection Service
// ============================================================
const Inspection = require('../models/Inspection.model');
const Institution = require('../models/Institution.model');
const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const { buildPaginationMeta } = require('../utils/apiResponse');
const { INSPECTION_STATUS, ROLES: STATUS_ROLES } = require('../constants/statusTypes');
const { ROLES } = require('../constants/roles');
const { sendInspectionScheduledEmail } = require('./email.service');

class InspectionService {
  async schedule(data, scheduledByUser) {
    const institution = await Institution.findById(data.institutionId);
    if (!institution) {
      const err = new Error('Institution not found.');
      err.statusCode = 404;
      throw err;
    }

    const inspector = await User.findById(data.inspectorId);
    if (!inspector) {
      const err = new Error('Assigned inspector not found.');
      err.statusCode = 404;
      throw err;
    }

    const inspection = await Inspection.create({
      ...data,
      scheduledBy: scheduledByUser._id,
      status: INSPECTION_STATUS.SCHEDULED,
    });

    // Notify Inspector
    await Notification.create({
      userId: inspector._id,
      type: 'INFO',
      title: 'New Inspection Assigned',
      message: `You have been assigned an inspection for ${institution.name} scheduled for ${new Date(data.scheduledDate).toLocaleDateString('en-IN')}.`,
      link: `/dashboard/inspector/inspections/${inspection._id}`,
      module: 'INSPECTION',
      referenceId: inspection._id,
    });

    // Notify Institution Admin
    const instAdmin = await User.findById(institution.adminUserId);
    if (instAdmin) {
      await Notification.create({
        userId: instAdmin._id,
        type: 'WARNING',
        title: 'Safety Inspection Scheduled',
        message: `An official inspection has been scheduled for ${new Date(data.scheduledDate).toLocaleDateString('en-IN')}.`,
        link: `/dashboard/institution/compliance`,
        module: 'INSPECTION',
        referenceId: inspection._id,
      });

      sendInspectionScheduledEmail(instAdmin, inspection, institution).catch(console.error);
    }

    return inspection;
  }

  async list({ page = 1, limit = 20, status, inspectionType, district, inspectorId, institutionId, userId, userRole }) {
    const query = {};

    if (status) query.status = status;
    if (inspectionType) query.inspectionType = inspectionType;
    if (inspectorId) query.inspectorId = inspectorId;
    if (institutionId) query.institutionId = institutionId;

    if (userRole === ROLES.INSPECTION_OFFICER) {
      query.inspectorId = userId;
    } else if (userRole === ROLES.SCHOOL_ADMIN || userRole === ROLES.COACHING_ADMIN) {
      const user = await User.findById(userId);
      if (user?.institutionId) {
        query.institutionId = user.institutionId;
      }
    }

    const skip = (page - 1) * limit;
    const [inspections, total] = await Promise.all([
      Inspection.find(query)
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('institutionId', 'name safeId address type riskLevel')
        .populate('inspectorId', 'name email phone')
        .lean(),
      Inspection.countDocuments(query),
    ]);

    return { inspections, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id) {
    const inspection = await Inspection.findById(id)
      .populate('institutionId')
      .populate('inspectorId', 'name email phone designation')
      .populate('secondaryInspectorId', 'name email phone')
      .populate('approvedBy', 'name designation')
      .lean();

    if (!inspection) {
      const err = new Error('Inspection record not found.');
      err.statusCode = 404;
      throw err;
    }

    return inspection;
  }

  async submitResults(id, { checklistItems, findings, recommendations, actionRequired, overallScore }, inspectorId) {
    const inspection = await Inspection.findById(id);
    if (!inspection) {
      const err = new Error('Inspection not found.');
      err.statusCode = 404;
      throw err;
    }

    if (inspection.inspectorId.toString() !== inspectorId.toString()) {
      const err = new Error('Only the assigned inspector can submit results.');
      err.statusCode = 403;
      throw err;
    }

    inspection.checklistItems = checklistItems;
    inspection.findings = findings;
    inspection.recommendations = recommendations;
    inspection.actionRequired = actionRequired;
    inspection.status = INSPECTION_STATUS.COMPLETED;
    inspection.conductedDate = new Date();
    inspection.completedAt = new Date();

    if (overallScore !== undefined) {
      inspection.overallPercentage = overallScore;
    }

    await inspection.save();

    // Update institution last inspection date & compliance score
    await Institution.findByIdAndUpdate(inspection.institutionId, {
      lastInspectionDate: new Date(),
      complianceScore: inspection.overallPercentage,
    });

    return inspection;
  }
}

module.exports = new InspectionService();
