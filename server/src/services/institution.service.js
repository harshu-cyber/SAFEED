// ============================================================
// SafeED-UP — Institution Service
// ============================================================
const Institution = require('../models/Institution.model');
const SafeID = require('../models/SafeID.model');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const qrService = require('./qr.service');
const { generateSafeId } = require('../utils/safeIdGenerator');
const { buildPaginationMeta } = require('../utils/apiResponse');
const {
  INSTITUTION_STATUS,
  VERIFICATION_STATUS,
  RISK_LEVELS,
} = require('../constants/statusTypes');
const { ROLES } = require('../constants/roles');

class InstitutionService {
  /**
   * Register a new institution (by school/coaching admin)
   */
  async register(data, adminUser) {
    // Ensure admin doesn't already have an institution
    const existing = await Institution.findOne({ adminUserId: adminUser._id });
    if (existing) {
      const err = new Error('You have already registered an institution.');
      err.statusCode = 409;
      throw err;
    }

    const institution = await Institution.create({
      ...data,
      adminUserId: adminUser._id,
      status: INSTITUTION_STATUS.PENDING,
      verificationStatus: VERIFICATION_STATUS.UNVERIFIED,
    });

    // Update user's institutionId
    await User.findByIdAndUpdate(adminUser._id, { institutionId: institution._id });

    // Notify district admin
    const districtAdmins = await User.find({
      role: ROLES.DISTRICT_ADMIN,
      district: institution.address.district,
      isActive: true,
    });

    const notifications = districtAdmins.map((admin) => ({
      userId: admin._id,
      type: 'INFO',
      title: 'New Institution Registration',
      message: `${institution.name} has registered and is pending verification.`,
      link: `/dashboard/district-admin/institutions/${institution._id}`,
      module: 'INSTITUTION',
      referenceId: institution._id,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return institution;
  }

  /**
   * List institutions with filters and pagination
   */
  async list({ page = 1, limit = 20, status, type, district, state, riskLevel, search, userId, userRole }) {
    const query = {};

    // Scope by role
    if (userRole === ROLES.SCHOOL_ADMIN || userRole === ROLES.COACHING_ADMIN) {
      const user = await User.findById(userId);
      if (user?.institutionId) {
        query._id = user.institutionId;
      } else {
        return { institutions: [], meta: buildPaginationMeta(0, page, limit) };
      }
    } else if (userRole === ROLES.DISTRICT_ADMIN || userRole === ROLES.POLICE_OFFICER || userRole === ROLES.FIRE_OFFICER || userRole === ROLES.INSPECTION_OFFICER) {
      const user = await User.findById(userId);
      if (user?.district) query['address.district'] = user.district;
      if (user?.state) query['address.state'] = user.state;
    } else if (userRole === ROLES.STATE_ADMIN) {
      const user = await User.findById(userId);
      if (user?.state) query['address.state'] = user.state;
    }

    // Additional filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (district) query['address.district'] = district;
    if (state) query['address.state'] = state;
    if (riskLevel) query.riskLevel = riskLevel;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const [institutions, total] = await Promise.all([
      Institution.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate('adminUserId', 'name email phone')
        .lean(),
      Institution.countDocuments(query),
    ]);

    return {
      institutions,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Get single institution by ID
   */
  async getById(institutionId, userId, userRole) {
    const institution = await Institution.findById(institutionId)
      .populate('adminUserId', 'name email phone')
      .populate('verifiedBy', 'name email')
      .lean();

    if (!institution) {
      const err = new Error('Institution not found.');
      err.statusCode = 404;
      throw err;
    }

    // Scope check for institution admins
    if (
      (userRole === ROLES.SCHOOL_ADMIN || userRole === ROLES.COACHING_ADMIN) &&
      institution.adminUserId._id.toString() !== userId.toString()
    ) {
      const err = new Error('You do not have permission to view this institution.');
      err.statusCode = 403;
      throw err;
    }

    return institution;
  }

  /**
   * Get institution by Safe ID (public)
   */
  async getPublicBySafeId(safeId) {
    const institution = await Institution.findOne({ safeId, isPubliclyVisible: true })
      .select('name type address status verificationStatus riskLevel complianceScore safeId qrCodeBase64 lastInspectionDate nextInspectionDue totalStudents totalStaff affiliationBoard')
      .lean();

    if (!institution) {
      const err = new Error('Institution not found. The Safe ID may be invalid.');
      err.statusCode = 404;
      throw err;
    }

    return institution;
  }

  /**
   * Update institution details
   */
  async update(institutionId, data, userId, userRole) {
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      const err = new Error('Institution not found.');
      err.statusCode = 404;
      throw err;
    }

    // Only owner or admin can update
    if (
      (userRole === ROLES.SCHOOL_ADMIN || userRole === ROLES.COACHING_ADMIN) &&
      institution.adminUserId.toString() !== userId.toString()
    ) {
      const err = new Error('You do not have permission to update this institution.');
      err.statusCode = 403;
      throw err;
    }

    // Strip non-updatable fields
    const { safeId, status, verificationStatus, adminUserId, ...updateData } = data;

    Object.assign(institution, updateData);
    await institution.save();
    return institution;
  }

  /**
   * Verify institution (District Admin+)
   */
  async verify(institutionId, verifierId, action, rejectionReason) {
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      const err = new Error('Institution not found.');
      err.statusCode = 404;
      throw err;
    }

    if (action === 'APPROVE') {
      institution.verificationStatus = VERIFICATION_STATUS.VERIFIED;
      institution.status = INSTITUTION_STATUS.ACTIVE;
      institution.verifiedBy = verifierId;
      institution.verifiedAt = new Date();
      institution.rejectionReason = null;

      // Auto-generate Safe ID and QR Code
      await qrService.generateForInstitution(institutionId, verifierId);
    } else if (action === 'REJECT') {
      institution.verificationStatus = VERIFICATION_STATUS.REJECTED;
      institution.status = INSTITUTION_STATUS.PENDING;
      institution.rejectionReason = rejectionReason || 'Application rejected by authority.';
    }

    await institution.save();

    // Notify institution admin
    await Notification.create({
      userId: institution.adminUserId,
      type: action === 'APPROVE' ? 'SUCCESS' : 'DANGER',
      title: action === 'APPROVE' ? 'Institution Verified ✓' : 'Institution Verification Rejected',
      message:
        action === 'APPROVE'
          ? `${institution.name} has been verified and is now active. Your Safe ID has been generated.`
          : `${institution.name} verification was rejected. Reason: ${institution.rejectionReason}`,
      link: `/dashboard/institution/profile`,
      module: 'INSTITUTION',
      referenceId: institution._id,
    });

    return institution;
  }

  /**
   * Get map data for institutions
   */
  async getMapData(filters = {}) {
    const query = { isPubliclyVisible: true, ...filters };
    return Institution.find(query)
      .select('name type coordinates riskLevel status safeId address.district address.state')
      .lean();
  }
}

module.exports = new InstitutionService();
