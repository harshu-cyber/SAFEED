// ============================================================
// SafeED-UP — Public Routes (Unauthenticated)
// ============================================================
const router = require('express').Router();
const publicVerificationController = require('../controllers/publicVerification.controller');
const { publicLimiter } = require('../middleware/rateLimiter');

router.get('/stats', publicLimiter, publicVerificationController.getPublicStats);
router.get('/verify/:safeId', publicLimiter, publicVerificationController.verifyInstitution);
router.post('/qr-scan/:safeId', publicLimiter, publicVerificationController.logQRScan);

module.exports = router;
