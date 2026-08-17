// ============================================================
// SafeED-UP — SafeID Model
// ============================================================
const mongoose = require('mongoose');

const safeIDSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      unique: true,
    },
    safeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    qrCodeUrl: { type: String, default: null },
    qrCodeBase64: { type: String, default: null },
    verificationUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    generatedAt: { type: Date, default: Date.now },
    lastScannedAt: { type: Date, default: null },
    scanCount: { type: Number, default: 0 },
    lastRegeneratedAt: { type: Date, default: null },
    regenerationReason: { type: String, default: null },
  },
  { timestamps: true }
);

const SafeID = mongoose.model('SafeID', safeIDSchema);
module.exports = SafeID;
