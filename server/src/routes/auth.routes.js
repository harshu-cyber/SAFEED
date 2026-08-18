// ============================================================
// SafeED-UP — Auth Routes
// ============================================================
const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const validateRequest = require('../middleware/validateRequest');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  changePasswordValidators,
} = require('../validators/auth.validators');

// Public routes
router.post('/register', authLimiter, registerValidators, validateRequest, authController.register);
router.post('/login', authLimiter, loginValidators, validateRequest, authController.login);
router.post('/forgot-password', authLimiter, forgotPasswordValidators, validateRequest, authController.forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPasswordValidators, validateRequest, authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);
router.get('/setup-superadmin', authController.setupSuperAdmin);

// Protected routes
router.use(authenticate);
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);
router.patch('/change-password', changePasswordValidators, validateRequest, authController.changePassword);

module.exports = router;
