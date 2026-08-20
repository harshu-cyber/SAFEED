// ============================================================
// SafeED-UP — API Router Index
// Aggregate all route modules under /api/v1
// ============================================================
const router = require('express').Router();

const authRoutes = require('./auth.routes');
const institutionRoutes = require('./institution.routes');
const inspectionRoutes = require('./inspection.routes');
const documentRoutes = require('./document.routes');
const complianceRoutes = require('./compliance.routes');
const deficiencyRoutes = require('./deficiency.routes');
const notificationRoutes = require('./notification.routes');
const userRoutes = require('./user.routes');
const analyticsRoutes = require('./analytics.routes');
const publicRoutes = require('./public.routes');
const searchRoutes = require('./search.routes');
const reportRoutes = require('./report.routes');
const qrRoutes = require('./qr.routes');

router.use('/auth', authRoutes);
router.use('/institutions', institutionRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/documents', documentRoutes);
router.use('/compliance', complianceRoutes);
router.use('/deficiencies', deficiencyRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/public', publicRoutes);
router.use('/search', searchRoutes);
router.use('/reports', reportRoutes);
router.use('/qr', qrRoutes);

module.exports = router;
