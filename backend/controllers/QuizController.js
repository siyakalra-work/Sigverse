const ModuleQuizService = require('../services/ModuleQuizService');
const ModuleService = require('../services/ModuleService');
const InstructorScopeService = require('../services/InstructorScopeService');
const EnrollmentRepository = require('../repositories/EnrollmentRepository');
const ActivityLog = require('../models/mongo/ActivityLog');
const { sendSuccess, sendError } = require('../utils/response');

exports.getCourseQuizzes = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);

    if (req.user.role === 'instructor') {
      await InstructorScopeService.assertCourseOwnership(req.user.sub, courseId);
    }

    if (req.user.role === 'learner') {
      const enrollment = await EnrollmentRepository.findByUserAndCourse(req.user.sub, courseId);
      if (!enrollment) return sendError(res, 403, 'You are not enrolled in this course');
    }

    const data = await ModuleQuizService.getByCourseId(courseId);
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

exports.upsertModuleQuiz = async (req, res, next) => {
  try {
    const moduleId = Number(req.params.moduleId);
    const moduleItem = await ModuleService.getById(moduleId);
    if (!moduleItem) return sendError(res, 404, 'Module not found');

    if (req.user.role === 'instructor') {
      await InstructorScopeService.assertModuleOwnership(req.user.sub, moduleId);
    }

    const payload = {
      course_id: moduleItem.course_id,
      title: req.body.title,
      questions: req.body.questions,
      created_by: req.user.sub,
      updated_by: req.user.sub
    };

    const data = await ModuleQuizService.upsert(moduleId, payload);
    sendSuccess(res, 200, data, 'Quiz saved');
  } catch (err) { next(err); }
};

exports.removeModuleQuiz = async (req, res, next) => {
  try {
    const moduleId = Number(req.params.moduleId);
    const moduleItem = await ModuleService.getById(moduleId);
    if (!moduleItem) return sendError(res, 404, 'Module not found');

    if (req.user.role === 'instructor') {
      await InstructorScopeService.assertModuleOwnership(req.user.sub, moduleId);
    }

    await ModuleQuizService.remove(moduleId);
    sendSuccess(res, 200, null, 'Quiz removed');
  } catch (err) { next(err); }
};

exports.submitQuiz = async (req, res, next) => {
  try {
    const moduleId = Number(req.params.moduleId);
    const moduleItem = await ModuleService.getById(moduleId);
    if (!moduleItem) return sendError(res, 404, 'Module not found');

    const courseId = Number(req.body.course_id);
    if (moduleItem.course_id !== courseId) {
      return sendError(res, 400, 'Module does not belong to the supplied course');
    }

    const enrollment = await EnrollmentRepository.findByUserAndCourse(req.user.sub, courseId);
    if (!enrollment) return sendError(res, 403, 'You are not enrolled in this course');

    const log = await ActivityLog.create({
      user_id: req.user.sub,
      action: 'quiz_submit',
      module: 'quiz',
      metadata: {
        course_id: courseId,
        module_id: moduleId,
        answers: req.body.answers || {},
        score: req.body.score,
        total: req.body.total
      },
      timestamp: new Date()
    });

    sendSuccess(res, 201, {
      id: log._id,
      user_id: req.user.sub,
      course_id: courseId,
      module_id: moduleId,
      answers: req.body.answers || {},
      score: req.body.score,
      total: req.body.total,
      submitted_at: log.timestamp
    }, 'Quiz submitted');
  } catch (err) { next(err); }
};

exports.getQuizSubmissions = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);

    if (req.user.role === 'instructor') {
      await InstructorScopeService.assertCourseOwnership(req.user.sub, courseId);
    }

    if (req.user.role === 'learner') {
      const enrollment = await EnrollmentRepository.findByUserAndCourse(req.user.sub, courseId);
      if (!enrollment) return sendError(res, 403, 'You are not enrolled in this course');
    }

    const filter = {
      action: 'quiz_submit',
      'metadata.course_id': courseId
    };

    if (req.user.role === 'learner') {
      filter.user_id = req.user.sub;
    }

    const logs = await ActivityLog.find(filter).sort({ timestamp: -1 });
    const latestByUserModule = new Map();

    logs.forEach((log) => {
      const moduleId = log.metadata?.module_id;
      const key = `${log.user_id}:${moduleId}`;
      if (!latestByUserModule.has(key)) {
        latestByUserModule.set(key, log);
      }
    });

    const data = Array.from(latestByUserModule.values()).map((log) => ({
      id: log._id,
      user_id: log.user_id,
      course_id: log.metadata?.course_id,
      module_id: log.metadata?.module_id,
      answers: log.metadata?.answers || {},
      score: log.metadata?.score ?? 0,
      total: log.metadata?.total ?? 0,
      submitted_at: log.timestamp
    }));

    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};
