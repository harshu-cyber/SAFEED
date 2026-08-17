// ============================================================
// SafeED-UP — Audit Log Model
// ============================================================
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userEmail: { type: String, default: 'system' },
    userRole: { type: String, default: 'SYSTEM' },
    action: {
      type: String,
      required: true,
      trim: true,
      // e.g. INSTITUTION_VERIFIED, DOCUMENT_APPROVED, INSPECTION_COMPLETED
    },
    module: {
      type: String,
      required: true,
      enum: [
        'AUTH',
        'USER',
        'INSTITUTION',
        'INSPECTION',
        'DOCUMENT',
        'COMPLIANCE',
        'DEFICIENCY',
        'SAFE_ID',
        'EMERGENCY_PLAN',
        'NOTIFICATION',
        'REPORT',
        'SYSTEM',
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetModel: { type: String, default: null },
    description: { type: String, trim: true, default: '' },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      default: 'SUCCESS',
    },
    errorMessage: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

// ---- Indexes ----
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1 });
auditLogSchema.index({ targetId: 1 });

// ---- TTL: Auto-delete audit logs after 2 years ----
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 730 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
