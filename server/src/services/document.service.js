// ============================================================
// SafeED-UP — Canonical Document Service
// Single Source of Truth for Document Verification Workflow
// ============================================================
const mongoose = require('mongoose');
const Document = require('../models/Document.model');
const Institution = require('../models/Institution.model');
const User = require('../models/User.model');
const gridfsService = require('./gridfs.service');
const { CANONICAL_DOCUMENT_TYPES } = require('../models/Document.model');

/**
 * Standardize doc type input to 4 canonical enums
 */
function normalizeDocType(typeInput) {
  if (!typeInput) return null;
  let t = String(typeInput).toUpperCase().trim();
  if (t === 'FIRE_NOC' || t === 'FIRE_SAFETY_CERTIFICATE' || t.includes('FIRE')) {
    return 'FIRE_SAFETY';
  }
  if (t === 'BUILDING_SAFETY' || t === 'STRUCTURAL_SAFETY' || t.includes('BUILDING') || t.includes('STRUCTURAL')) {
    return 'BUILDING_STRUCTURAL_SAFETY';
  }
  if (t === 'AFFILIATION_CERT' || t === 'ELECTRICAL_SAFETY_AUDIT' || t.includes('ELECTRICAL')) {
    return 'ELECTRICAL_SAFETY';
  }
  if (t === 'EMERGENCY_PLAN' || t.includes('EVACUATION') || t.includes('EMERGENCY')) {
    return 'EVACUATION_PLAN';
  }
  return CANONICAL_DOCUMENT_TYPES.includes(t) ? t : null;
}

/**
 * Resolve Institution ObjectId for a user
 */
async function resolveUserInstitution(user) {
  if (!user) return null;
  if (user.institutionId) {
    const inst = await Institution.findById(user.institutionId);
    if (inst) return inst;
  }
  const inst = await Institution.findOne({
    $or: [
      { adminUserId: user._id },
      { email: user.email?.toLowerCase() },
      { 'contactPerson.email': user.email?.toLowerCase() },
    ],
  });
  if (inst && (!user.institutionId || String(user.institutionId) !== String(inst._id))) {
    await User.findByIdAndUpdate(user._id, { institutionId: inst._id });
  }
  return inst;
}

/**
 * Resolve assigned inspector ObjectId for an institution
 */
async function resolveAssignedInspector(institution) {
  let inspector = null;
  if (institution && (institution.district || institution.zone)) {
    inspector = await User.findOne({
      role: { $in: ['INSPECTION_OFFICER', 'DISTRICT_ADMIN'] },
      $or: [
        { district: institution.district },
        { zone: institution.zone },
        { dcpZone: institution.zone },
      ],
    });
  }
  if (!inspector) {
    inspector = await User.findOne({
      role: { $in: ['INSPECTION_OFFICER', 'DISTRICT_ADMIN'] },
    });
  }
  return inspector ? inspector._id : null;
}

class DocumentService {
  /**
   * Institution Document Upload
   * POST /api/v1/documents
   */
  async uploadDocument(user, file, body) {
    if (!file || !file.buffer) {
      const err = new Error('No document file uploaded.');
      err.statusCode = 400;
      throw err;
    }

    const institution = await resolveUserInstitution(user);
    if (!institution) {
      const err = new Error('No institution record associated with your authenticated user profile.');
      err.statusCode = 400;
      throw err;
    }

    const rawType = body.documentType || body.type;
    const canonicalType = normalizeDocType(rawType);
    if (!canonicalType) {
      const err = new Error(`Invalid documentType. Must be one of: ${CANONICAL_DOCUMENT_TYPES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    // 1. Upload file buffer to Cloudinary CDN
    const cloudinaryService = require('./cloudinary.service');
    let cloudResult = null;
    try {
      cloudResult = await cloudinaryService.uploadFileBuffer(
        file.buffer,
        file.originalname || `${canonicalType}.pdf`,
        'safeed_documents',
        file.mimetype || 'application/pdf'
      );
    } catch (cloudErr) {
      console.warn('Cloudinary upload warning, falling back to GridFS:', cloudErr.message);
    }

    // Fallback: GridFS storage if Cloudinary unavailable
    let gridfsFile = null;
    if (!cloudResult) {
      gridfsFile = await gridfsService.uploadStream(
        file.buffer,
        file.originalname || `${canonicalType}.pdf`,
        file.mimetype || 'application/pdf'
      );
    }

    // 2. Resolve inspector assignment
    const assignedInspectorId = await resolveAssignedInspector(institution);

    // 3. Save single canonical Document record in MongoDB
    const docData = {
      institutionId: institution._id,
      institutionName: institution.name,
      documentType: canonicalType,
      originalFileName: file.originalname || `${canonicalType}.pdf`,
      mimeType: file.mimetype || 'application/pdf',
      fileSize: file.size || file.buffer.length || 0,
      fileUrl: cloudResult ? cloudResult.url : null,
      cloudinarySecureUrl: cloudResult ? cloudResult.url : null,
      cloudinaryPublicId: cloudResult ? cloudResult.publicId : null,
      cloudinaryResourceType: cloudResult ? (cloudResult.resourceType || 'auto') : null,
      fileStorageId: gridfsFile ? gridfsFile._id : null,
      uploadedBy: user._id,
      assignedInspectorId,
      zone: institution.zone || '',
      district: institution.district || '',
      status: 'PENDING_REVIEW',
      uploadedAt: new Date(),
    };

    let document;
    try {
      document = await Document.create(docData);
    } catch (createErr) {
      // Rollback orphan Cloudinary asset if DB creation fails
      if (cloudResult && cloudResult.publicId) {
        console.warn('⚠️ MongoDB creation failed after Cloudinary upload. Cleaning up orphan asset:', cloudResult.publicId);
        await cloudinaryService.deleteFile(cloudResult.publicId, cloudResult.resourceType);
      }
      throw createErr;
    }

    return document;
  }

  /**
   * Fetch documents uploaded by authenticated institution
   * GET /api/v1/documents/my
   */
  async getMyDocuments(user) {
    const institution = await resolveUserInstitution(user);
    if (!institution) {
      return [];
    }

    const documents = await Document.find({ institutionId: institution._id })
      .sort({ createdAt: -1 })
      .lean();

    return documents;
  }

  /**
   * Fetch documents assigned to inspector
   * GET /api/v1/documents/inspector/assigned
   */
  async getInspectorAssignedDocuments(user) {
    let query = {};

    if (user.role === 'INSPECTION_OFFICER') {
      // Find documents assigned to this inspector or matching inspector's district/zone
      const inspectorZone = user.dcpZone || user.zone;
      const inspectorDistrict = user.district;

      const userOrLocation = [{ assignedInspectorId: user._id }];
      if (inspectorZone) userOrLocation.push({ zone: inspectorZone });
      if (inspectorDistrict) userOrLocation.push({ district: inspectorDistrict });

      query = { $or: userOrLocation };
    } else if (user.role === 'DISTRICT_ADMIN') {
      if (user.district) {
        query = { district: user.district };
      }
    }
    // SUPER_ADMIN or STATE_ADMIN see all documents (query = {})

    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .lean();

    return documents;
  }

  /**
   * Serve actual file binary stream from GridFS
   * GET /api/v1/documents/:documentId/file
   */
  async getDocumentFileStream(documentId) {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      const err = new Error('Invalid documentId format.');
      err.statusCode = 400;
      throw err;
    }

    const document = await Document.findById(documentId);
    if (!document) {
      const err = new Error('Document record not found.');
      err.statusCode = 404;
      throw err;
    }

    // 1. Cloudinary CDN Storage Path
    if (document.fileUrl) {
      return {
        fileUrl: document.fileUrl,
        mimeType: document.mimeType || 'application/pdf',
        originalFileName: document.originalFileName || 'document.pdf',
      };
    }

    // 2. GridFS Storage Path (Fallback)
    if (document.fileStorageId) {
      const gridFile = await gridfsService.findFileById(document.fileStorageId);
      if (!gridFile) {
        const err = new Error('Physical document file not found in storage.');
        err.statusCode = 404;
        throw err;
      }

      const downloadStream = gridfsService.openDownloadStream(document.fileStorageId);
      return {
        stream: downloadStream,
        mimeType: document.mimeType || gridFile.contentType || 'application/pdf',
        originalFileName: document.originalFileName || gridFile.filename || 'document.pdf',
      };
    }

    const err = new Error('No physical file found for this document.');
    err.statusCode = 404;
    throw err;
  }

  /**
   * Approve a document
   * PATCH /api/v1/documents/:documentId/approve
   */
  async approveDocument(documentId, inspectorUser) {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      const err = new Error('Invalid documentId format.');
      err.statusCode = 400;
      throw err;
    }

    const document = await Document.findById(documentId);
    if (!document) {
      const err = new Error('Document record not found.');
      err.statusCode = 404;
      throw err;
    }

    document.status = 'APPROVED';
    document.reviewedBy = inspectorUser._id;
    document.reviewedAt = new Date();
    document.rejectionReason = null;
    await document.save();

    // Recalculate 4-doc QR status
    await this.updateQrUnlockStatus(document.institutionId);

    return document;
  }

  /**
   * Reject a document
   * PATCH /api/v1/documents/:documentId/reject
   */
  async rejectDocument(documentId, inspectorUser, rejectionReason) {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      const err = new Error('Invalid documentId format.');
      err.statusCode = 400;
      throw err;
    }

    const document = await Document.findById(documentId);
    if (!document) {
      const err = new Error('Document record not found.');
      err.statusCode = 404;
      throw err;
    }

    document.status = 'REJECTED';
    document.reviewedBy = inspectorUser._id;
    document.reviewedAt = new Date();
    document.rejectionReason = rejectionReason || 'Rejected by Inspector';
    await document.save();

    // Recalculate 4-doc QR status
    await this.updateQrUnlockStatus(document.institutionId);

    return document;
  }

  /**
   * Recalculate and update QR Code unlock status for an institution
   * ALL 4 canonical document types must be APPROVED
   */
  async updateQrUnlockStatus(institutionId) {
    const approvedDocs = await Document.find({
      institutionId,
      status: 'APPROVED',
    }).select('documentType');

    const approvedTypes = new Set(approvedDocs.map((d) => d.documentType));
    const all4Approved = CANONICAL_DOCUMENT_TYPES.every((t) => approvedTypes.has(t));

    const institution = await Institution.findById(institutionId);
    if (institution) {
      if (all4Approved) {
        institution.qrLocked = false;
        institution.isQrUnlocked = true;
        institution.qrLockStatus = 'UNLOCKED';
        institution.status = 'VERIFIED';
        institution.verificationStatus = 'VERIFIED';
        institution.complianceScore = 100;
      } else {
        const approvedCount = approvedTypes.size;
        institution.complianceScore = Math.round((approvedCount / 4) * 100);
      }
      await institution.save();
    }

    return {
      institutionId,
      all4Approved,
      approvedTypes: Array.from(approvedTypes),
    };
  }

  /**
   * Get 4-Doc QR Lock/Unlock Status
   */
  async getQrStatus(institutionId) {
    const docs = await Document.find({ institutionId }).select('documentType status').lean();

    const docStatusMap = {};
    CANONICAL_DOCUMENT_TYPES.forEach((t) => {
      docStatusMap[t] = 'MISSING';
    });

    docs.forEach((d) => {
      if (docStatusMap[d.documentType]) {
        docStatusMap[d.documentType] = d.status;
      }
    });

    const all4Approved = CANONICAL_DOCUMENT_TYPES.every((t) => docStatusMap[t] === 'APPROVED');

    return {
      institutionId,
      qrUnlocked: all4Approved,
      documentStatus: docStatusMap,
    };
  }
}

module.exports = new DocumentService();
