import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { getCourseById } from '../services/courseService';
import { completeLessonSession, getAllProgress, getLessonState, startLessonSession } from '../services/progressService';
import { buildSampleQuiz, getRecommendedVideos } from '../utils/courseMeta';
import { downloadCertificatePdf, downloadModulePdf } from '../utils/pdf';
import { getCourseQuizzes, getQuizSubmissions, submitModuleQuiz } from '../services/quizService';
import ProgressBar from '../components/ProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';
import Icon from '../components/Icon';

export default function LearningView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonAlert, setLessonAlert] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [moduleQuizzes, setModuleQuizzes] = useState({});
  const [quizSubmissions, setQuizSubmissions] = useState({});
  const topRef = useRef(null);
  const quizRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [courseRes, progressRes, lessonStateRes, quizRes, quizSubRes] = await Promise.all([
          getCourseById(courseId),
          getAllProgress(),
          getLessonState(courseId),
          getCourseQuizzes(courseId).catch(() => ({ data: { data: [] } })),
          getQuizSubmissions(courseId).catch(() => ({ data: { data: [] } }))
        ]);

        const courseData = courseRes.data.data;
        setCourse(courseData);
        setActiveLesson(courseData?.modules?.[0]?.lessons?.[0] || null);

        const myProgress = (progressRes.data.data || []).find(
          (item) => item.user_id === user?.id && item.course_id === parseInt(courseId, 10)
        );
        setProgress(myProgress || null);
        setCompletedLessons(new Set(lessonStateRes.data.data?.completedLessonIds || []));
        const quizMap = {};
        (quizRes.data.data || []).forEach((quiz) => {
          quizMap[quiz.module_id] = quiz;
        });
        setModuleQuizzes(quizMap);

        const submissionMap = {};
        (quizSubRes.data.data || []).forEach((submission) => {
          submissionMap[submission.module_id] = submission;
        });
        setQuizSubmissions(submissionMap);
      } catch {} finally { setLoading(false); }
    };

    fetchData();
  }, [courseId, user]);

  useEffect(() => {
    if (!activeLesson || user?.role !== 'learner') return;

    startLessonSession(activeLesson.id, Number(courseId)).catch(() => {});
  }, [activeLesson, courseId, user]);

  const activeModule = course?.modules?.find((moduleItem) =>
    moduleItem.lessons?.some((lesson) => lesson.id === activeLesson?.id)
  );

  const lessonSections = activeLesson?.content
    ? activeLesson.content.split('\n\n').filter(Boolean)
    : [];
  const recommendedVideos = getRecommendedVideos(course, activeModule);
  const moduleQuizData = moduleQuizzes[activeModule?.id];
  const fallbackQuiz = buildSampleQuiz(activeModule);
  const resolvedQuizData = moduleQuizData?.questions?.length ? moduleQuizData : fallbackQuiz;
  const moduleQuiz = resolvedQuizData?.questions || [];
  const moduleQuizTitle = resolvedQuizData?.title || 'Module Quiz';
  const isModuleComplete = activeModule?.lessons?.every((lesson) => completedLessons.has(lesson.id));
  const flattenedLessons = course?.modules?.flatMap((moduleItem) =>
    (moduleItem.lessons || []).map((lesson) => ({
      ...lesson,
      module_id: moduleItem.id,
      module_name: moduleItem.module_name
    }))
  ) || [];
  const activeIndex = flattenedLessons.findIndex((lesson) => lesson.id === activeLesson?.id);
  const nextLesson = activeIndex >= 0 ? flattenedLessons[activeIndex + 1] : null;
  const lastLessonId = activeModule?.lessons?.length
    ? activeModule.lessons[activeModule.lessons.length - 1].id
    : null;
  const isLastLessonInModule = lastLessonId === activeLesson?.id;
  const quizAvailable = Boolean(isModuleComplete && isLastLessonInModule && moduleQuiz.length);
  const quizPending = quizAvailable && !quizResult;
  const isLessonComplete = Boolean(activeLesson && completedLessons.has(activeLesson.id));
  const requiresCompletionToAdvance = Boolean(nextLesson || quizAvailable);
  const disableAdvance = requiresCompletionToAdvance && !isLessonComplete;
  const courseCompleteByLessons = course?.modules?.every((moduleItem) =>
    moduleItem.lessons?.every((lesson) => completedLessons.has(lesson.id))
  );
  const completionPercentage = progress?.completion_percentage || 0;
  const canDownloadCertificate = completionPercentage >= 100 || Boolean(courseCompleteByLessons);

  useEffect(() => {
    const submission = quizSubmissions[activeModule?.id];
    if (submission) {
      setQuizAnswers(submission.answers || {});
      setQuizResult({ score: submission.score, total: submission.total });
    } else {
      setQuizAnswers({});
      setQuizResult(null);
    }
  }, [activeModule?.id, quizSubmissions]);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToQuiz = () => {
    quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!activeLesson) return;
    scrollToTop();
  }, [activeLesson?.id]);

  const handleLessonSelect = (lesson) => {
    if (quizPending) {
      const targetIndex = flattenedLessons.findIndex((item) => item.id === lesson.id);
      if (targetIndex > activeIndex) {
        setLessonAlert({
          title: 'Finish the module quiz first',
          message: 'Complete the module quiz to unlock the next lesson.'
        });
        return;
      }
    }

    setActiveLesson(lesson);
  };

  const handleMarkComplete = async () => {
    try {
      const res = await completeLessonSession(activeLesson.id, Number(courseId));
      setProgress(res.data.data.progress);
      setCompletedLessons(new Set(res.data.data.completedLessonIds || []));
      showToast('Lesson marked complete.', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Please spend more time in the lesson before marking it complete.';
      setLessonAlert({
        title: 'Keep learning to unlock completion',
        message: errorMessage
      });
    }
  };

  const handleQuizSubmit = async (event) => {
    event.preventDefault();
    if (!activeModule) return;
    const score = moduleQuiz.reduce((sum, question) => sum + (quizAnswers[question.id] === question.answer ? 1 : 0), 0);
    const payload = {
      course_id: Number(courseId),
      answers: quizAnswers,
      score,
      total: moduleQuiz.length
    };

    try {
      await submitModuleQuiz(activeModule.id, payload);
      setQuizResult({ score, total: moduleQuiz.length });
      setQuizSubmissions((current) => ({
        ...current,
        [activeModule.id]: {
          module_id: activeModule.id,
          course_id: Number(courseId),
          ...payload
        }
      }));
      showToast('Quiz submitted. Review the correct answers below.', 'success');
      setTimeout(() => {
        navRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    } catch {
      showToast('Unable to submit quiz. Please try again.', 'error');
    }
  };

  const handleCertificateDownload = () => {
    if (!course || !user) return;
    downloadCertificatePdf({
      learnerName: user.name || 'Learner',
      courseTitle: course.title,
      completedDate: new Date().toLocaleDateString()
    });
  };

  if (loading) return <LoadingSpinner />;
  if (!course) return <div className="page-container"><p>Course not found</p></div>;

  return (
    <div className="learning-layout">
      <div className="learning-sidebar">
        <h2 className="sidebar-title">{course.title}</h2>
        <ProgressBar percentage={progress?.completion_percentage || 0} />
        <div className="module-tree">
          {course.modules?.map((moduleItem) => (
            <div key={moduleItem.id} className="tree-module">
              <h4 className="tree-module-name">{moduleItem.module_name}</h4>
              {moduleItem.lessons?.map((lesson) => (
                <div
                  key={lesson.id}
                  className={`tree-lesson ${activeLesson?.id === lesson.id ? 'active' : ''} ${completedLessons.has(lesson.id) ? 'completed' : ''}`}
                  onClick={() => handleLessonSelect(lesson)}
                >
                  <span className="tree-lesson-icon">
                    <Icon name={completedLessons.has(lesson.id) ? 'check' : 'document'} size={14} />
                  </span>
                  {lesson.lesson_name}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="learning-content">
        <div ref={topRef}></div>
        {activeLesson ? (
          <>
            <div className="learning-content-head">
              <div>
                <span className="section-eyebrow">{activeModule?.module_name || 'Lesson in focus'}</span>
                <h2 className="content-title">{activeLesson.lesson_name}</h2>
              </div>
              <span className="lesson-progress-chip">Course progress {progress?.completion_percentage || 0}%</span>
            </div>

            <div className="learning-toolbar">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadModulePdf(course, activeModule)}>
                <Icon name="download" size={14} />
                <span>Download Module PDF</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleCertificateDownload}
                disabled={!canDownloadCertificate}
                title={canDownloadCertificate ? 'Download certificate' : 'Complete the course to unlock certificate'}
              >
                <Icon name="certificate" size={14} />
                <span>Download Certificate</span>
              </button>
            </div>

            <div className="content-body content-body-rich">
              {lessonSections.length > 0 ? (
                lessonSections.map((section, index) => (
                  <p key={`${activeLesson.id}-${index}`} className={index === 0 ? 'lesson-section-lead' : ''}>
                    {section}
                  </p>
                ))
              ) : (
                <p>No content available for this lesson.</p>
              )}
            </div>

            <div className="lesson-support-grid">
              <div className="lesson-support-card">
                <span className="lesson-support-label">Study prompt</span>
                <p>Summarize this lesson in your own words, then write one concrete decision or workflow you would improve with it.</p>
              </div>
              <div className="lesson-support-card">
                <span className="lesson-support-label">Application checkpoint</span>
                <p>Before moving on, identify one team ritual, review step, or implementation task where this lesson should directly influence quality.</p>
              </div>
            </div>

            <section className="video-resource-grid">
              {recommendedVideos.map((video) => (
                <article key={video.id || video.youtubeId} className="video-card">
                  <div className="video-card-head">
                    <Icon name="video" size={16} />
                    <span>{video.title}</span>
                  </div>
                  <div className="video-embed-shell">
                    <iframe
                      src={video.embedUrl || `https://www.youtube.com/embed/${video.youtubeId}`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </article>
              ))}
            </section>

            {!completedLessons.has(activeLesson.id) && (
              <button className="btn btn-primary" onClick={handleMarkComplete}>
                <Icon name="check" size={14} />
                <span>Mark as Complete</span>
              </button>
            )}
            {completedLessons.has(activeLesson.id) && (
              <div className="completed-badge-lg">
                <Icon name="check" size={14} />
                <span>Completed</span>
              </div>
            )}

            <div className="lesson-nav" ref={navRef}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={scrollToTop}>
                <span>Back to top</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={disableAdvance}
                onClick={() => {
                  if (disableAdvance) return;
                  if (quizPending) {
                    scrollToQuiz();
                    return;
                  }
                  if (nextLesson) {
                    setActiveLesson(nextLesson);
                    scrollToTop();
                    return;
                  }
                  navigate('/my-courses');
                }}
              >
                <span>
                  {!isLessonComplete && requiresCompletionToAdvance
                    ? 'Complete Lesson to Continue'
                    : quizPending
                      ? 'Go to Quiz'
                      : nextLesson
                        ? 'Next Lesson'
                        : 'Back to My Courses'}
                </span>
                <Icon name="arrowRight" size={14} />
              </button>
            </div>

            {quizAvailable && (
              <section className="module-quiz-card" ref={quizRef}>
                <div className="module-quiz-head">
                  <h3>{moduleQuizTitle}</h3>
                  <span>Check your understanding before moving on.</span>
                </div>
                <form onSubmit={handleQuizSubmit} className="module-quiz-form">
                  {moduleQuiz.map((question) => (
                    <div key={question.id} className="module-quiz-item">
                      <p>{question.prompt}</p>
                      <div className="module-quiz-options">
                        {question.options.map((option) => (
                          <label
                            key={option}
                            className={`quiz-option${quizResult ? option === question.answer ? ' is-correct' : quizAnswers[question.id] === option ? ' is-wrong' : '' : ''}`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              checked={quizAnswers[question.id] === option}
                              disabled={Boolean(quizResult)}
                              onChange={() => setQuizAnswers((current) => ({ ...current, [question.id]: option }))}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                      {quizResult && (
                        <div className="quiz-feedback">
                          <span className={`quiz-answer ${quizAnswers[question.id] === question.answer ? 'correct' : 'wrong'}`}>
                            Your answer: {quizAnswers[question.id] || 'No answer'}
                          </span>
                          <span className="quiz-correct">Correct answer: {question.answer}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <button type="submit" className="btn btn-primary btn-sm" disabled={Boolean(quizResult)}>
                    {quizResult ? 'Quiz Submitted' : 'Submit Quiz'}
                  </button>
                </form>
                {quizResult && (
                  <p className="quiz-result">
                    You answered {quizResult.score} of {quizResult.total} correctly.
                  </p>
                )}
              </section>
            )}
          </>
        ) : (
          <div className="content-placeholder">
            <p className="empty-state">Select a lesson from the sidebar to begin learning</p>
          </div>
        )}
      </div>
      {lessonAlert && (
        <div className="modal-overlay lesson-alert-overlay" onClick={() => setLessonAlert(null)}>
          <div className="lesson-alert-card" onClick={(event) => event.stopPropagation()}>
            <div className="lesson-alert-icon">
              <Icon name="warning" size={22} />
            </div>
            <div className="lesson-alert-copy">
              <h3>{lessonAlert.title}</h3>
              <p>{lessonAlert.message}</p>
            </div>
            <div className="lesson-alert-actions">
              <button type="button" className="btn btn-primary" onClick={() => setLessonAlert(null)}>
                Continue Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
