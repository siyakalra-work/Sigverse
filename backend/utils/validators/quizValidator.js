const Joi = require('joi');

const quizQuestionSchema = Joi.object({
  id: Joi.string().required(),
  prompt: Joi.string().min(3).required(),
  options: Joi.array().items(Joi.string().min(1)).min(2).required(),
  answer: Joi.string().min(1).required()
});

exports.quizUpsertSchema = Joi.object({
  title: Joi.string().min(2).required(),
  questions: Joi.array().items(quizQuestionSchema).min(1).required()
});

exports.quizSubmissionSchema = Joi.object({
  course_id: Joi.number().required(),
  answers: Joi.object().pattern(Joi.string(), Joi.string()).required(),
  score: Joi.number().min(0).required(),
  total: Joi.number().min(0).required()
});
