// ============================================================
// SafeED-UP — Deficiency Model
// ============================================================
const mongoose = require('mongoose');
const {
  DEFICIENCY_TYPES,
  DEFICIENCY_SEVERITY,
  DEFICIENCY_STATUS,
} = require('../constants/statusTypes');

const deficiencySchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Institution is required'],
      index: true,
    },
    inspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection',
      required: [true, 'Inspection is required'],
    },
    deficiencyType: {
      type: String,
      enum: Object.values(DEFICIENCY_TYPES),
      required: [true, 'Deficiency type is required'],
    },
    severity: {
      type: String,
      enum: Object.values(DEFICIENCY_SEVERITY),
      required: [true, 'Severity is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: null,
    },
    photoUrls: [{ type: String }],

    // Workflow
    status: {
      type: String,
      enum: Object.values(DEFICIENCY_STATUS),
      default: DEFICIENCY_STATUS.OPEN,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rectificationDeadline: {
      type: Date,
      required: [true, 'Rectification deadline is required'],
    },

    // Rectification proof (submitted by institution)
    rectificationDescription: { type: String, trim: true, default: null },
    rectificationProofUrls: [{ type: String }],
    rectificationSubmittedAt: { type: Date, default: null },
    rectificationSubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Closure (by inspector)
    closedAt: { type: Date, default: null },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    closureRemarks: { type: String, default: null },

    // Waiver
    waivedAt: { type: Date, default: null },
    waivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    waiverReason: { type: String, default: null },

    // Escalation
    isEscalated: { type: Boolean, default: false },
    escalatedAt: { type: Date, default: null },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Indexes ----
deficiencySchema.index({ status: 1, severity: 1 });
deficiencySchema.index({ rectificationDeadline: 1 });
deficiencySchema.index({ deficiencyType: 1 });

// ---- Virtual: isOverdue ----
deficiencySchema.virtual('isOverdue').get(function () {
  return (
    this.status === DEFICIENCY_STATUS.OPEN ||
    (this.status === DEFICIENCY_STATUS.IN_PROGRESS &&
      this.rectificationDeadline < new Date())
  );
});

const Deficiency = mongoose.model('Deficiency', deficiencySchema);
module.exports = Deficiency;
