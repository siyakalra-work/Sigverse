const bcrypt = require('bcryptjs');
const EmailOtp = require('../models/mongo/EmailOtp');

const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES || '10', 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

class OtpService {
  static async issueOtp({ email, purpose, meta = {} }) {
    const normalizedEmail = email.trim().toLowerCase();
    const otpCode = generateOtpCode();
    const codeHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await EmailOtp.findOneAndUpdate(
      { email: normalizedEmail, purpose },
      { code_hash: codeHash, meta, attempts: 0, expires_at: expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { otpCode, expiresAt };
  }

  static async verifyOtp({ email, purpose, otp }) {
    const normalizedEmail = email.trim().toLowerCase();
    const record = await EmailOtp.findOne({ email: normalizedEmail, purpose });
    if (!record) {
      const err = new Error('OTP not found or expired');
      err.status = 404;
      throw err;
    }

    if (record.expires_at && record.expires_at.getTime() < Date.now()) {
      await EmailOtp.deleteOne({ _id: record._id });
      const err = new Error('OTP expired. Please request a new one.');
      err.status = 410;
      throw err;
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await EmailOtp.deleteOne({ _id: record._id });
      const err = new Error('Too many incorrect attempts. Please request a new OTP.');
      err.status = 429;
      throw err;
    }

    const matches = await bcrypt.compare(otp, record.code_hash);
    if (!matches) {
      record.attempts += 1;
      await record.save();
      const err = new Error('Invalid OTP');
      err.status = 401;
      throw err;
    }

    await EmailOtp.deleteOne({ _id: record._id });
    return record.meta || {};
  }
}

module.exports = OtpService;
