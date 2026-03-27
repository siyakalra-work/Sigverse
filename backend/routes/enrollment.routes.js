const router = require('express').Router();
const EnrollmentController = require('../controllers/EnrollmentController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const logger = require('../middlewares/logger');
const { enrollmentCreateSchema, enrollmentUpdateSchema, enrollmentPatchSchema } = require('../utils/validators/enrollmentValidator');

router.post('/', authenticate, validate(enrollmentCreateSchema), logger, EnrollmentController.create);
router.get('/', authenticate, logger, EnrollmentController.getAll);
router.get('/:id', authenticate, logger, EnrollmentController.getById);
router.put('/:id', authenticate, authorize('admin'), validate(enrollmentUpdateSchema), logger, EnrollmentController.update);
router.patch('/:id', authenticate, validate(enrollmentPatchSchema), logger, EnrollmentController.patch);
router.delete('/:id', authenticate, logger, EnrollmentController.remove);

module.exports = router;
