// ============================================================
// SafeED-UP — Document Routes
// ============================================================
const router = require('express').Router();
const documentController = require('../controllers/document.controller');
const authenticate = require('../middleware/authenticate');
const { authorizeRoles, authorizePermission } = require('../middleware/authorize');
const { ROLES, PERMISSIONS } = require('../constants/roles');
const upload = require('../config/multerConfig');

const { enforceInstitutionScope } = require('../middleware/scopeCheck');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);

// GET /api/v1/documents/institution/:id
router.get('/institution/:id', enforceInstitutionScope('id'), documentController.getForInstitution);

// POST /api/v1/documents/institution/:id (multipart/form-data)
router.post(
  '/institution/:id',
  uploadLimiter,
  upload.single('file'),
  authorizePermission(PERMISSIONS.UPLOAD_DOCUMENT),
  enforceInstitutionScope('id'),
  documentController.upload
);

// PATCH /api/v1/documents/:id/verify
router.patch(
  '/:id/verify',
  authorizePermission(PERMISSIONS.VERIFY_DOCUMENT),
  documentController.verifyDocument
);

// DELETE /api/v1/documents/:id
router.delete(
  '/:id',
  authorizePermission(PERMISSIONS.DELETE_DOCUMENT),
  documentController.deleteDocument
);

module.exports = router;
