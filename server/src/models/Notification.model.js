// ============================================================
// SafeED-UP — Notification Model
// ============================================================
const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../constants/statusTypes');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      default: NOTIFICATION_TYPES.INFO,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },

    // Source reference
    module: {
      type: String,
      enum: ['INSPECTION', 'DOCUMENT', 'COMPLIANCE', 'DEFICIENCY', 'INSTITUTION', 'SYSTEM'],
      default: 'SYSTEM',
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Email status
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ---- Indexes ----
notificationSchema.index({ isRead: 1, userId: 1 });
notificationSchema.index({ createdAt: -1 });

// ---- TTL: Auto-delete notifications after 90 days ----
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
