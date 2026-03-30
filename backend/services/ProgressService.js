const ProgressRepository = require('../repositories/ProgressRepository');
const CourseRepository = require('../repositories/CourseRepository');
const LessonRepository = require('../repositories/LessonRepository');
const EnrollmentRepository = require('../repositories/EnrollmentRepository');
const LearningEvent = require('../models/mongo/LearningEvent');

class ProgressService {
  static getAll() { return ProgressRepository.findAll(); }
  static getById(id) { return ProgressRepository.findById(id); }
  static getByUserId(userId) { return ProgressRepository.findByUserId(userId); }

  static create(data) { return ProgressRepository.create(data); }
  static update(id, data) { return ProgressRepository.update(id, data); }
  static patch(id, data) { return ProgressRepository.patch(id, data); }

  static async remove(id) {
    const progress = await ProgressRepository.findById(id);
    if (!progress) { const err = new Error('Progress not found'); err.status = 404; throw err; }
    return ProgressRepository.delete(id);
  }

  static async getLessonState(userId, courseId) {
    const completeEvents = await LearningEvent.find({
      user_id: userId,
      course_id: courseId,
      action: 'complete'
    }).sort({ timestamp: 1 });

    const completedLessonIds = [...new Set(completeEvents.map((event) => event.lesson_id))];
    return { completedLessonIds };
  }

  static async startLessonSession(userId, courseId, lessonId) {
    await LearningEvent.create({
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      action: 'start',
      timestamp: new Date()
    });

    return { started: true };
  }

  static async completeLesson(userId, courseId, lessonId) {
    const lesson = await LessonRepository.findById(lessonId);
    if (!lesson) {
      const err = new Error('Lesson not found');
      err.status = 404;
      throw err;
    }

    const latestStart = await LearningEvent.findOne({
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      action: 'start'
    }).sort({ timestamp: -1 });

    if (!latestStart) {
      const err = new Error('Please spend more time in the lesson before marking it complete');
      err.status = 429;
      throw err;
    }

    const minimumReadSeconds = this.calculateMinimumReadSeconds(lesson.content || '');
    const elapsedSeconds = (Date.now() - new Date(latestStart.timestamp).getTime()) / 1000;

    if (elapsedSeconds < minimumReadSeconds) {
      const err = new Error('Please spend more time in the lesson before marking it complete');
      err.status = 429;
      throw err;
    }

    await LearningEvent.create({
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      action: 'complete',
      timestamp: new Date()
    });

    const course = await CourseRepository.findByIdWithModules(courseId);
    if (!course) {
      const err = new Error('Course not found');
      err.status = 404;
      throw err;
    }

    const totalLessons = course.modules?.reduce((sum, moduleItem) => sum + (moduleItem.lessons?.length || 0), 0) || 1;
    const { completedLessonIds } = await this.getLessonState(userId, courseId);
    const completionPercentage = Math.min(100, Math.round((completedLessonIds.length / totalLessons) * 100));

    let progress = await ProgressRepository.findByUserAndCourse(userId, courseId);
    if (!progress) {
      progress = await ProgressRepository.create({
        user_id: userId,
        course_id: courseId,
        completion_percentage: completionPercentage
      });
    } else {
      progress = await ProgressRepository.patch(progress.id, {
        completion_percentage: completionPercentage
      });
    }

    const enrollment = await EnrollmentRepository.findByUserAndCourse(userId, courseId);
    if (enrollment) {
      await EnrollmentRepository.patch(enrollment.id, {
        status: completionPercentage >= 100 ? 'completed' : 'active'
      });
    }

    return {
      progress,
      completedLessonIds
    };
  }

  static calculateMinimumReadSeconds(content) {
    const words = String(content || '').trim().split(/\s+/).filter(Boolean).length;
    const derivedSeconds = Math.ceil(words / 3.2);
    return Math.max(1, Math.min(1, derivedSeconds));
  }
}

module.exports = ProgressService;
