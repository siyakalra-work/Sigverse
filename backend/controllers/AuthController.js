const passport = require('passport');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');
const LogService = require('../services/LogService');
const UserService = require('../services/UserService');
const AuthService = require('../services/AuthService');
const BootstrapService = require('../services/BootstrapService');

exports.githubAuth = passport.authenticate('github', { scope: ['user:email'] });

exports.githubCallback = (req, res, next) => {
  passport.authenticate('github', { session: false }, async (err, user) => {
    try {
      if (err || !user) {
        await LogService.logAuth({ user_id: null, provider: 'github', status: 'failure' });
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      }
      await LogService.logAuth({ user_id: user.id, provider: 'github', status: 'success' });
      const token = generateToken(user);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      next(error);
    }
  })(req, res, next);
};

exports.localLogin = async (req, res, next) => {
  try {
    const data = await AuthService.localLogin(req.body);
    await LogService.logAuth({ user_id: data.user.id, provider: 'local', status: 'success' });
    sendSuccess(res, 200, data, 'Logged in successfully');
  } catch (err) {
    await LogService.logAuth({ user_id: null, provider: 'local', status: 'failure' }).catch(() => {});
    next(err);
  }
};

exports.localSignup = async (req, res, next) => {
  try {
    const data = await AuthService.signup(req.body);
    sendSuccess(
      res,
      data.requiresApproval ? 202 : 201,
      data,
      data.message || 'OTP sent to your email'
    );
  } catch (err) { next(err); }
};

exports.verifyLoginOtp = async (req, res, next) => {
  try {
    const data = await AuthService.verifyLoginOtp(req.body);
    await LogService.logAuth({ user_id: data.user.id, provider: 'local', status: 'success' });
    sendSuccess(res, 200, data, 'Logged in successfully');
  } catch (err) {
    await LogService.logAuth({ user_id: null, provider: 'local', status: 'failure' }).catch(() => {});
    next(err);
  }
};

exports.verifySignupOtp = async (req, res, next) => {
  try {
    const data = await AuthService.verifySignupOtp(req.body);
    sendSuccess(
      res,
      data.requiresApproval ? 202 : 201,
      data,
      data.message || 'Account verified successfully'
    );
  } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const data = await AuthService.requestPasswordReset(req.body);
    sendSuccess(res, 200, data, 'Password reset OTP sent');
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    await AuthService.resetPassword(req.body);
    sendSuccess(res, 200, null, 'Password updated successfully');
  } catch (err) { next(err); }
};

exports.demoUsers = async (req, res, next) => {
  try {
    sendSuccess(res, 200, BootstrapService.getDemoAccounts());
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await UserService.getById(req.user.sub);
    if (!user) return sendError(res, 404, 'User not found');
    sendSuccess(res, 200, user);
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    await LogService.logActivity({
      user_id: req.user.sub,
      action: 'logout',
      module: 'auth',
      metadata: {},
      timestamp: new Date()
    });
    sendSuccess(res, 200, null, 'Logged out successfully');
  } catch (err) { next(err); }
};
