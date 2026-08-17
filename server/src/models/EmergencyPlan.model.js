// ============================================================
// SafeED-UP — Emergency Plan Model
// ============================================================
const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    alternatePhone: { type: String, trim: true, default: null },
    email: { type: String, trim: true, default: null },
  },
  { _id: true }
);

const nearbyServiceSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: null },
    distanceKm: { type: Number, min: 0, default: null },
    phone: { type: String, trim: true, default: null },
    address: { type: String, trim: true, default: null },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { _id: false }
);

const emergencyPlanSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      unique: true,
    },

    // Fire Safety
    hasFireExtinguishers: { type: Boolean, default: false },
    fireExtinguisherCount: { type: Number, min: 0, default: 0 },
    fireExtinguisherLastService: { type: Date, default: null },
    fireExtinguisherNextService: { type: Date, default: null },
    hasFireAlarm: { type: Boolean, default: false },
    hasSprinklerSystem: { type: Boolean, default: false },
    hasSandBuckets: { type: Boolean, default: false },
    fireHoseCount: { type: Number, min: 0, default: 0 },

    // Exits & Evacuation
    hasEmergencyExits: { type: Boolean, default: false },
    emergencyExitCount: { type: Number, min: 0, default: 0 },
    exitsAreClearlyMarked: { type: Boolean, default: false },
    hasEvacuationPlan: { type: Boolean, default: false },
    evacuationPlanUrl: { type: String, default: null },
    hasAssemblyPoint: { type: Boolean, default: false },
    assemblyPointDescription: { type: String, trim: true, default: null },

    // First Aid
    hasFirstAidKit: { type: Boolean, default: false },
    firstAidKitCount: { type: Number, min: 0, default: 0 },
    firstAidTrainedStaffCount: { type: Number, min: 0, default: 0 },
    hasDefibrillator: { type: Boolean, default: false },

    // Drills
    lastDrillDate: { type: Date, default: null },
    nextDrillScheduled: { type: Date, default: null },
    totalDrillsThisYear: { type: Number, min: 0, default: 0 },
    drillReportUrl: { type: String, default: null },

    // Emergency Services (nearby)
    nearestHospital: { type: nearbyServiceSchema, default: {} },
    nearestFireStation: { type: nearbyServiceSchema, default: {} },
    nearestPoliceStation: { type: nearbyServiceSchema, default: {} },
    nearestAmbulanceService: { type: nearbyServiceSchema, default: {} },

    // Emergency Contacts
    emergencyContacts: [emergencyContactSchema],

    // CCTV
    hasCCTV: { type: Boolean, default: false },
    cctvCameraCount: { type: Number, min: 0, default: 0 },
    cctvFunctional: { type: Boolean, default: false },

    // Security
    hasSecurityGuard: { type: Boolean, default: false },
    securityGuardCount: { type: Number, min: 0, default: 0 },
    hasAccessControl: { type: Boolean, default: false },

    // Readiness Score (auto-calculated)
    readinessScore: { type: Number, min: 0, max: 100, default: 0 },
    readinessLevel: {
      type: String,
      enum: ['POOR', 'FAIR', 'GOOD', 'EXCELLENT'],
      default: 'POOR',
    },

    // Metadata
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: { type: Date, default: null },
    lastInspectedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Pre-save: Calculate readiness score ----
emergencyPlanSchema.pre('save', function (next) {
  let score = 0;
  const checks = [
    [this.hasFireExtinguishers, 10],
    [this.hasFireAlarm, 10],
    [this.hasSprinklerSystem, 5],
    [this.hasEmergencyExits && this.emergencyExitCount > 0, 10],
    [this.exitsAreClearlyMarked, 5],
    [this.hasEvacuationPlan, 10],
    [this.hasAssemblyPoint, 5],
    [this.hasFirstAidKit, 10],
    [this.firstAidTrainedStaffCount > 0, 5],
    [this.lastDrillDate !== null, 10],
    [this.hasCCTV && this.cctvFunctional, 5],
    [this.hasSecurityGuard, 5],
    [this.emergencyContacts.length >= 3, 10],
  ];

  checks.forEach(([condition, points]) => {
    if (condition) score += points;
  });

  this.readinessScore = Math.min(score, 100);
  this.readinessLevel =
    score >= 80 ? 'EXCELLENT' : score >= 60 ? 'GOOD' : score >= 40 ? 'FAIR' : 'POOR';
  next();
});

const EmergencyPlan = mongoose.model('EmergencyPlan', emergencyPlanSchema);
module.exports = EmergencyPlan;
