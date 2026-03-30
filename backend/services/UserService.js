const UserRepository = require('../repositories/UserRepository');
const LocalCredential = require('../models/mongo/LocalCredential');
const ActivityLog = require('../models/mongo/ActivityLog');
const AuthLog = require('../models/mongo/AuthLog');
const LearningEvent = require('../models/mongo/LearningEvent');
const EmailOtp = require('../models/mongo/EmailOtp');
const ApprovalRequest = require('../models/mongo/ApprovalRequest');

class UserService {
  static getAll() { return UserRepository.findAll(); }
  static getById(id) { return UserRepository.findById(id); }
  static create(data) { return UserRepository.create(data); }
  static update(id, data) { return UserRepository.update(id, data); }
  static patch(id, data) { return UserRepository.patch(id, data); }
  static async remove(id) {
    const user = await UserRepository.findById(id);
    if (!user) { const err = new Error('User not found'); err.status = 404; throw err; }

    // Clean up MongoDB data first
    await Promise.all([
      LocalCredential.deleteMany({ user_id: id }),
      ActivityLog.deleteMany({ user_id: id }),
      AuthLog.deleteMany({ user_id: id }),
      LearningEvent.deleteMany({ user_id: id }),
      EmailOtp.deleteMany({ user_id: id }),
      ApprovalRequest.deleteMany({ user_id: id })
    ]);

    // Then delete from MySQL (this will cascade delete related MySQL records)
    return UserRepository.delete(id);
  }
}

module.exports = UserService;
