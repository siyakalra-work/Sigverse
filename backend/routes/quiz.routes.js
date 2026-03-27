const router = require('express').Router();
const QuizController = require('../controllers/QuizController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const logger = require('../middlewares/logger');
const { quizUpsertSchema, quizSubmissionSchema } = require('../utils/validators/quizValidator');

router.get('/course/:courseId', authenticate, logger, QuizController.getCourseQuizzes);
router.post('/modules/:moduleId', authenticate, authorize('instructor', 'admin'), validate(quizUpsertSchema), logger, QuizController.upsertModuleQuiz);
router.delete('/modules/:moduleId', authenticate, authorize('instructor', 'admin'), logger, QuizController.removeModuleQuiz);

router.get('/course/:courseId/submissions', authenticate, logger, QuizController.getQuizSubmissions);
router.post('/modules/:moduleId/submissions', authenticate, authorize('learner'), validate(quizSubmissionSchema), logger, QuizController.submitQuiz);

module.exports = router;
