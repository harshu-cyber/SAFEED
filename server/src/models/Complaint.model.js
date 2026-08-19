// ============================================================
// SafeED-UP — Complaint Model (Public Safety Complaints)
// ============================================================
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    complaintTicket: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    institutionName: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
    },
    institutionId: {
      type: String,
      default: null,
    },
    district: {
      type: String,
      default: 'Lucknow',
      trim: true,
    },
    zone: {
      type: String,
      default: 'CENTRAL',
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'FIRE_SAFETY_HAZARD',
    },
    complainantName: {
      type: String,
      default: 'Anonymous Citizen',
      trim: true,
    },
    complainantPhone: {
      type: String,
      default: 'Hidden',
      trim: true,
    },
    complainantEmail: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING_DISTRICT_ACTION', 'INVESTIGATION_ASSIGNED', 'RESOLVED'],
      default: 'PENDING_DISTRICT_ACTION',
    },
    assignedInspector: {
      type: String,
      default: null,
    },
    assignedInspectorZone: {
      type: String,
      default: null,
    },
    assignedAt: {
      type: String,
      default: null,
    },
    districtDirectives: {
      type: String,
      default: '',
    },
    resolutionRemarks: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: String,
      default: null,
    },
    submittedAt: {
      type: String,
      default: () => new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
    },
  },
  { timestamps: true }
);

complaintSchema.index({ zone: 1, district: 1 });
complaintSchema.index({ status: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
