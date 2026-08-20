// ============================================================
// SafeED-UP — Document Model
// ============================================================
const mongoose = require('mongoose');
const {
  DOCUMENT_TYPES,
  DOCUMENT_VERIFICATION_STATUS,
} = require('../constants/statusTypes');

const documentSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Institution is required'],
      index: true,
    },
    institutionName: { type: String, trim: true, default: '' },
    institutionType: { type: String, trim: true, default: 'SCHOOL' },
    district: { type: String, trim: true, default: '' },
    zone: { type: String, trim: true, default: '' },

    assignedInspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    assignedInspectorName: { type: String, trim: true, default: '' },

    documentType: {
      type: String,
      enum: Object.values(DOCUMENT_TYPES),
      required: [true, 'Document type is required'],
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: { type: String, trim: true, default: '' },

    originalFileName: { type: String, default: '' },
    storedFileName: { type: String, default: '' },
    fileStorageType: { type: String, enum: ['GRIDFS', 'LOCAL'], default: 'GRIDFS' },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    fileUrl: {
      type: String,
      default: function () {
        return this.fileId ? `/api/v1/documents/${this._id}/file` : '/uploads/documents/document.pdf';
      },
    },
    fileDataUrl: { type: String, default: '' },
    fileName: { type: String, default: 'document.pdf' },
    fileType: { type: String, default: 'application/pdf' },
    fileMimeType: { type: String, default: 'application/pdf' },
    fileSize: { type: Number, default: 0 }, // in bytes
    issueDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },
    issuingAuthority: { type: String, trim: true, default: null },
    documentNumber: { type: String, trim: true, default: null },

    // Verification
    verificationStatus: {
      type: String,
      enum: Object.values(DOCUMENT_VERIFICATION_STATUS),
      default: DOCUMENT_VERIFICATION_STATUS.PENDING,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedByName: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    verificationRemarks: { type: String, default: null },
    remarks: { type: String, default: null },

    // Upload metadata
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedAt: { type: Date, default: Date.now },

    // Versioning
    version: { type: Number, default: 1 },
    previousVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    isLatestVersion: { type: Boolean, default: true },

    // Expiry tracking
    isExpired: { type: Boolean, default: false },
    expiryNotificationSent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Indexes ----
documentSchema.index({ verificationStatus: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ expiryDate: 1 });
documentSchema.index({ isLatestVersion: 1, institutionId: 1 });
documentSchema.index({ assignedInspectorId: 1, verificationStatus: 1 });
documentSchema.index({ institutionId: 1, documentType: 1 });

// ---- Virtual: isExpiringSoon (within 30 days) ----
documentSchema.virtual('isExpiringSoon').get(function () {
  if (!this.expiryDate) return false;
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return this.expiryDate <= thirtyDaysFromNow && this.expiryDate > new Date();
});

// ---- Pre-save: Mark expired documents ----
documentSchema.pre('save', function (next) {
  if (this.expiryDate && this.expiryDate < new Date()) {
    this.isExpired = true;
    if (this.verificationStatus === DOCUMENT_VERIFICATION_STATUS.APPROVED) {
      this.verificationStatus = DOCUMENT_VERIFICATION_STATUS.EXPIRED;
    }
  }
  next();
});

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
