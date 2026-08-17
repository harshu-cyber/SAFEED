// ============================================================
// SafeED-UP — Compliance Model
// ============================================================
const mongoose = require('mongoose');
const { COMPLIANCE_STATUS } = require('../constants/statusTypes');

const complianceCategorySchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    score: { type: Number, min: 0, default: 0 },
    maxScore: { type: Number, required: true, min: 0 },
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    status: {
      type: String,
      enum: Object.values(COMPLIANCE_STATUS),
      default: COMPLIANCE_STATUS.NON_COMPLIANT,
    },
    items: [
      {
        item: { type: String, required: true, trim: true },
        isCompliant: { type: Boolean, default: false },
        remark: { type: String, trim: true, default: '' },
      },
    ],
  },
  { _id: true }
);

const complianceSchema = new mongoose.Schema(
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
      default: null,
    },
    complianceYear: {
      type: Number,
      required: [true, 'Compliance year is required'],
      min: 2020,
    },
    complianceQuarter: {
      type: Number,
      min: 1,
      max: 4,
      default: null,
    },
    categories: [complianceCategorySchema],

    // Aggregate scores
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentageScore: { type: Number, min: 0, max: 100, default: 0 },
    status: {
      type: String,
      enum: Object.values(COMPLIANCE_STATUS),
      default: COMPLIANCE_STATUS.NON_COMPLIANT,
    },

    // Review metadata
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    remarks: { type: String, trim: true, default: '' },
    isFinal: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Indexes ----
complianceSchema.index({ complianceYear: 1, complianceQuarter: 1 });
complianceSchema.index({ status: 1 });

// ---- Pre-save: Calculate aggregate scores ----
complianceSchema.pre('save', function (next) {
  let totalScore = 0;
  let maxScore = 0;

  this.categories.forEach((cat) => {
    cat.percentage = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
    cat.status =
      cat.percentage >= 80
        ? COMPLIANCE_STATUS.COMPLIANT
        : cat.percentage >= 50
        ? COMPLIANCE_STATUS.PARTIALLY_COMPLIANT
        : COMPLIANCE_STATUS.NON_COMPLIANT;
    totalScore += cat.score;
    maxScore += cat.maxScore;
  });

  this.totalScore = totalScore;
  this.maxScore = maxScore;
  this.percentageScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  this.status =
    this.percentageScore >= 80
      ? COMPLIANCE_STATUS.COMPLIANT
      : this.percentageScore >= 50
      ? COMPLIANCE_STATUS.PARTIALLY_COMPLIANT
      : COMPLIANCE_STATUS.NON_COMPLIANT;

  next();
});

const Compliance = mongoose.model('Compliance', complianceSchema);
module.exports = Compliance;
