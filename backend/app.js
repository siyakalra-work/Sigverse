require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');

require('./config/passport');
require('./config/db.mysql');

const rateLimiter = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const courseRoutes = require('./routes/course.routes');
const moduleRoutes = require('./routes/module.routes');
const lessonRoutes = require('./routes/lesson.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const progressRoutes = require('./routes/progress.routes');
const performanceRoutes = require('./routes/performance.routes');
const approvalRoutes = require('./routes/approval.routes');
const quizRoutes = require('./routes/quiz.routes');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(passport.initialize());
app.use(rateLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/courses', courseRoutes);
app.use('/modules', moduleRoutes);
app.use('/lessons', lessonRoutes);
app.use('/enrollments', enrollmentRoutes);
app.use('/progress', progressRoutes);
app.use('/performance', performanceRoutes);
app.use('/approvals', approvalRoutes);
app.use('/quizzes', quizRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

// Centralized error handler — MUST be last
app.use(errorHandler);

module.exports = app;
