// ============================================================
// SafeED-UP — Institution Routes
// ============================================================
const router = require('express').Router();
const institutionController = require('../controllers/institution.controller');
const authenticate = require('../middleware/authenticate');
const { authorizeRoles, authorizePermission } = require('../middleware/authorize');
const { ROLES } = require('../constants/roles');
const { PERMISSIONS } = require('../constants/roles');

const { enforceInstitutionScope } = require('../middleware/scopeCheck');

router.use(authenticate);

// GET /api/v1/institutions/map-data (before /:id to avoid route conflict)
router.get('/map-data', institutionController.getMapData);

// GET /api/v1/institutions
router.get(
  '/',
  authorizePermission(PERMISSIONS.VIEW_ALL_INSTITUTIONS),
  institutionController.list
);

// POST /api/v1/institutions
router.post(
  '/',
  authorizeRoles(ROLES.SCHOOL_ADMIN, ROLES.COACHING_ADMIN, ROLES.SUPER_ADMIN),
  institutionController.register
);

// GET /api/v1/institutions/:id
router.get('/:id', enforceInstitutionScope('id'), institutionController.getById);

// PATCH /api/v1/institutions/:id
router.patch(
  '/:id',
  authorizeRoles(ROLES.SCHOOL_ADMIN, ROLES.COACHING_ADMIN, ROLES.SUPER_ADMIN, ROLES.DISTRICT_ADMIN),
  enforceInstitutionScope('id'),
  institutionController.update
);

// PATCH /api/v1/institutions/:id/verify
router.patch(
  '/:id/verify',
  authorizePermission(PERMISSIONS.VERIFY_INSTITUTION),
  institutionController.verify
);

module.exports = router;
