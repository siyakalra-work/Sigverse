const mongoose = require('mongoose');

const moduleQuizSchema = new mongoose.Schema({
  module_id: { type: Number, required: true, unique: true },
  course_id: { type: Number, required: true },
  title: { type: String, default: 'Module Quiz' },
  questions: { type: Array, default: [] },
  created_by: { type: Number, default: null },
  updated_by: { type: Number, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('ModuleQuiz', moduleQuizSchema, 'module_quizzes');
