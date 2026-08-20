// ============================================================
// SafeED-UP — Document Controller
// ============================================================
const documentService = require('../services/document.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/v1/documents/institution/:id
const upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, { statusCode: 400, message: 'No file uploaded.' });
  }
  const document = await documentService.upload(
    req.params.id,
    req.body,
    req.file,
    req.user
  );
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Document uploaded successfully. Awaiting verification.',
    data: { document },
  });
});

// GET /api/v1/documents/institution/:id
const getForInstitution = asyncHandler(async (req, res) => {
  const { page, limit, documentType, verificationStatus } = req.query;
  const result = await documentService.getForInstitution(req.params.id, {
    page, limit, documentType, verificationStatus,
  });
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Documents retrieved successfully.',
    data: { documents: result.documents },
    meta: result.meta,
  });
});

// PATCH /api/v1/documents/:id/verify
const verifyDocument = asyncHandler(async (req, res) => {
  const { action, reason } = req.body;
  if (!['APPROVE', 'REJECT'].includes(action)) {
    return sendError(res, { statusCode: 400, message: "Action must be 'APPROVE' or 'REJECT'." });
  }
  const document = await documentService.verifyDocument(
    req.params.id,
    action,
    req.user._id,
    reason
  );
  return sendSuccess(res, {
    statusCode: 200,
    message: `Document ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`,
    data: { document },
  });
});

// GET /api/v1/documents/inspector/pending
const getForInspector = asyncHandler(async (req, res) => {
  const { zone, district, page, limit } = req.query;
  const inspectorZone = zone || req.user?.assignedZone || req.user?.zone;
  const inspectorDistrict = district || req.user?.district;
  const result = await documentService.getForInspector({
    zone: inspectorZone,
    district: inspectorDistrict,
    page,
    limit,
  });
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Inspector documents retrieved successfully.',
    data: { documents: result.documents },
  });
});

// GET /api/v1/documents/:id/file
const serveFile = asyncHandler(async (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const fileData = await documentService.getFile(req.params.id);

  if (fileData && fileData.filePath && fs.existsSync(fileData.filePath)) {
    res.setHeader('Content-Type', fileData.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    return res.sendFile(path.resolve(fileData.filePath));
  }

  return sendError(res, { statusCode: 404, message: 'Document file unavailable.' });
});

// DELETE /api/v1/documents/:id
const deleteDocument = asyncHandler(async (req, res) => {
  await documentService.delete(req.params.id, req.user._id, req.user.role);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Document deleted successfully.',
  });
});

module.exports = { upload, getForInstitution, getForInspector, serveFile, verifyDocument, deleteDocument };
