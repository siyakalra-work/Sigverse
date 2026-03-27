const EnrollmentService = require('../services/EnrollmentService');
const CourseService = require('../services/CourseService');
const UserService = require('../services/UserService');
const { sendSuccess, sendError } = require('../utils/response');

exports.create = async (req, res, next) => {
  try {
    if (req.user.role === 'instructor') return sendError(res, 403, 'Instructors cannot enroll in courses');
    if (req.user.role !== 'admin' && req.body.user_id !== req.user.sub) {
      return sendError(res, 403, 'You can only enroll your own learner account');
    }

    const targetUser = await UserService.getById(req.body.user_id);
    if (!targetUser || targetUser.role !== 'learner') {
      return sendError(res, 403, 'Only learners can be enrolled in courses');
    }

    const data = await EnrollmentService.create(req.body);
    sendSuccess(res, 201, data, 'Enrollment created');
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      const data = await EnrollmentService.getAll();
      return sendSuccess(res, 200, data);
    }

    if (req.user.role === 'learner') {
      const data = await EnrollmentService.getByUserId(req.user.sub);
      return sendSuccess(res, 200, data);
    }

    if (req.user.role === 'instructor') {
      const courses = await CourseService.getAll();
      const courseIds = courses
        .filter((course) => course.instructor_id === req.user.sub)
        .map((course) => course.id);
      const allEnrollments = await EnrollmentService.getAll();
      const data = allEnrollments.filter((enrollment) => courseIds.includes(enrollment.course_id));
      return sendSuccess(res, 200, data);
    }

    return sendSuccess(res, 200, []);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await EnrollmentService.getById(req.params.id);
    if (!data) return sendError(res, 404, 'Enrollment not found');
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const data = await EnrollmentService.update(req.params.id, req.body);
    sendSuccess(res, 200, data, 'Enrollment updated');
  } catch (err) { next(err); }
};

exports.patch = async (req, res, next) => {
  try {
    const data = await EnrollmentService.patch(req.params.id, req.body);
    sendSuccess(res, 200, data, 'Enrollment updated');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const enrollment = await EnrollmentService.getById(req.params.id);
    if (!enrollment) return sendError(res, 404, 'Enrollment not found');

    if (req.user.role === 'instructor') {
      return sendError(res, 403, 'Instructors cannot remove enrollments');
    }

    if (req.user.role === 'learner' && enrollment.user_id !== req.user.sub) {
      return sendError(res, 403, 'You can only leave your own courses');
    }

    if (enrollment.status === 'completed') {
      return sendError(res, 400, 'Completed courses cannot be left');
    }

    await EnrollmentService.remove(req.params.id);
    sendSuccess(res, 200, null, 'Enrollment deleted');
  } catch (err) { next(err); }
};
