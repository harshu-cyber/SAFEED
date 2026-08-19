// ============================================================
// SafeED-UP — Institution Model (Flexible & Production Ready)
// ============================================================
const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema(
  {
    safeId: {
      type: String,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
    },
    type: {
      type: String,
      default: 'SCHOOL',
    },
    affiliationBoard: {
      type: String,
      default: 'CBSE',
    },
    affiliationCode: {
      type: String,
      default: '',
    },
    udiseCode: {
      type: String,
      default: null,
    },
    registrationNumber: {
      type: String,
      default: () => `REG-${Date.now()}`,
    },
    district: {
      type: String,
      default: 'Lucknow',
    },
    state: {
      type: String,
      default: 'Uttar Pradesh',
    },
    zone: {
      type: String,
      default: 'CENTRAL',
      uppercase: true,
      trim: true,
    },
    address: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ street: 'Lucknow Main Road', district: 'Lucknow', state: 'Uttar Pradesh' }),
    },
    coordinates: {
      lat: { type: Number, default: 26.8467 },
      lng: { type: Number, default: 80.9462 },
    },
    contactPerson: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ name: 'Principal', email: 'admin@school.edu.in', phone: '9876543210' }),
    },
    alternateContact: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    website: { type: String, trim: true, default: null },
    totalStudents: { type: Number, default: 0 },
    staffCount: { type: Number, default: 0 },
    totalStaff: { type: Number, default: 0 },
    classroomCount: { type: Number, default: 0 },
    floorCount: { type: Number, default: 1 },
    buildingFloors: { type: Number, default: 1 },
    exitGateCount: { type: Number, default: 2 },
    nearestPoliceStation: { type: String, default: 'Hazratganj Police Station' },

    // Status & Verification
    status: {
      type: String,
      default: 'PENDING_DOCUMENT_VERIFICATION',
    },
    verificationStatus: {
      type: String,
      default: 'UNVERIFIED',
    },
    riskLevel: {
      type: String,
      default: 'UNDER_REVIEW',
    },
    complianceScore: {
      type: Number,
      default: 0,
    },

    // Inspector & Zone Assignment
    assignedInspector: { type: String, default: 'DCP CENTRAL' },
    assignedInspectorZone: { type: String, default: 'CENTRAL' },
    assignedInspectorEmail: { type: String, default: '' },
    assignedAt: { type: String, default: null },
    districtRemarks: { type: Array, default: [] },

    // QR Lock Status
    qrLocked: { type: Boolean, default: false },
    qrLockNotice: { type: String, default: null },
    qrLockedBy: { type: String, default: null },
    qrLockedAt: { type: String, default: null },
    qrLockStatus: { type: String, default: 'UNLOCKED' },

    // Inspection tracking
    lastInspectionDate: { type: String, default: null },
    nextInspectionDue: { type: String, default: null },
    totalInspections: { type: Number, default: 0 },

    // QR & Safe ID
    qrCodeUrl: { type: String, default: null },
    qrCodeBase64: { type: String, default: null },

    // Relationships
    adminUserId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.Mixed,
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
    strict: false,
  }
);

institutionSchema.index({ zone: 1, district: 1 });
institutionSchema.index({ safeId: 1 });

const Institution = mongoose.model('Institution', institutionSchema);
module.exports = Institution;
