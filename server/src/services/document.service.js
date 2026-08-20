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

    if (!institution) {
      const err = new Error('Institution not found.');
      err.statusCode = 404;
      throw err;
    }

    const targetInstId = institution._id;

    // Permission check: only institution admin can upload for their own institution
    if (
      uploadedByUser &&
      (uploadedByUser.role === USER_ROLES.SCHOOL_ADMIN || uploadedByUser.role === USER_ROLES.COACHING_ADMIN) &&
      institution.adminUserId &&
      institution.adminUserId.toString() !== uploadedByUser._id.toString()
    ) {
      const err = new Error('You can only upload documents for your own institution.');
      err.statusCode = 403;
      throw err;
    }

    // Check for existing document of same type - mark old as non-latest
    const docType = data.documentType || data.type || 'FIRE_NOC';
    if (docType) {
      await Document.updateMany(
        { institutionId: targetInstId, documentType: docType, isLatestVersion: true },
        { $set: { isLatestVersion: false } }
      );
    }

    const docTitle = data.title || data.name || docType;
    const fileUrlPath = `/uploads/documents/${file.filename}`;

    const document = await Document.create({
      institutionId: targetInstId,
      documentType: docType,
      title: docTitle,
      description: data.description || '',
      fileUrl: fileUrlPath,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
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
      fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      fileName: file.originalname,
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

    // Notify district admins for document review
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

    return { documents: Array.from(mergedMap.values()), meta: buildPaginationMeta(total, page, limit) };
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

    // Notify institution admin
    const institution = document.institutionId;
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
}

module.exports = new DocumentService();
