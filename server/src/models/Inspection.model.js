// ============================================================
// SafeED-UP — Inspection Model
// ============================================================
const mongoose = require('mongoose');
const {
  INSPECTION_TYPES,
  INSPECTION_STATUS,
} = require('../constants/statusTypes');

const checklistItemSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true },
    item: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL', 'NOT_APPLICABLE'],
      default: 'NOT_APPLICABLE',
    },
    score: { type: Number, min: 0, max: 10, default: 0 },
    maxScore: { type: Number, min: 0, default: 10 },
    remark: { type: String, trim: true, default: '' },
    photoUrl: { type: String, default: null },
  },
  { _id: true }
);

const inspectionSchema = new mongoose.Schema(
  {
    inspectionId: {
      type: String,
      unique: true,
      index: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Institution is required'],
      index: true,
    },
    inspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inspector is required'],
    },
    secondaryInspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    inspectionType: {
      type: String,
      enum: Object.values(INSPECTION_TYPES),
      required: [true, 'Inspection type is required'],
    },
    status: {
      type: String,
      enum: Object.values(INSPECTION_STATUS),
      default: INSPECTION_STATUS.SCHEDULED,
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    conductedDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // Checklist
    checklistItems: [checklistItemSchema],

    // Scores
    totalScore: { type: Number, default: 0 },
    maxPossibleScore: { type: Number, default: 0 },
    overallPercentage: { type: Number, min: 0, max: 100, default: 0 },

    // Results
    findings: { type: String, trim: true, default: '' },
    recommendations: { type: String, trim: true, default: '' },
    actionRequired: { type: String, trim: true, default: '' },

    // Report
    reportUrl: { type: String, default: null },
    reportGeneratedAt: { type: Date, default: null },

    // Follow-up
    isFollowUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date, default: null },
    followUpInspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection',
      default: null,
    },

    // Approval
    isApproved: { type: Boolean, default: false },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: { type: Date, default: null },
    approvalRemarks: { type: String, default: null },

    // Cancellation
    cancellationReason: { type: String, default: null },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Scheduling metadata
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notificationSent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Indexes ----
inspectionSchema.index({ status: 1 });
inspectionSchema.index({ scheduledDate: 1 });
inspectionSchema.index({ inspectorId: 1, status: 1 });

// ---- Pre-save: Generate inspectionId ----
inspectionSchema.pre('save', async function (next) {
  if (!this.inspectionId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Inspection').countDocuments() + 1;
    this.inspectionId = `INSP-${year}${month}-${String(count).padStart(5, '0')}`;
  }
  next();
});

const Inspection = mongoose.model('Inspection', inspectionSchema);
module.exports = Inspection;
