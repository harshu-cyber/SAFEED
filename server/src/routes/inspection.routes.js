// ============================================================
// SafeED-UP — Inspection Routes
// ============================================================
const router = require('express').Router();
const inspectionController = require('../controllers/inspection.controller');
const authenticate = require('../middleware/authenticate');
const { authorizePermission, authorizeRoles } = require('../middleware/authorize');
const { PERMISSIONS, ROLES } = require('../constants/roles');

router.use(authenticate);

router.get('/', inspectionController.list);

router.post(
  '/',
  authorizePermission(PERMISSIONS.SCHEDULE_INSPECTION),
  inspectionController.schedule
);

router.get('/:id', inspectionController.getById);

router.patch(
  '/:id/submit',
  authorizePermission(PERMISSIONS.CONDUCT_INSPECTION),
  inspectionController.submitResults
);

module.exports = router;
