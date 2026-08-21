// ============================================================
// SafeED-UP — Canonical Document Routes
// Single Source of Truth for Document Verification Workflow
// ============================================================
const router = require('express').Router();
const documentController = require('../controllers/document.controller');
const authenticate = require('../middleware/authenticate');
const upload = require('../config/multerConfig');

// Authenticate all document endpoints with real JWT token
router.use(authenticate);

// POST /api/v1/documents (Institution upload with multipart/form-data)
router.post('/', upload.any(), documentController.upload);

// GET /api/v1/documents/my (Institution canonical document list)
router.get('/my', documentController.getMyDocuments);

// GET /api/v1/documents/inspector/assigned (Inspector assigned document list)
router.get('/inspector/assigned', documentController.getInspectorAssigned);
router.get('/inspector/pending', documentController.getInspectorAssigned);

// GET /api/v1/documents/qr-status (4-doc QR status)
router.get('/qr-status', documentController.getQrStatus);

// GET /api/v1/documents/:id/file (Binary file stream from GridFS)
router.get('/:id/file', documentController.serveFile);

// PATCH /api/v1/documents/:id/approve (Inspector approve)
router.patch('/:id/approve', documentController.approveDocument);

// PATCH /api/v1/documents/:id/reject (Inspector reject)
router.patch('/:id/reject', documentController.rejectDocument);

module.exports = router;
