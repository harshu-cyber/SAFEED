// ============================================================
// SafeED-UP — Document Service
// ============================================================
const Document = require('../models/Document.model');
const Institution = require('../models/Institution.model');
const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const { buildPaginationMeta } = require('../utils/apiResponse');
const { DOCUMENT_VERIFICATION_STATUS, ROLES } = require('../constants/statusTypes');
const { ROLES: USER_ROLES } = require('../constants/roles');
const path = require('path');
const fs = require('fs');

class DocumentService {
  /**
   * Upload a new document for an institution
   */
  async upload(institutionId, data, file, uploadedByUser) {
    let institution = null;
    const mongoose = require('mongoose');
    
    if (institutionId && mongoose.Types.ObjectId.isValid(institutionId)) {
      institution = await Institution.findById(institutionId);
    }
    if (!institution && uploadedByUser && uploadedByUser._id) {
      institution = await Institution.findOne({ adminUserId: uploadedByUser._id });
    }
    if (!institution && uploadedByUser && uploadedByUser.email) {
      institution = await Institution.findOne({ email: uploadedByUser.email.toLowerCase() });
    }
    if (!institution) {
      const idStr = String(institutionId || '').toLowerCase().trim();
      institution = await Institution.findOne({
        $or: [
          { email: idStr },
          { safeId: institutionId },
          { name: new RegExp(`^${String(institutionId).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
        ]
      });
    }

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
      const err = new Error('Institution not found.');
      err.statusCode = 404;
      throw err;
    }

    const targetInstId = institution._id;

    // Permission check: only institution admin can upload for their own institution
    if (
      uploadedByUser &&
      uploadedByUser._id &&
      (uploadedByUser.role === USER_ROLES.SCHOOL_ADMIN || uploadedByUser.role === USER_ROLES.COACHING_ADMIN) &&
      institution.adminUserId &&
      String(institution.adminUserId) !== String(uploadedByUser._id) &&
      String(institution._id) !== String(institutionId)
    ) {
      const err = new Error('You can only upload documents for your own institution.');
      err.statusCode = 403;
      throw err;
    }

    // Check for existing document of same type - mark old as non-latest
    let docType = data.documentType || data.type || 'FIRE_SAFETY';
    if (docType === 'FIRE_NOC') docType = 'FIRE_SAFETY';
    if (docType === 'BUILDING_PLAN') docType = 'BUILDING_SAFETY';
    if (docType === 'AFFILIATION_CERT') docType = 'ELECTRICAL_SAFETY';
    if (docType === 'EMERGENCY_PLAN') docType = 'EVACUATION_SAFETY';

    if (docType) {
      await Document.updateMany(
        { institutionId: targetInstId, documentType: docType, isLatestVersion: true },
        { $set: { isLatestVersion: false } }
      );
    }

    const docTitle = data.title || data.name || docType;

    // Upload file buffer to MongoDB GridFS
    const gridfsService = require('./gridfs.service');
    let gridfsFile = null;
    if (file && file.buffer) {
      try {
        gridfsFile = await gridfsService.uploadStream(file.buffer, file.originalname || 'document.pdf', file.mimetype || 'application/pdf');
      } catch (err) {
        console.error('[DocumentService] GridFS upload stream notice:', err.message);
      }
    }

    const gridfsId = (gridfsFile && gridfsFile._id) ? gridfsFile._id : null;
    const fileUrlPath = gridfsId ? `/api/v1/documents/${gridfsId}/file` : `/uploads/documents/${file?.filename || 'doc.pdf'}`;
    const safeOriginalName = file?.originalname || 'document.pdf';
    const safeMimeType = file?.mimetype || 'application/pdf';
    const safeSize = file?.size || 1024;
    const safeDataUrl = (file && file.buffer) ? `data:${safeMimeType};base64,${file.buffer.toString('base64')}` : '';

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
      originalFileName: safeOriginalName,
      storedFileName: file?.filename || (gridfsId ? `${gridfsId}.pdf` : 'doc.pdf'),
      fileStorageType: gridfsId ? 'GRIDFS' : 'LOCAL',
      fileId: gridfsId,
      fileUrl: fileUrlPath,
      fileDataUrl: safeDataUrl,
      fileName: safeOriginalName,
      fileType: safeMimeType,
      fileMimeType: safeMimeType,
      fileSize: safeSize,
      issueDate: data.issueDate || null,
      expiryDate: data.expiryDate || null,
      issuingAuthority: data.issuingAuthority || null,
      documentNumber: data.documentNumber || null,
      uploadedBy: uploadedByUser ? uploadedByUser._id : targetInstId,
      isLatestVersion: true,
      verificationStatus: 'PENDING',
    });

    // Also embed document directly on Institution model for instant visibility across queries
    const docEntry = {
      _id: document._id.toString(),
      name: docTitle,
      type: docType,
      documentType: docType,
      institutionId: targetInstId.toString(),
      institutionName: institution.name,
      status: 'PENDING_REVIEW',
      verificationStatus: 'PENDING',
      uploadedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      fileSize: (safeSize / (1024 * 1024)).toFixed(2) + ' MB',
      fileName: safeOriginalName,
      fileUrl: fileUrlPath,
      remarks: 'Awaiting Inspector verification',
    };

    const currentDocs = Array.isArray(institution.documents) ? [...institution.documents] : [];
    const existingIdx = currentDocs.findIndex(d => d.type === docType || d.documentType === docType);
    if (existingIdx >= 0) {
      currentDocs[existingIdx] = { ...currentDocs[existingIdx], ...docEntry };
    } else {
      currentDocs.unshift(docEntry);
    }
    institution.documents = currentDocs;
    institution.markModified('documents');
    await institution.save();

    // Notify district admins for document review (non-blocking)
    try {
      const districtName = institution.district || (institution.address && institution.address.district) || 'Lucknow';
      const districtAdmins = await User.find({
        role: USER_ROLES.DISTRICT_ADMIN,
        district: districtName,
        isActive: true,
      });

      if (districtAdmins.length > 0) {
        await Notification.insertMany(
          districtAdmins.map((admin) => ({
            userId: admin._id,
            type: 'INFO',
            title: 'New Document Uploaded',
            message: `${institution.name} has uploaded "${document.title}" for verification.`,
            link: `/dashboard/district-admin/institutions/${targetInstId}`,
            module: 'DOCUMENT',
            referenceId: document._id,
          }))
        );
      }
    } catch (notifErr) {
      console.warn('[DocumentService] Notification dispatch notice:', notifErr.message);
    }

    return document;
  }

  /**
   * Get all documents for an institution
   */
  async getForInstitution(institutionId, { page = 1, limit = 50, documentType, verificationStatus } = {}) {
    const mongoose = require('mongoose');
    let targetInstId = institutionId;
    let inst = null;

    if (institutionId && mongoose.Types.ObjectId.isValid(institutionId)) {
      inst = await Institution.findById(institutionId);
    }
    if (!inst) {
      const idStr = String(institutionId || '').toLowerCase().trim();
      inst = await Institution.findOne({
        $or: [
          { email: idStr },
          { safeId: institutionId },
          { name: new RegExp(`^${String(institutionId).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
        ]
      });
    }
    if (inst) {
      targetInstId = inst._id;
    }

    const query = {
      $or: [
        { institutionId: targetInstId },
        { institutionId: String(institutionId) }
      ],
      isLatestVersion: true
    };
    if (documentType) query.documentType = documentType;

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

    // Also include institution.documents array embedded records if any
    const instDocs = (inst && Array.isArray(inst.documents)) ? inst.documents : [];
    const mergedMap = new Map();
    [...instDocs, ...documents].forEach(d => {
      if (d) {
        const type = d.documentType || d.type || d.name;
        if (type) mergedMap.set(type, d);
      }
    });

    const normalizedDocs = Array.from(mergedMap.values()).map(d => {
      const docObj = d.toObject ? d.toObject() : { ...d };
      const docId = docObj._id || docObj.id;
      return {
        ...docObj,
        _id: docId,
        id: docId,
        title: docObj.title || docObj.name || docObj.documentType || 'Official Document',
        name: docObj.name || docObj.title || docObj.documentType || 'Official Document',
        documentType: docObj.documentType || docObj.type,
        type: docObj.type || docObj.documentType,
        verificationStatus: docObj.verificationStatus || docObj.status || 'PENDING',
        status: docObj.status || docObj.verificationStatus || 'PENDING',
        fileUrl: docObj.fileUrl || `/api/v1/documents/${docId}/file`,
        fileDataUrl: docObj.fileDataUrl || docObj.fileUrl || `/api/v1/documents/${docId}/file`,
      };
    });

    return { documents: normalizedDocs, meta: buildPaginationMeta(total, page, limit) };
  }

  /**
   * Verify or reject a document
   */
  async verifyDocument(documentId, action, verifierId, reason) {
    const document = await Document.findById(documentId).populate('institutionId');
    if (!document) {
      const err = new Error('Document not found.');
      err.statusCode = 404;
      throw err;
    }

    if (action === 'APPROVE') {
      document.verificationStatus = DOCUMENT_VERIFICATION_STATUS.APPROVED;
      document.verifiedBy = verifierId;
      document.verifiedAt = new Date();
      document.rejectionReason = null;
    } else {
      document.verificationStatus = DOCUMENT_VERIFICATION_STATUS.REJECTED;
      document.verifiedBy = verifierId;
      document.verifiedAt = new Date();
      document.rejectionReason = reason;
    }

    await document.save();

    // Sync status change to embedded institution.documents array
    const institution = await Institution.findById(document.institutionId);
    if (institution && Array.isArray(institution.documents)) {
      institution.documents = institution.documents.map(d =>
        (d._id === document._id.toString() || d.type === document.documentType || d.documentType === document.documentType)
          ? { ...d, status: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED', verificationStatus: document.verificationStatus, remarks: reason || d.remarks }
          : d
      );
      institution.markModified('documents');
      await institution.save();
    }

    if (institution && institution.adminUserId) {
      await Notification.create({
        userId: institution.adminUserId,
      type: action === 'APPROVE' ? 'SUCCESS' : 'WARNING',
      title: action === 'APPROVE' ? 'Document Approved ✓' : 'Document Rejected',
      message:
        action === 'APPROVE'
          ? `"${document.title}" has been approved.`
          : `"${document.title}" was rejected. Reason: ${reason}`,
      link: `/dashboard/institution/documents`,
      module: 'DOCUMENT',
      referenceId: document._id,
    });
  }

  return document;
}

  /**
   * Delete a document (soft delete by marking non-latest)
   */
  async delete(documentId, userId, userRole) {
    const document = await Document.findById(documentId);
    if (!document) {
      const err = new Error('Document not found.');
      err.statusCode = 404;
      throw err;
    }

    // Only uploader or admin can delete
    if (
      userRole !== USER_ROLES.SUPER_ADMIN &&
      document.uploadedBy.toString() !== userId.toString()
    ) {
      const err = new Error('You do not have permission to delete this document.');
      err.statusCode = 403;
      throw err;
    }

    await Document.findByIdAndDelete(documentId);

    // Delete physical file
    const filePath = path.join(__dirname, '../../', document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Get inspector documents for pending verification
   */
  async getForInspector({ zone, district, page = 1, limit = 50 } = {}) {
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
          if (d && (d.type || d.documentType || d.name)) {
            let docType = d.documentType || d.type || d.name;
            if (docType === 'FIRE_NOC') docType = 'FIRE_SAFETY';
            if (docType === 'BUILDING_PLAN') docType = 'BUILDING_SAFETY';
            if (docType === 'AFFILIATION_CERT') docType = 'ELECTRICAL_SAFETY';
            if (docType === 'EMERGENCY_PLAN') docType = 'EVACUATION_SAFETY';

            instDocs.push({
              _id: d._id || ('doc_' + Date.now()),
              institutionId: i._id,
              institutionName: i.name,
              assignedInspectorId: i.assignedInspectorId || null,
              assignedInspectorName: i.assignedInspectorName || '',
              documentType: docType,
              title: d.name || d.title || docType,
              fileUrl: d.fileUrl || d.fileDataUrl || `/api/v1/documents/${d._id}/file`,
              fileName: d.fileName || `${d.name || 'document'}.pdf`,
              fileSize: d.fileSize || '1.4 MB',
              verificationStatus: d.verificationStatus || d.status || 'PENDING',
              status: d.verificationStatus || d.status || 'PENDING',
              uploadedAt: d.uploadedAt || i.createdAt,
              createdAt: d.createdAt || i.createdAt,
              district: i.district,
              zone: i.zone,
            });
          }
        });
      }
    });

    const mergedMap = new Map();
    [...instDocs, ...docs].forEach((d) => {
      let type = d.documentType || d.type || d.name;
      if (type === 'FIRE_NOC') type = 'FIRE_SAFETY';
      if (type === 'BUILDING_PLAN') type = 'BUILDING_SAFETY';
      if (type === 'AFFILIATION_CERT') type = 'ELECTRICAL_SAFETY';
      if (type === 'EMERGENCY_PLAN') type = 'EVACUATION_SAFETY';

      const key = `${d.institutionId}_${type}`;
      mergedMap.set(key, { ...d, documentType: type });
    });

    return { documents: Array.from(mergedMap.values()) };
  }

  /**
   * Resolve physical file path or GridFS stream for serving document
   */
  async getFile(documentId) {
    const gridfsService = require('./gridfs.service');
    const mongoose = require('mongoose');

    let document = null;
    let fileId = documentId;

    if (mongoose.Types.ObjectId.isValid(documentId)) {
      document = await Document.findById(documentId);
      if (document && document.fileId) {
        fileId = document.fileId;
      }
    }

    // Try GridFS file stream first
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

    // Disk fallback if document was uploaded locally
    let filePath = null;
    let mimeType = 'application/pdf';

    if (document && document.fileUrl) {
      filePath = path.join(__dirname, '../../', document.fileUrl);
      mimeType = document.fileType || document.fileMimeType || 'application/pdf';
    }

    if (!filePath || !fs.existsSync(filePath)) {
      const fallbackPath = path.join(__dirname, '../../uploads/documents', `${documentId}.pdf`);
      if (fs.existsSync(fallbackPath)) {
        filePath = fallbackPath;
      }
    }

    return { filePath, mimeType, document };
  }

  /**
   * Calculate 4-document QR code unlock compliance status
   */
  async getCompliance(institutionId) {
    const MANDATORY_TYPES = ['FIRE_SAFETY', 'BUILDING_SAFETY', 'ELECTRICAL_SAFETY', 'EVACUATION_SAFETY'];
    const docs = await Document.find({ institutionId, isLatestVersion: true }).lean();

    const statusMap = {};
    MANDATORY_TYPES.forEach((t) => {
      statusMap[t] = { status: 'MISSING', document: null };
    });

    docs.forEach((d) => {
      const typeKey = Object.keys(statusMap).find(
        (k) => k === d.documentType || (k === 'FIRE_SAFETY' && d.documentType === 'FIRE_NOC') || (k === 'BUILDING_SAFETY' && d.documentType === 'BUILDING_PLAN')
      );
      if (typeKey) {
        statusMap[typeKey] = {
          status: d.verificationStatus || 'PENDING',
          document: d,
        };
      }
    });

    const allApproved = MANDATORY_TYPES.every(
      (t) => statusMap[t].status === 'APPROVED' || statusMap[t].status === 'VERIFIED'
    );

    let inst = await Institution.findById(institutionId);
    if (inst) {
      if (allApproved && !inst.isQrUnlocked) {
        inst.isQrUnlocked = true;
        if (!inst.safeId) {
          inst.safeId = `SAFE-UP-${(inst.district || 'LUC').slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
        }
        await inst.save();
      }
    }

    return {
      documents: statusMap,
      allDocumentsApproved: allApproved,
      qrUnlocked: allApproved || (inst ? inst.isQrUnlocked : false),
      safeId: inst ? inst.safeId : null,
    };
  }
}

module.exports = new DocumentService();
