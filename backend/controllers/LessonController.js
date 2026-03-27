const LessonService = require('../services/LessonService');
const InstructorScopeService = require('../services/InstructorScopeService');
const { sendSuccess, sendError } = require('../utils/response');

exports.create = async (req, res, next) => {
  try {
    if (req.user.role === 'instructor') {
      await InstructorScopeService.assertModuleOwnership(req.user.sub, Number(req.body.module_id));
      const data = await LessonService.create(req.body);
      return sendSuccess(res, 201, data, 'Lesson created');
    }

    const data = await LessonService.create(req.body);
    sendSuccess(res, 201, data, 'Lesson created');
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const data = await LessonService.getAll();
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await LessonService.getById(req.params.id);
    if (!data) return sendError(res, 404, 'Lesson not found');
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (req.user.role === 'instructor') {
      await InstructorScopeService.assertLessonOwnership(req.user.sub, Number(req.params.id));
      const data = await LessonService.update(req.params.id, req.body);
      return sendSuccess(res, 200, data, 'Lesson updated');
    }

    const data = await LessonService.update(req.params.id, req.body);
    sendSuccess(res, 200, data, 'Lesson updated');
  } catch (err) { next(err); }
};

exports.patch = async (req, res, next) => {
  try {
    if (req.user.role === 'instructor') {
      await InstructorScopeService.assertLessonOwnership(req.user.sub, Number(req.params.id));
      const data = await LessonService.patch(req.params.id, req.body);
      return sendSuccess(res, 200, data, 'Lesson updated');
    }

    const data = await LessonService.patch(req.params.id, req.body);
    sendSuccess(res, 200, data, 'Lesson updated');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    if (req.user.role === 'instructor') {
      await InstructorScopeService.assertLessonOwnership(req.user.sub, Number(req.params.id));
      await LessonService.remove(req.params.id);
      return sendSuccess(res, 200, null, 'Lesson deleted');
    }

    await LessonService.remove(req.params.id);
    sendSuccess(res, 200, null, 'Lesson deleted');
  } catch (err) { next(err); }
};
