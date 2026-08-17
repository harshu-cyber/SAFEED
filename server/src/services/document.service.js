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
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      const err = new Error('Institution not found.');
      err.statusCode = 404;
      throw err;
    }

    // Permission check: only institution admin can upload for their own institution
    if (
      (uploadedByUser.role === USER_ROLES.SCHOOL_ADMIN || uploadedByUser.role === USER_ROLES.COACHING_ADMIN) &&
      institution.adminUserId.toString() !== uploadedByUser._id.toString()
    ) {
      const err = new Error('You can only upload documents for your own institution.');
      err.statusCode = 403;
      throw err;
    }

    // Check for existing document of same type - mark old as non-latest
    if (data.documentType) {
      await Document.updateMany(
        { institutionId, documentType: data.documentType, isLatestVersion: true },
        { $set: { isLatestVersion: false } }
      );
    }

    const document = await Document.create({
      institutionId,
      documentType: data.documentType,
      title: data.title,
      description: data.description,
      fileUrl: `/uploads/documents/${file.filename}`,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      issueDate: data.issueDate || null,
      expiryDate: data.expiryDate || null,
      issuingAuthority: data.issuingAuthority,
      documentNumber: data.documentNumber,
      uploadedBy: uploadedByUser._id,
      isLatestVersion: true,
    });

    // Notify district admins for document review
    const districtAdmins = await User.find({
      role: USER_ROLES.DISTRICT_ADMIN,
      district: institution.address.district,
      isActive: true,
    });

    if (districtAdmins.length > 0) {
      await Notification.insertMany(
        districtAdmins.map((admin) => ({
          userId: admin._id,
          type: 'INFO',
          title: 'New Document Uploaded',
          message: `${institution.name} has uploaded "${document.title}" for verification.`,
          link: `/dashboard/district-admin/institutions/${institutionId}`,
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
  async getForInstitution(institutionId, { page = 1, limit = 20, documentType, verificationStatus } = {}) {
    const query = { institutionId, isLatestVersion: true };
    if (documentType) query.documentType = documentType;
    if (verificationStatus) query.verificationStatus = verificationStatus;

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

    return { documents, meta: buildPaginationMeta(total, page, limit) };
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
