// ============================================================
// SafeED-UP — Canonical Document Controller
// Single Source of Truth for Document Verification Workflow
// ============================================================
const documentService = require('../services/document.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/v1/documents
const upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, { statusCode: 400, message: 'No file uploaded. Please attach a file.' });
  }

  const document = await documentService.uploadDocument(req.user, req.file, req.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Document uploaded successfully and queued for Inspector review.',
    data: { document },
  });
});

// GET /api/v1/documents/my
const getMyDocuments = asyncHandler(async (req, res) => {
  const documents = await documentService.getMyDocuments(req.user);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Institution documents retrieved successfully.',
    data: { documents },
  });
});

// GET /api/v1/documents/inspector/assigned
const getInspectorAssigned = asyncHandler(async (req, res) => {
  const documents = await documentService.getInspectorAssignedDocuments(req.user);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Inspector assigned documents retrieved successfully.',
    data: { documents },
  });
});

// GET /api/v1/documents/:id/file
const serveFile = asyncHandler(async (req, res) => {
  const { stream, mimeType, originalFileName } = await documentService.getDocumentFileStream(req.params.id);

  res.setHeader('Content-Type', mimeType || 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(originalFileName)}"`);
  return stream.pipe(res);
});

// PATCH /api/v1/documents/:id/approve
const approveDocument = asyncHandler(async (req, res) => {
  const document = await documentService.approveDocument(req.params.id, req.user);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Document approved successfully.',
    data: { document },
  });
});

// PATCH /api/v1/documents/:id/reject
const rejectDocument = asyncHandler(async (req, res) => {
  const { reason, rejectionReason } = req.body;
  const document = await documentService.rejectDocument(
    req.params.id,
    req.user,
    reason || rejectionReason || 'Rejected by Inspector'
  );
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Document rejected successfully.',
    data: { document },
  });
});

// GET /api/v1/documents/qr-status
const getQrStatus = asyncHandler(async (req, res) => {
  const instId = req.query.institutionId || req.user.institutionId;
  if (!instId) {
    return sendError(res, { statusCode: 400, message: 'institutionId is required' });
  }
  const status = await documentService.getQrStatus(instId);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'QR Status retrieved successfully.',
    data: status,
  });
});

module.exports = {
  upload,
  getMyDocuments,
  getInspectorAssigned,
  serveFile,
  approveDocument,
  rejectDocument,
  getQrStatus,
};
