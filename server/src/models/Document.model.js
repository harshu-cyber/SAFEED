// ============================================================
// SafeED-UP — Canonical Document Model
// Single Source of Truth for Document Verification Workflow
// ============================================================
const mongoose = require('mongoose');

const CANONICAL_DOCUMENT_TYPES = [
  'FIRE_SAFETY',
  'BUILDING_STRUCTURAL_SAFETY',
  'ELECTRICAL_SAFETY',
  'EVACUATION_PLAN',
];

const CANONICAL_STATUSES = ['PENDING_REVIEW', 'APPROVED', 'REJECTED'];

const documentSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'institutionId is required'],
      index: true,
    },
    institutionName: {
      type: String,
      required: [true, 'institutionName is required'],
      trim: true,
    },
    documentType: {
      type: String,
      enum: {
        values: CANONICAL_DOCUMENT_TYPES,
        message: '{VALUE} is not a valid canonical documentType',
      },
      required: [true, 'documentType is required'],
      index: true,
    },
    originalFileName: {
      type: String,
      required: [true, 'originalFileName is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, 'mimeType is required'],
      trim: true,
    },
    fileSize: {
      type: Number, // in bytes
      required: [true, 'fileSize is required'],
    },
    fileStorageId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'fileStorageId (GridFS ObjectId) is required'],
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'uploadedBy is required'],
      index: true,
    },
    assignedInspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    zone: {
      type: String,
      trim: true,
      default: '',
    },
    district: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: CANONICAL_STATUSES,
      default: 'PENDING_REVIEW',
      index: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
documentSchema.index({ institutionId: 1, documentType: 1 });
documentSchema.index({ assignedInspectorId: 1, status: 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
module.exports.CANONICAL_DOCUMENT_TYPES = CANONICAL_DOCUMENT_TYPES;
module.exports.CANONICAL_STATUSES = CANONICAL_STATUSES;
