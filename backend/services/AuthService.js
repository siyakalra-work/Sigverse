const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const UserRepository = require('../repositories/UserRepository');
const LocalCredential = require('../models/mongo/LocalCredential');
const ApprovalRequest = require('../models/mongo/ApprovalRequest');
const OtpService = require('./OtpService');
const EmailService = require('./EmailService');

class AuthService {
  static async localLogin({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const credential = await LocalCredential.findOne({ email: normalizedEmail });

    if (!credential) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    if (credential.status === 'pending') {
      const err = new Error('Your account is pending admin approval');
      err.status = 403;
      throw err;
    }

    if (credential.status !== 'active' || !credential.user_id) {
      const err = new Error('This account is not active');
      err.status = 403;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, credential.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const user = await UserRepository.findById(credential.user_id);
    if (!user) {
      const err = new Error('Linked user account not found');
      err.status = 404;
      throw err;
    }

    return {
      user,
      token: generateToken(user)
    };
  }

  static async signup({ name, email, password, role = 'learner' }) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await UserRepository.findByEmail(normalizedEmail);
    const existingCredential = await LocalCredential.findOne({ email: normalizedEmail });

    if (existingUser || existingCredential) {
      const err = new Error('An account with this email already exists');
      err.status = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { otpCode, expiresAt } = await OtpService.issueOtp({
      email: normalizedEmail,
      purpose: 'signup',
      meta: {
        name,
        email: normalizedEmail,
        password_hash: passwordHash,
        role
      }
    });
    await EmailService.sendOtpEmail(normalizedEmail, otpCode, 'signup');

    return {
      otpRequired: true,
      expiresAt
    };
  }

  static async verifySignupOtp({ email, otp }) {
    const meta = await OtpService.verifyOtp({ email, purpose: 'signup', otp });
    const normalizedEmail = meta.email || email.trim().toLowerCase();
    const existingUser = await UserRepository.findByEmail(normalizedEmail);
    const existingCredential = await LocalCredential.findOne({ email: normalizedEmail });

    if (existingUser || existingCredential) {
      const err = new Error('An account with this email already exists');
      err.status = 409;
      throw err;
    }

    if (meta.role === 'instructor') {
      const credential = await LocalCredential.create({
        name: meta.name,
        email: normalizedEmail,
        password_hash: meta.password_hash,
        status: 'pending',
        requested_role: 'instructor'
      });

      await ApprovalRequest.create({
        requester_id: null,
        request_type: 'instructor_signup',
        action: 'create',
        entity_id: credential._id.toString(),
        payload: {
          credential_id: credential._id.toString(),
          name: meta.name,
          email: normalizedEmail
        }
      });

      return {
        requiresApproval: true,
        message: 'Instructor signup request submitted for admin approval'
      };
    }

    const user = await UserRepository.create({
      name: meta.name,
      email: normalizedEmail,
      role: 'learner'
    });

    await LocalCredential.create({
      user_id: user.id,
      name: meta.name,
      email: normalizedEmail,
      password_hash: meta.password_hash,
      status: 'active',
      requested_role: 'learner'
    });

    return {
      requiresApproval: false,
      user,
      token: generateToken(user)
    };
  }

  static async verifyLoginOtp({ email, otp }) {
    const meta = await OtpService.verifyOtp({ email, purpose: 'login', otp });
    const credential = await LocalCredential.findOne({ email: email.trim().toLowerCase() });
    if (!credential) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    if (credential.status === 'pending') {
      const err = new Error('Your account is pending admin approval');
      err.status = 403;
      throw err;
    }

    if (credential.status !== 'active' || !credential.user_id) {
      const err = new Error('This account is not active');
      err.status = 403;
      throw err;
    }

    const user = await UserRepository.findById(meta.user_id || credential.user_id);
    if (!user) {
      const err = new Error('Linked user account not found');
      err.status = 404;
      throw err;
    }

    return {
      user,
      token: generateToken(user)
    };
  }

  static async requestPasswordReset({ email }) {
    const normalizedEmail = email.trim().toLowerCase();
    const credential = await LocalCredential.findOne({ email: normalizedEmail });
    if (!credential) {
      const err = new Error('No account found with that email');
      err.status = 404;
      throw err;
    }

    const { otpCode, expiresAt } = await OtpService.issueOtp({
      email: normalizedEmail,
      purpose: 'reset',
      meta: { credential_id: credential._id.toString(), user_id: credential.user_id }
    });
    await EmailService.sendOtpEmail(normalizedEmail, otpCode, 'reset');

    return {
      otpRequired: true,
      expiresAt
    };
  }

  static async resetPassword({ email, otp, newPassword }) {
    const meta = await OtpService.verifyOtp({ email, purpose: 'reset', otp });
    const normalizedEmail = email.trim().toLowerCase();
    const credential = await LocalCredential.findOne({ email: normalizedEmail });
    if (!credential) {
      const err = new Error('No account found with that email');
      err.status = 404;
      throw err;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    credential.password_hash = passwordHash;
    await credential.save();

    return { success: true };
  }
}

module.exports = AuthService;
