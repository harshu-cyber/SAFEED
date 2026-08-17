// ============================================================
// SafeED-UP — Institution Model
// ============================================================
const mongoose = require('mongoose');
const {
  INSTITUTION_TYPES,
  INSTITUTION_STATUS,
  VERIFICATION_STATUS,
  RISK_LEVELS,
  AFFILIATION_BOARDS,
  INDIA_STATES,
} = require('../constants/statusTypes');

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    pincode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode'],
    },
    district: { type: String, trim: true },
    state: { type: String, enum: INDIA_STATES },
  },
  { _id: false }
);

const contactPersonSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    designation: { type: String, trim: true },
  },
  { _id: false }
);

const institutionSchema = new mongoose.Schema(
  {
    safeId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
      minlength: [3, 'Institution name must be at least 3 characters'],
      maxlength: [200, 'Institution name cannot exceed 200 characters'],
    },
    type: {
      type: String,
      enum: Object.values(INSTITUTION_TYPES),
      required: [true, 'Institution type is required'],
    },
    affiliationBoard: {
      type: String,
      enum: [...AFFILIATION_BOARDS, null],
      default: null,
    },
    udiseCode: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      default: null,
    },
    registrationNumber: {
      type: String,
      trim: true,
      required: [true, 'Registration number is required'],
    },
    address: {
      type: addressSchema,
      required: [true, 'Address is required'],
    },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    contactPerson: {
      type: contactPersonSchema,
      required: [true, 'Contact person details are required'],
    },
    alternateContact: {
      type: contactPersonSchema,
      default: null,
    },
    website: { type: String, trim: true, default: null },
    totalStudents: { type: Number, min: 0, default: 0 },
    totalStaff: { type: Number, min: 0, default: 0 },
    buildingFloors: { type: Number, min: 1, default: 1 },
    builtYear: {
      type: Number,
      min: 1600,
      max: new Date().getFullYear(),
      default: null,
    },
    landAreaSqFt: { type: Number, min: 0, default: null },

    // Status & Verification
    status: {
      type: String,
      enum: Object.values(INSTITUTION_STATUS),
      default: INSTITUTION_STATUS.PENDING,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.UNVERIFIED,
    },
    riskLevel: {
      type: String,
      enum: Object.values(RISK_LEVELS),
      default: RISK_LEVELS.MEDIUM,
    },
    complianceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Inspection tracking
    lastInspectionDate: { type: Date, default: null },
    nextInspectionDue: { type: Date, default: null },
    totalInspections: { type: Number, default: 0 },

    // QR & Safe ID
    qrCodeUrl: { type: String, default: null },
    qrCodeBase64: { type: String, default: null },

    // Relationships
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Institution admin user is required'],
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },

    // Visibility
    isPubliclyVisible: { type: Boolean, default: true },

    // Metadata
    remarks: { type: String, trim: true, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Indexes ----
institutionSchema.index({ 'address.district': 1, 'address.state': 1 });
institutionSchema.index({ status: 1 });
institutionSchema.index({ verificationStatus: 1 });
institutionSchema.index({ riskLevel: 1 });
institutionSchema.index({ type: 1 });
institutionSchema.index({ adminUserId: 1 });
institutionSchema.index({ name: 'text', registrationNumber: 'text' });

// ---- Virtual: Public URL ----
institutionSchema.virtual('publicUrl').get(function () {
  if (!this.safeId) return null;
  return `/verify/${this.safeId}`;
});

const Institution = mongoose.model('Institution', institutionSchema);
module.exports = Institution;
