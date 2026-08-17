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

// DELETE /api/v1/documents/:id
const deleteDocument = asyncHandler(async (req, res) => {
  await documentService.delete(req.params.id, req.user._id, req.user.role);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Document deleted successfully.',
  });
});

module.exports = { upload, getForInstitution, verifyDocument, deleteDocument };
