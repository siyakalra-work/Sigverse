// const ApprovalRequest = require('../models/mongo/ApprovalRequest');
// const LocalCredential = require('../models/mongo/LocalCredential');
// const UserRepository = require('../repositories/UserRepository');
// const CourseService = require('./CourseService');
// const ModuleService = require('./ModuleService');
// const LessonService = require('./LessonService');

// class ApprovalService {
//   static async listForUser(user) {
//     if (user.role === 'admin') {
//       return ApprovalRequest.find({}).sort({ created_at: -1 });
//     }

//     return ApprovalRequest.find({ requester_id: user.sub }).sort({ created_at: -1 });
//   }

//   static createRequest(data) {
//     return ApprovalRequest.create(data);
//   }

//   static async approve(id, reviewerId) {
//     const request = await ApprovalRequest.findById(id);
//     if (!request) {
//       const err = new Error('Approval request not found');
//       err.status = 404;
//       throw err;
//     }

//     if (request.status !== 'pending') {
//       const err = new Error('This request has already been reviewed');
//       err.status = 409;
//       throw err;
//     }

//     let result = null;

//     switch (request.request_type) {
//       case 'instructor_signup': {
//         const credential = await LocalCredential.findById(request.entity_id);
//         if (!credential) {
//           const err = new Error('Pending instructor credential not found');
//           err.status = 404;
//           throw err;
//         }

//         let user = await UserRepository.findByEmail(credential.email);
//         if (!user) {
//           user = await UserRepository.create({
//             name: credential.name,
//             email: credential.email,
//             role: 'instructor'
//           });
//         } else if (user.role !== 'instructor') {
//           user = await UserRepository.patch(user.id, { role: 'instructor' });
//         }

//         credential.user_id = user.id;
//         credential.status = 'active';
//         credential.requested_role = 'instructor';
//         await credential.save();
//         result = user;
//         break;
//       }
//       case 'course':
//         result = await this.applyResourceRequest(CourseService, request);
//         break;
//       case 'module':
//         result = await this.applyResourceRequest(ModuleService, request);
//         break;
//       case 'lesson':
//         result = await this.applyResourceRequest(LessonService, request);
//         break;
//       default: {
//         const err = new Error('Unsupported approval request type');
//         err.status = 400;
//         throw err;
//       }
//     }

//     request.status = 'approved';
//     request.reviewer_id = reviewerId;
//     request.reviewed_at = new Date();
//     await request.save();

//     return { request, result };
//   }

//   static async reject(id, reviewerId, note = '') {
//     const request = await ApprovalRequest.findById(id);
//     if (!request) {
//       const err = new Error('Approval request not found');
//       err.status = 404;
//       throw err;
//     }

//     if (request.status !== 'pending') {
//       const err = new Error('This request has already been reviewed');
//       err.status = 409;
//       throw err;
//     }

//     request.status = 'rejected';
//     request.reviewer_id = reviewerId;
//     request.note = note;
//     request.reviewed_at = new Date();
//     await request.save();

//     if (request.request_type === 'instructor_signup') {
//       const credential = await LocalCredential.findById(request.entity_id);
//       if (credential) {
//         credential.status = 'disabled';
//         await credential.save();
//       }
//     }

//     return request;
//   }

//   static async applyResourceRequest(service, request) {
//     if (request.action === 'create') {
//       return service.create(request.payload);
//     }

//     if (request.action === 'update') {
//       return service.patch(request.entity_id, request.payload);
//     }

//     if (request.action === 'delete') {
//       await service.remove(request.entity_id);
//       return true;
//     }

//     const err = new Error('Unsupported approval request action');
//     err.status = 400;
//     throw err;
//   }
// }

// module.exports = ApprovalService;



const ApprovalRequest = require('../models/mongo/ApprovalRequest');
const LocalCredential = require('../models/mongo/LocalCredential');
const UserRepository = require('../repositories/UserRepository');
const CourseService = require('./CourseService');
const ModuleService = require('./ModuleService');
const LessonService = require('./LessonService');
const EmailService = require('./EmailService');

class ApprovalService {
  static async listForUser(user) {
    if (user.role === 'admin') {
      return ApprovalRequest.find({}).sort({ created_at: -1 });
    }

    return ApprovalRequest.find({ requester_id: user.sub }).sort({ created_at: -1 });
  }

  static createRequest(data) {
    return ApprovalRequest.create(data);
  }

  static async approve(id, reviewerId) {
    const request = await ApprovalRequest.findById(id);
    if (!request) {
      const err = new Error('Approval request not found');
      err.status = 404;
      throw err;
    }

    if (request.status !== 'pending') {
      const err = new Error('This request has already been reviewed');
      err.status = 409;
      throw err;
    }

    let result = null;

    switch (request.request_type) {
      case 'instructor_signup': {
        const credential = await LocalCredential.findById(request.entity_id);
        if (!credential) {
          const err = new Error('Pending instructor credential not found');
          err.status = 404;
          throw err;
        }

        let user = await UserRepository.findByEmail(credential.email);
        if (!user) {
          user = await UserRepository.create({
            name: credential.name,
            email: credential.email,
            role: 'instructor'
          });
        } else if (user.role !== 'instructor') {
          user = await UserRepository.patch(user.id, { role: 'instructor' });
        }

        credential.user_id = user.id;
        credential.status = 'active';
        credential.requested_role = 'instructor';
        await credential.save();
        result = user;

        // Send approval confirmation email to the new instructor
        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
        await EmailService.sendEmail({
          to: credential.email,
          subject: '🎉 Welcome to Sigverse — Instructor Account Approved!',
          text: `Congratulations ${credential.name}!\n\nYour instructor account on Sigverse has been approved by our admin team. You now have full access to create courses, modules, and lessons on the platform.\n\nLog in here: ${loginUrl}\n\nWelcome aboard!\n— The Sigverse Team`,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f0f1a; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.25);">
              <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%); padding: 36px 32px 28px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Instructor Account Approved!</h1>
              </div>
              <div style="padding: 32px; color: #d1d5db; line-height: 1.7; font-size: 15px;">
                <p style="margin: 0 0 16px;">Hello <strong style="color: #ffffff;">${credential.name}</strong>,</p>
                <p style="margin: 0 0 16px;">Great news! Our admin team has reviewed and <strong style="color: #a78bfa;">approved</strong> your instructor application on <strong style="color: #ffffff;">Sigverse</strong>.</p>
                <p style="margin: 0 0 20px;">You now have full access to:</p>
                <ul style="margin: 0 0 24px; padding-left: 20px; color: #c4b5fd;">
                  <li style="margin-bottom: 6px;">Create and manage courses</li>
                  <li style="margin-bottom: 6px;">Add modules and lessons</li>
                  <li style="margin-bottom: 6px;">Track learner enrollments &amp; progress</li>
                </ul>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">Log In to Sigverse</a>
                </div>
                <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">Welcome aboard — we're excited to have you! 🚀</p>
              </div>
              <div style="padding: 16px 32px; background: rgba(139, 92, 246, 0.08); text-align: center; font-size: 12px; color: #6b7280;">
                &copy; Sigverse Learning Platform
              </div>
            </div>
          `
        }).catch((emailErr) => console.error('[ApprovalService] Failed to send approval email:', emailErr.message));

        break;
      }
      case 'course':
        result = await this.applyResourceRequest(CourseService, request);
        break;
      case 'module':
        result = await this.applyResourceRequest(ModuleService, request);
        break;
      case 'lesson':
        result = await this.applyResourceRequest(LessonService, request);
        break;
      default: {
        const err = new Error('Unsupported approval request type');
        err.status = 400;
        throw err;
      }
    }

    request.status = 'approved';
    request.reviewer_id = reviewerId;
    request.reviewed_at = new Date();
    await request.save();

    return { request, result };
  }

  static async reject(id, reviewerId, note = '') {
    const request = await ApprovalRequest.findById(id);
    if (!request) {
      const err = new Error('Approval request not found');
      err.status = 404;
      throw err;
    }

    if (request.status !== 'pending') {
      const err = new Error('This request has already been reviewed');
      err.status = 409;
      throw err;
    }

    request.status = 'rejected';
    request.reviewer_id = reviewerId;
    request.note = note;
    request.reviewed_at = new Date();
    await request.save();

    if (request.request_type === 'instructor_signup') {
      const credential = await LocalCredential.findById(request.entity_id);
      if (credential) {
        credential.status = 'disabled';
        await credential.save();

        // Send rejection notification email
        const noteText = note ? `\n\nAdmin note: ${note}` : '';
        await EmailService.sendEmail({
          to: credential.email,
          subject: 'Sigverse — Instructor Application Update',
          text: `Hello ${credential.name},\n\nThank you for your interest in becoming an instructor on Sigverse. After review, your application was not approved at this time.${noteText}\n\nYou can still use the platform as a learner. If you believe this was a mistake, feel free to reach out to our support team.\n\n— The Sigverse Team`,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f0f1a; border-radius: 16px; overflow: hidden; border: 1px solid rgba(239, 68, 68, 0.25);">
              <div style="background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%); padding: 36px 32px 28px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 8px;">📋</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Application Update</h1>
              </div>
              <div style="padding: 32px; color: #d1d5db; line-height: 1.7; font-size: 15px;">
                <p style="margin: 0 0 16px;">Hello <strong style="color: #ffffff;">${credential.name}</strong>,</p>
                <p style="margin: 0 0 16px;">Thank you for your interest in becoming an instructor on <strong style="color: #ffffff;">Sigverse</strong>. After careful review, your application was <strong style="color: #fca5a5;">not approved</strong> at this time.</p>
                ${note ? `<div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0;"><p style="margin: 0; font-size: 14px; color: #fca5a5;"><strong>Admin note:</strong> ${note}</p></div>` : ''}
                <p style="margin: 16px 0 0;">You can still enjoy Sigverse as a learner. If you believe this was an error, you are welcome to reapply or contact our support team.</p>
              </div>
              <div style="padding: 16px 32px; background: rgba(239, 68, 68, 0.08); text-align: center; font-size: 12px; color: #6b7280;">
                &copy; Sigverse Learning Platform
              </div>
            </div>
          `
        }).catch((emailErr) => console.error('[ApprovalService] Failed to send rejection email:', emailErr.message));
      }
    }

    return request;
  }

  static async applyResourceRequest(service, request) {
    if (request.action === 'create') {
      return service.create(request.payload);
    }

    if (request.action === 'update') {
      return service.patch(request.entity_id, request.payload);
    }

    if (request.action === 'delete') {
      await service.remove(request.entity_id);
      return true;
    }

    const err = new Error('Unsupported approval request action');
    err.status = 400;
    throw err;
  }
}

module.exports = ApprovalService;