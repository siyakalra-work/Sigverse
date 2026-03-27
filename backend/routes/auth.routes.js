const router = require('express').Router();
const AuthController = require('../controllers/AuthController');
const authenticate = require('../middlewares/authenticate');
const logger = require('../middlewares/logger');
const validate = require('../middlewares/validate');
const {
  localLoginSchema,
  localSignupSchema,
  otpVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../utils/validators/authValidator');

router.get('/github', AuthController.githubAuth);
router.get('/github/callback', AuthController.githubCallback);
router.post('/login', validate(localLoginSchema), AuthController.localLogin);
router.post('/login/verify', validate(otpVerifySchema), AuthController.verifyLoginOtp);
router.post('/signup', validate(localSignupSchema), AuthController.localSignup);
router.post('/signup/verify', validate(otpVerifySchema), AuthController.verifySignupOtp);
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);
router.get('/demo-users', AuthController.demoUsers);
router.get('/me', authenticate, logger, AuthController.getMe);
router.post('/logout', authenticate, logger, AuthController.logout);

module.exports = router;
