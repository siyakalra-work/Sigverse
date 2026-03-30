import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { getCourseById } from '../services/courseService';
import { createEnrollment, getAllEnrollments } from '../services/enrollmentService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Icon from '../components/Icon';
import { getCourseCategory, getRecommendedVideos } from '../utils/courseMeta';
import { downloadCoursePdf } from '../utils/pdf';

function getLessonPreview(content) {
  if (!content) return 'Detailed lesson notes will appear here once the lesson content is available.';
  return content.split('\n\n')[0].replace(/^Overview\s*/i, '').trim();
}

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    getCourseById(id)
      .then(res => setCourse(res.data.data))
      .catch(err => setError(err.response?.data?.message || 'Course not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== 'learner') return;
    getAllEnrollments()
      .then((res) => {
        const mine = (res.data.data || []).filter((item) => item.user_id === user.id);
        setIsEnrolled(mine.some((item) => item.course_id === Number(id)));
      })
      .catch(() => {});
  }, [id, user]);

  const handleEnroll = async () => {
    if (!user) return;
    try {
      await createEnrollment({ user_id: user.id, course_id: Number(id) });
      setIsEnrolled(true);
      showToast('Enrolled successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Enrollment failed', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="page-container"><ErrorMessage message={error} /></div>;

  const totalModules = course.modules?.length || 0;
  const totalLessons = course.modules?.reduce((sum, module) => sum + (module.lessons?.length || 0), 0) || 0;
  const learners = Number(course.learner_count || 0);
  const category = getCourseCategory(course);
  const featuredModule = course.modules?.[0] || null;
  const recommendedVideos = getRecommendedVideos(course, featuredModule);

  return (
    <div className="page-container">
      {/* <button className="btn btn-ghost" onClick={() => navigate(-1)}>
        <Icon name="back" size={14} />
        <span>Back</span>
      </button> */}
      <section className="course-detail-hero">
        <div className="detail-header">
          <span className="section-eyebrow">Course deep dive</span>
          <h1 className="page-title">{course.title}</h1>
          <span className="course-card-id">{category}</span>
          <span className="detail-instructor">By {course.instructor_name || 'Instructor'}</span>
          <p className="detail-description">{course.description}</p>
          <div className="detail-actions">
            {user?.role === 'learner' && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleEnroll}
                disabled={isEnrolled}
              >
                <Icon name="enrollments" size={14} />
                <span>{isEnrolled ? 'Enrolled' : 'Enroll Now'}</span>
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadCoursePdf({ ...course, category })}>
              <Icon name="download" size={14} />
              <span>Download Course PDF</span>
            </button>
          </div>
        </div>
        <div className="course-detail-metrics">
          <div className="course-detail-metric">
            <span className="course-detail-metric-value">{totalModules}</span>
            <span className="course-detail-metric-label">Modules</span>
          </div>
          <div className="course-detail-metric">
            <span className="course-detail-metric-value">{totalLessons}</span>
            <span className="course-detail-metric-label">Lessons</span>
          </div>
          <div className="course-detail-metric">
            <span className="course-detail-metric-value">{learners}</span>
            <span className="course-detail-metric-label">Learners</span>
          </div>
        </div>
      </section>

      <section className="modules-section">
        <h2 className="section-title">Video Resources</h2>
        <div className="video-resource-grid">
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
        </div>
      </section>
      
      <div className="modules-section">
        <h2 className="section-title">Modules & Lessons</h2>
        {course.modules && course.modules.length > 0 ? (
          course.modules.map((mod, i) => (
            <div key={mod.id} className="module-card">
              <div className="module-header">
                <span className="module-order">{i + 1}</span>
                <div className="module-header-copy">
                  <h3 className="module-name">{mod.module_name}</h3>
                  <span className="module-subtitle">{mod.lessons?.length || 0} guided lessons in this module</span>
                </div>
              </div>
              {mod.lessons && mod.lessons.length > 0 ? (
                <ul className="lesson-list">
                  {mod.lessons.map(lesson => (
                    <li key={lesson.id} className="lesson-item lesson-item-detailed">
                      <span className="lesson-icon"><Icon name="document" size={14} /></span>
                      <div className="lesson-item-copy">
                        <span className="lesson-item-title">{lesson.lesson_name}</span>
                        <p className="lesson-item-preview">{getLessonPreview(lesson.content)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-lessons">No lessons yet</p>
              )}
            </div>
          ))
        ) : (
          <p className="empty-state">No modules added yet.</p>
        )}
      </div>
    </div>
  );
}
