const ModuleQuiz = require('../models/mongo/ModuleQuiz');

class ModuleQuizService {
  static getByCourseId(courseId) {
    return ModuleQuiz.find({ course_id: courseId }).sort({ updated_at: -1 });
  }

  static getByModuleId(moduleId) {
    return ModuleQuiz.findOne({ module_id: moduleId });
  }

  static async upsert(moduleId, data) {
    const update = {
      $set: {
        course_id: data.course_id,
        title: data.title,
        questions: data.questions,
        updated_by: data.updated_by
      },
      $setOnInsert: {
        module_id: moduleId,
        created_by: data.created_by
      }
    };

    return ModuleQuiz.findOneAndUpdate(
      { module_id: moduleId },
      update,
      { new: true, upsert: true }
    );
  }

  static remove(moduleId) {
    return ModuleQuiz.findOneAndDelete({ module_id: moduleId });
  }
}

module.exports = ModuleQuizService;
