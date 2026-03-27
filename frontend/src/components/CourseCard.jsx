import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourseCategory } from '../utils/courseMeta';

export default function CourseCard({ course, onEnroll, enrolled, showEnroll = false }) {
  const navigate = useNavigate();
  const [enrolling, setEnrolling] = useState(false);
  const moduleCount = Number(course.module_count || 0);
  const lessonCount = Number(course.lesson_count || 0);
  const learnerCount = Number(course.learner_count || 0);
  const spotlight = enrolled ? 'Enrolled' : learnerCount >= 8 ? 'Popular Cohort' : 'Open Cohort';
  const category = getCourseCategory(course);

  const handleEnroll = async (event) => {
    event.stopPropagation();
    if (!onEnroll || enrolling) return;

    setEnrolling(true);
    try {
      await onEnroll(course.id);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <article
      className="course-card"
      onClick={() => navigate(`/courses/${course.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(`/courses/${course.id}`);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View course: ${course.title}`}
    >
      <div className="course-card-gradient"></div>
      <div className="course-card-content">
        <div className="course-card-topline">
          <span className={`course-card-spotlight ${enrolled ? 'course-card-spotlight-enrolled' : ''}`}>{spotlight}</span>
          <span className="course-card-id">{category}</span>
        </div>
        <h3 className="course-card-title">{course.title}</h3>
        <p className="course-card-desc">{course.description || 'No description available'}</p>
        <div className="course-card-instructor">Led by {course.instructor_name || 'Instructor'}</div>
        <div className="course-card-metrics">
          <div className="course-card-metric">
            <span className="course-card-metric-value">{moduleCount}</span>
            <span className="course-card-metric-label">Modules</span>
          </div>
          <div className="course-card-metric">
            <span className="course-card-metric-value">{lessonCount}</span>
            <span className="course-card-metric-label">Lessons</span>
          </div>
          <div className="course-card-metric">
            <span className="course-card-metric-value">{learnerCount}</span>
            <span className="course-card-metric-label">Learners</span>
          </div>
        </div>
        <div className="course-card-footer">
          {showEnroll && !enrolled && (
            <button className="btn btn-primary btn-sm" onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? 'Enrolling...' : 'Enroll Now'}
            </button>
          )}
          {enrolled && <span className="enrolled-badge">Currently in your plan</span>}
          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course.id}`); }}>
            View Syllabus
          </button>
        </div>
      </div>
    </article>
  );
}
