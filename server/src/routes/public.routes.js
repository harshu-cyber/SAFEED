// ============================================================
// SafeED-UP — Public Routes (Unauthenticated)
// ============================================================
const router = require('express').Router();
const publicVerificationController = require('../controllers/publicVerification.controller');
const { publicLimiter } = require('../middleware/rateLimiter');

router.get('/stats', publicLimiter, publicVerificationController.getPublicStats);
router.get('/verify/:safeId', publicLimiter, publicVerificationController.verifyInstitution);
router.post('/qr-scan/:safeId', publicLimiter, publicVerificationController.logQRScan);

// Production MongoDB Atlas Seeding Route
router.get('/seed', async (req, res) => {
  try {
    const User = require('../models/User.model');
    const Institution = require('../models/Institution.model');
    const { ROLES } = require('../constants/roles');

    // Ensure Super Admin
    let sa = await User.findOne({ email: 'superadmin@safeed.ac.in' });
    if (!sa) {
      sa = await User.create({
        name: 'Super Admin (SafeED)',
        email: 'superadmin@safeed.ac.in',
        password: 'harshsafeed',
        role: ROLES.SUPER_ADMIN,
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        isActive: true,
        isEmailVerified: true,
      });
    }

    const countUsers = await User.countDocuments();
    const countInsts = await Institution.countDocuments();

    return res.status(200).json({
      success: true,
      message: 'MongoDB Atlas Seeding Complete',
      usersCount: countUsers,
      institutionsCount: countInsts,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
