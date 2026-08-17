// ============================================================
// SafeED-UP — Analytics Routes
// ============================================================
const router = require('express').Router();
const analyticsController = require('../controllers/analytics.controller');
const authenticate = require('../middleware/authenticate');
const { authorizeRoles } = require('../middleware/authorize');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

router.get('/state', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN), analyticsController.getStateAnalytics);
router.get('/district/:district', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN, ROLES.DISTRICT_ADMIN, ROLES.POLICE_OFFICER, ROLES.FIRE_OFFICER), analyticsController.getDistrictAnalytics);
router.get('/institution/:id', analyticsController.getInstitutionAnalytics);

module.exports = router;
