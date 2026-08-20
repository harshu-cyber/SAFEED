// ============================================================
// SafeED-UP — QR Code Service
// ============================================================
const QRCode = require('qrcode');
const SafeID = require('../models/SafeID.model');
const Institution = require('../models/Institution.model');
const { generateSafeId } = require('../utils/safeIdGenerator');
const env = require('../config/env');

class QRService {
  /**
   * Generate and store a Safe ID + QR Code for an institution
   */
  async generateForInstitution(institutionId, generatedByUserId) {
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      const err = new Error('Institution not found.');
      err.statusCode = 404;
      throw err;
    }

    // Check if SafeID already exists
    let safeIDRecord = await SafeID.findOne({ institutionId });

    // Generate Safe ID string
    const stateStr = (typeof institution.address === 'object' && institution.address?.state) ? institution.address.state : 'Uttar Pradesh';
    const safeId = safeIDRecord?.safeId || await generateSafeId(
      stateStr,
      institution.type
    );

    const verificationUrl = `${env.CLIENT_URL}/verify/${safeId}`;

    // QR payload
    const qrPayload = JSON.stringify({
      safeId,
      name: institution.name,
      type: institution.type,
      verificationUrl,
    });

    // Generate QR as Base64
    const qrCodeBase64 = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 400,
      color: {
        dark: '#1E3A5F',
        light: '#FFFFFF',
      },
    });

    if (safeIDRecord) {
      // Regenerate
      safeIDRecord.qrCodeBase64 = qrCodeBase64;
      safeIDRecord.verificationUrl = verificationUrl;
      safeIDRecord.lastRegeneratedAt = new Date();
      safeIDRecord.regenerationReason = 'Manual regeneration';
      await safeIDRecord.save();
    } else {
      // Create new
      safeIDRecord = await SafeID.create({
        institutionId,
        safeId,
        qrCodeBase64,
        verificationUrl,
        generatedBy: generatedByUserId,
      });
    }

    // Update institution with safeId and QR
    await Institution.findByIdAndUpdate(institutionId, {
      safeId,
      qrCodeBase64,
    });

    return safeIDRecord;
  }

  /**
   * Log a QR scan event
   */
  async logScan(safeId) {
    const record = await SafeID.findOneAndUpdate(
      { safeId },
      {
        $inc: { scanCount: 1 },
        $set: { lastScannedAt: new Date() },
      },
      { new: true }
    );
    return record;
  }

  /**
   * Get QR data for an institution
   */
  async getForInstitution(institutionId) {
    return SafeID.findOne({ institutionId, isActive: true });
  }
}

module.exports = new QRService();
