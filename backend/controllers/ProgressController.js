const ProgressService = require('../services/ProgressService');
const CourseService = require('../services/CourseService');
const UserService = require('../services/UserService');
const { sendSuccess, sendError } = require('../utils/response');

exports.create = async (req, res, next) => {
  try {
    if (req.user.role === 'instructor') return sendError(res, 403, 'Instructors cannot create learner progress');
    if (req.user.role !== 'admin' && req.body.user_id !== req.user.sub) {
      return sendError(res, 403, 'You can only create your own progress');
    }

    const targetUser = await UserService.getById(req.body.user_id);
    if (!targetUser || targetUser.role !== 'learner') {
      return sendError(res, 403, 'Progress can only be created for learners');
    }

    const data = await ProgressService.create(req.body);
    sendSuccess(res, 201, data, 'Progress created');
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      const data = await ProgressService.getAll();
      return sendSuccess(res, 200, data);
    }

    if (req.user.role === 'learner') {
      const data = await ProgressService.getByUserId(req.user.sub);
      return sendSuccess(res, 200, data);
    }

    if (req.user.role === 'instructor') {
      const courses = await CourseService.getAll();
      const courseIds = courses
        .filter((course) => course.instructor_id === req.user.sub)
        .map((course) => course.id);
      const allProgress = await ProgressService.getAll();
      const data = allProgress.filter((progress) => courseIds.includes(progress.course_id));
      return sendSuccess(res, 200, data);
    }

    return sendSuccess(res, 200, []);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await ProgressService.getById(req.params.id);
    if (!data) return sendError(res, 404, 'Progress not found');
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (req.user.role === 'instructor') return sendError(res, 403, 'Instructors cannot update learner progress');
    const data = await ProgressService.update(req.params.id, req.body);
    sendSuccess(res, 200, data, 'Progress updated');
  } catch (err) { next(err); }
};

exports.patch = async (req, res, next) => {
  try {
    if (req.user.role === 'instructor') return sendError(res, 403, 'Instructors cannot update learner progress');
    const data = await ProgressService.patch(req.params.id, req.body);
    sendSuccess(res, 200, data, 'Progress updated');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await ProgressService.remove(req.params.id);
    sendSuccess(res, 200, null, 'Progress deleted');
  } catch (err) { next(err); }
};

exports.getLessonState = async (req, res, next) => {
  try {
    const data = await ProgressService.getLessonState(req.user.sub, Number(req.params.courseId));
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

exports.startLessonSession = async (req, res, next) => {
  try {
    if (req.user.role !== 'learner') return sendError(res, 403, 'Only learners can start lesson sessions');
    const data = await ProgressService.startLessonSession(
      req.user.sub,
      Number(req.body.course_id),
      Number(req.params.lessonId)
    );
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

exports.completeLesson = async (req, res, next) => {
  try {
    if (req.user.role !== 'learner') return sendError(res, 403, 'Only learners can complete lessons');
    const data = await ProgressService.completeLesson(
      req.user.sub,
      Number(req.body.course_id),
      Number(req.params.lessonId)
    );
    sendSuccess(res, 200, data, 'Lesson completed');
  } catch (err) { next(err); }
};
