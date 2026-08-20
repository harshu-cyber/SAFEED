// ============================================================
// SafeED-UP — Document Service (Clean Ground-Up Rewrite)
// ============================================================
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const Document = require('../models/Document.model');
const Institution = require('../models/Institution.model');
const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const { buildPaginationMeta } = require('../utils/apiResponse');
const { DOCUMENT_VERIFICATION_STATUS } = require('../constants/statusTypes');
const { ROLES: USER_ROLES } = require('../constants/roles');
const gridfsService = require('./gridfs.service');

// Mandatory 4 safety clearance types
const MANDATORY_DOC_TYPES = ['FIRE_SAFETY', 'BUILDING_SAFETY', 'ELECTRICAL_SAFETY', 'EVACUATION_SAFETY'];

/**
 * Standardize alias document types into 4 canonical keys
 */
function canonicalizeDocType(typeInput) {
  let t = String(typeInput || 'FIRE_SAFETY').toUpperCase().trim();
  if (t === 'FIRE_NOC' || t.includes('FIRE')) return 'FIRE_SAFETY';
  if (t === 'BUILDING_PLAN' || t.includes('BUILDING') || t.includes('STRUCTURAL')) return 'BUILDING_SAFETY';
  if (t === 'AFFILIATION_CERT' || t.includes('ELECTRICAL') || t.includes('AUDIT')) return 'ELECTRICAL_SAFETY';
  if (t === 'EMERGENCY_PLAN' || t.includes('EVACUATION') || t.includes('EMERGENCY')) return 'EVACUATION_SAFETY';
  return t;
}

/**
 * Single unambiguous helper to resolve an Institution record from any identifier or user context
 */
async function resolveInstitution(identifier, userContext = null) {
  let inst = null;
  const idStr = String(identifier || '').trim();

  // 1. Direct Mongoose ObjectId lookup on Institution
  if (idStr && mongoose.Types.ObjectId.isValid(idStr)) {
    inst = await Institution.findById(idStr);

    // 2. If not an Institution ID, check if it's a User ID
    if (!inst) {
      const u = await User.findById(idStr).lean();
      if (u) {
        if (u.institutionId) inst = await Institution.findById(u.institutionId);
        if (!inst) {
          inst = await Institution.findOne({
            $or: [
              { adminUserId: u._id },
              { email: u.email.toLowerCase() },
              { 'contactPerson.email': u.email.toLowerCase() }
            ]
          });
        }
      }
    }
  }

  // 3. Try finding via User Context if provided
  if (!inst && userContext) {
    if (userContext.institutionId) inst = await Institution.findById(userContext.institutionId);
    if (!inst && userContext._id) {
      inst = await Institution.findOne({
        $or: [
          { adminUserId: userContext._id },
          { email: userContext.email?.toLowerCase() },
          { 'contactPerson.email': userContext.email?.toLowerCase() }
        ]
      });
    }
  }

  // 4. Try string queries (email, safeId, adminUserId, name)
  if (!inst && idStr) {
    const idLow = idStr.toLowerCase();
    inst = await Institution.findOne({
      $or: [
        { email: idLow },
        { 'contactPerson.email': idLow },
        { safeId: idStr },
        { adminUserId: idStr },
        { name: new RegExp(`^${idStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
      ]
    });
  }

  return inst;
}

/**
 * Standardize output document fields for reliable cross-portal rendering
 */
function normalizeDocument(d) {
  if (!d) return null;
  const docObj = d.toObject ? d.toObject() : { ...d };
  const docId = docObj._id ? docObj._id.toString() : (docObj.id || `doc_${Date.now()}`);
  const docType = canonicalizeDocType(docObj.documentType || docObj.type || docObj.name);

  const rawVer = (docObj.verificationStatus || docObj.status || 'PENDING').toUpperCase();
  let verificationStatus = 'PENDING';
  let status = 'PENDING_REVIEW';

  if (rawVer === 'APPROVED' || rawVer === 'VERIFIED') {
    verificationStatus = 'APPROVED';
    status = 'VERIFIED';
  } else if (rawVer === 'REJECTED') {
    verificationStatus = 'REJECTED';
    status = 'REJECTED';
  }

  const rawInstId = docObj.institutionId?._id
    ? docObj.institutionId._id.toString()
    : (docObj.institutionId ? docObj.institutionId.toString() : '');

  return {
    ...docObj,
    _id: docId,
    id: docId,
    documentType: docType,
    type: docType,
    title: docObj.title || docObj.name || docType,
    name: docObj.name || docObj.title || docType,
    institutionId: rawInstId,
    institutionName: docObj.institutionName || 'Institution',
    verificationStatus,
    status,
    fileUrl: docObj.fileUrl || `/api/v1/documents/${docId}/file`,
    fileDataUrl: docObj.fileDataUrl || docObj.fileUrl || `/api/v1/documents/${docId}/file`,
    fileName: docObj.fileName || docObj.originalFileName || `${docType}.pdf`,
    fileSize: docObj.fileSize || '1.4 MB',
    uploadedAt: docObj.uploadedAt || docObj.createdAt || new Date().toISOString(),
  };
}

class DocumentService {
  /**
   * Upload a new document for an institution
   */
  async upload(institutionIdentifier, data, file, uploadedByUser) {
    let institution = await resolveInstitution(institutionIdentifier, uploadedByUser);

    // Auto-create fallback institution for standalone user uploads if absent
    if (!institution && uploadedByUser) {
      institution = await Institution.create({
        name: uploadedByUser.name || 'Registered Institution',
        email: uploadedByUser.email || 'admin@school.edu.in',
        adminUserId: uploadedByUser._id,
        district: uploadedByUser.district || 'Lucknow',
        zone: uploadedByUser.zone || 'CENTRAL',
        status: 'PENDING_DOCUMENT_VERIFICATION',
        verificationStatus: 'UNVERIFIED',
      });
    }

    if (!institution) {
      const err = new Error('Institution record not found.');
      err.statusCode = 404;
      throw err;
    }

    const targetInstId = institution._id;
    const docType = canonicalizeDocType(data.documentType || data.type || 'FIRE_SAFETY');
    const docTitle = data.title || data.name || docType;

    // Mark previous versions of same document type as non-latest
    await Document.updateMany(
      { institutionId: targetInstId, documentType: docType, isLatestVersion: true },
      { $set: { isLatestVersion: false } }
    );

    // Stream to GridFS if file buffer is present
    let gridfsFile = null;
    if (file && file.buffer) {
      try {
        gridfsFile = await gridfsService.uploadStream(
          file.buffer,
          file.originalname || `${docType}.pdf`,
          file.mimetype || 'application/pdf'
        );
      } catch (err) {
        console.warn('[DocumentService] GridFS upload stream notice:', err.message);
      }
    }

    const gridfsId = gridfsFile?._id ? gridfsFile._id : null;
    const fileUrlPath = gridfsId
      ? `/api/v1/documents/${gridfsId}/file`
      : `/uploads/documents/${file?.filename || `${docType}.pdf`}`;

    const safeMimeType = file?.mimetype || 'application/pdf';
    const safeSize = file?.size || 1024;
    const safeDataUrl = file?.buffer ? `data:${safeMimeType};base64,${file.buffer.toString('base64')}` : '';

    // 1. Create Document model entry in MongoDB Atlas
    const document = await Document.create({
      institutionId: targetInstId,
      institutionName: institution.name,
      institutionType: institution.type || 'SCHOOL',
      district: institution.district || 'Lucknow',
      zone: institution.zone || 'CENTRAL',
      assignedInspectorId: institution.assignedInspectorId || null,
      assignedInspectorName: institution.assignedInspectorName || '',

      documentType: docType,
      title: docTitle,
      description: data.description || '',
      originalFileName: file?.originalname || `${docType}.pdf`,
      storedFileName: file?.filename || (gridfsId ? `${gridfsId}.pdf` : `${docType}.pdf`),
      fileStorageType: gridfsId ? 'GRIDFS' : 'LOCAL',
      fileId: gridfsId,
      fileUrl: fileUrlPath,
      fileDataUrl: safeDataUrl,
      fileName: file?.originalname || `${docType}.pdf`,
      fileType: safeMimeType,
      fileMimeType: safeMimeType,
      fileSize: (safeSize / (1024 * 1024)).toFixed(2) + ' MB',
      uploadedBy: uploadedByUser ? uploadedByUser._id : targetInstId,
      isLatestVersion: true,
      verificationStatus: 'PENDING',
    });

    // 2. Embed document directly inside Institution.documents array for 0ms instant reads
    const docEntry = {
      _id: document._id.toString(),
      name: docTitle,
      title: docTitle,
      type: docType,
      documentType: docType,
      institutionId: targetInstId.toString(),
      institutionName: institution.name,
      status: 'PENDING_REVIEW',
      verificationStatus: 'PENDING',
      uploadedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      fileSize: (safeSize / (1024 * 1024)).toFixed(2) + ' MB',
      fileName: file?.originalname || `${docType}.pdf`,
      fileUrl: fileUrlPath,
      fileDataUrl: safeDataUrl,
      remarks: 'Awaiting Inspector verification',
    };

    const currentDocs = Array.isArray(institution.documents) ? [...institution.documents] : [];
    const existingIdx = currentDocs.findIndex(d => canonicalizeDocType(d.type || d.documentType) === docType);
    if (existingIdx >= 0) {
      currentDocs[existingIdx] = { ...currentDocs[existingIdx], ...docEntry };
    } else {
      currentDocs.unshift(docEntry);
    }
    institution.documents = currentDocs;
    institution.markModified('documents');
    await institution.save();

    // 3. Dispatch non-blocking notification to district inspector
    try {
      if (institution.adminUserId) {
        await Notification.create({
          userId: institution.adminUserId,
          type: 'INFO',
          title: 'Document Uploaded',
          message: `Your "${docTitle}" was uploaded successfully and is awaiting Inspector verification.`,
          module: 'DOCUMENT',
          referenceId: document._id,
        });
      }
    } catch (nErr) {
      console.warn('[DocumentService] Notification notice:', nErr.message);
    }

    return normalizeDocument(document);
  }

  /**
   * Get all documents for a specific institution
   */
  async getForInstitution(institutionIdentifier, { page = 1, limit = 50, documentType } = {}) {
    const institution = await resolveInstitution(institutionIdentifier);
    const targetInstId = institution ? institution._id : institutionIdentifier;

    const query = {
      $or: [
        { institutionId: targetInstId },
        { institutionId: String(targetInstId) },
        { institutionId: String(institutionIdentifier) },
        { email: institution ? institution.email : String(institutionIdentifier) }
      ],
      isLatestVersion: true,
    };
    if (documentType) query.documentType = canonicalizeDocType(documentType);

    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      Document.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('uploadedBy', 'name email')
        .populate('verifiedBy', 'name email')
        .lean(),
      Document.countDocuments(query),
    ]);

    const instDocs = (institution && Array.isArray(institution.documents)) ? institution.documents : [];
    const mergedMap = new Map();

    [...instDocs, ...documents].forEach(d => {
      const norm = normalizeDocument(d);
      if (norm && norm.documentType) {
        mergedMap.set(norm.documentType, norm);
      }
    });

    const normalizedDocs = Array.from(mergedMap.values());
    return { documents: normalizedDocs, meta: buildPaginationMeta(total, page, limit) };
  }

  /**
   * Get inspector documents for pending or audited verification
   */
  async getForInspector({ zone, district } = {}) {
    const query = { isLatestVersion: true };
    const docs = await Document.find(query)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email')
      .populate('verifiedBy', 'name email')
      .lean();

    const instQuery = {};
    if (zone) instQuery.zone = new RegExp(zone, 'i');
    if (district) instQuery.district = new RegExp(district, 'i');

    const insts = await Institution.find(instQuery).lean();
    const instDocs = [];

    insts.forEach((i) => {
      if (Array.isArray(i.documents)) {
        i.documents.forEach((d) => {
          if (d) {
            const norm = normalizeDocument({
              ...d,
              institutionId: i._id,
              institutionName: i.name,
              district: i.district,
              zone: i.zone,
            });
            if (norm) instDocs.push(norm);
          }
        });
      }
    });

    const mergedMap = new Map();
    [...instDocs, ...docs].forEach((d) => {
      const norm = normalizeDocument(d);
      if (norm) {
        const key = `${norm.institutionId || norm.institutionName}_${norm.documentType}`;
        mergedMap.set(key, norm);
      }
    });

    return { documents: Array.from(mergedMap.values()) };
  }

  /**
   * Verify or reject a document
   */
  async verifyDocument(documentId, action, verifierId, reason) {
    const document = await Document.findById(documentId).populate('institutionId');
    if (!document) {
      const err = new Error('Document record not found.');
      err.statusCode = 404;
      throw err;
    }

    const isApprove = action === 'APPROVE' || action === 'VERIFY';
    document.verificationStatus = isApprove ? DOCUMENT_VERIFICATION_STATUS.APPROVED : DOCUMENT_VERIFICATION_STATUS.REJECTED;
    document.verifiedBy = verifierId;
    document.verifiedAt = new Date();
    document.rejectionReason = isApprove ? null : reason;
    await document.save();

    // Sync status change to embedded institution.documents array
    const institution = await Institution.findById(document.institutionId);
    if (institution && Array.isArray(institution.documents)) {
      const docType = canonicalizeDocType(document.documentType);
      institution.documents = institution.documents.map(d => {
        if (d._id === document._id.toString() || canonicalizeDocType(d.type || d.documentType) === docType) {
          return {
            ...d,
            status: isApprove ? 'VERIFIED' : 'REJECTED',
            verificationStatus: document.verificationStatus,
            remarks: reason || d.remarks,
          };
        }
        return d;
      });
      institution.markModified('documents');
      await institution.save();
    }

    // Auto-recalculate compliance score & QR Code unlock status
    if (document.institutionId) {
      await this.getCompliance(document.institutionId);
    }

    return normalizeDocument(document);
  }

  /**
   * Resolve physical file path or GridFS stream for serving document
   */
  async getFile(documentId) {
    let document = null;
    let fileId = documentId;

    if (mongoose.Types.ObjectId.isValid(documentId)) {
      document = await Document.findById(documentId);
      if (document && document.fileId) {
        fileId = document.fileId;
      }
    }

    try {
      const gridFile = await gridfsService.findFileById(fileId);
      if (gridFile) {
        const downloadStream = gridfsService.openDownloadStream(fileId);
        return {
          stream: downloadStream,
          mimeType: gridFile.metadata?.mimeType || gridFile.contentType || 'application/pdf',
          filename: gridFile.filename || 'document.pdf',
          document,
        };
      }
    } catch (e) {
      console.warn('[DocumentService] GridFS file lookup notice:', e?.message);
    }

    let filePath = null;
    let mimeType = 'application/pdf';
    if (document && document.fileUrl) {
      filePath = path.join(__dirname, '../../', document.fileUrl);
      mimeType = document.fileType || document.fileMimeType || 'application/pdf';
    }

    return { filePath, mimeType, document };
  }

  /**
   * Calculate 4-document QR code unlock compliance status
   */
  async getCompliance(institutionIdentifier) {
    const institution = await resolveInstitution(institutionIdentifier);
    const targetInstId = institution ? institution._id : institutionIdentifier;

    const docs = await Document.find({ institutionId: targetInstId, isLatestVersion: true }).lean();
    const instDocs = (institution && Array.isArray(institution.documents)) ? institution.documents : [];

    const statusMap = {};
    MANDATORY_DOC_TYPES.forEach((t) => {
      statusMap[t] = { status: 'MISSING', document: null };
    });

    [...instDocs, ...docs].forEach((d) => {
      const norm = normalizeDocument(d);
      if (norm && statusMap[norm.documentType]) {
        statusMap[norm.documentType] = {
          status: norm.verificationStatus,
          document: norm,
        };
      }
    });

    const allApproved = MANDATORY_DOC_TYPES.every(
      (t) => statusMap[t].status === 'APPROVED' || statusMap[t].status === 'VERIFIED'
    );

    if (institution) {
      if (allApproved && !institution.isQrUnlocked) {
        institution.isQrUnlocked = true;
        if (!institution.safeId) {
          institution.safeId = `SAFE-UP-${(institution.district || 'LUC').slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
        }
        await institution.save();
      }
    }

    return {
      documents: statusMap,
      allDocumentsApproved: allApproved,
      qrUnlocked: allApproved || (institution ? institution.isQrUnlocked : false),
      safeId: institution ? institution.safeId : null,
    };
  }

  /**
   * Delete a document
   */
  async delete(documentId, userId, userRole) {
    const document = await Document.findById(documentId);
    if (!document) {
      const err = new Error('Document record not found.');
      err.statusCode = 404;
      throw err;
    }
    await Document.findByIdAndDelete(documentId);
  }
}

module.exports = new DocumentService();
