import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getAllEnrollments } from '../services/enrollmentService';
import { getAllProgress } from '../services/progressService';
import { getAllPerformance } from '../services/performanceService';
import { getAllCourses } from '../services/courseService';
import { usePageTitle } from '../hooks/usePageTitle';
import LoadingSpinner from '../components/LoadingSpinner';
import Icon from '../components/Icon';

function average(items, field) {
  if (items.length === 0) return 0;
  return items.reduce((sum, item) => sum + parseFloat(item[field]), 0) / items.length;
}

function buildDashboardModel(user, courses, enrollments, progress, performance) {
  const courseCount = courses.length;
  const roleActions = {
    learner: [
      { to: '/courses', label: 'Explore Catalog' },
      { to: '/my-courses', label: 'Continue Learning' }
    ],
    instructor: [
      { to: '/instructor', label: 'Manage Teaching' },
      { to: '/courses', label: 'Review Catalog' }
    ],
    admin: [
      { to: '/admin', label: 'Open Admin Panel' },
      { to: '/courses', label: 'Review Catalog' }
    ]
  };

  if (user.role === 'instructor') {
    const taughtCourses = courses.filter(course => course.instructor_id === user.id);
    const taughtCourseIds = new Set(taughtCourses.map(course => course.id));
    const cohortEnrollments = enrollments.filter(item => taughtCourseIds.has(item.course_id));
    const cohortProgress = progress.filter(item => taughtCourseIds.has(item.course_id));
    const cohortPerformance = performance.filter(item => taughtCourseIds.has(item.course_id));
    const topCourse = taughtCourses.reduce((best, course) => (
      Number(course.learner_count || 0) > Number(best?.learner_count || 0) ? course : best
    ), taughtCourses[0] || null);

    return {
      spotlight: {
        eyebrow: 'Instructor workspace',
        title: `Lead with clarity, ${user.name}`,
        description: 'Track cohort health, keep course delivery organized, and move from curriculum planning to learner outcomes in one flow.',
        meta: [
          `${taughtCourses.length} courses led`,
          `${cohortEnrollments.length} active learner relationships`,
          `${average(cohortProgress, 'completion_percentage').toFixed(1)}% average cohort completion`
        ]
      },
      actions: roleActions.instructor,
      stats: [
        { key: 'courses-led', label: 'Courses Led', value: taughtCourses.length, icon: 'instructor', tone: 'stat-card-courses' },
        { key: 'learners', label: 'Cohort Enrollments', value: cohortEnrollments.length, icon: 'enrollments', tone: 'stat-card-enrolled' },
        { key: 'progress', label: 'Avg Cohort Progress', value: `${average(cohortProgress, 'completion_percentage').toFixed(1)}%`, icon: 'performance', tone: 'stat-card-progress' },
        { key: 'score', label: 'Avg Cohort Score', value: cohortPerformance.length ? average(cohortPerformance, 'score').toFixed(1) : 'N/A', icon: 'certificate', tone: 'stat-card-score' }
      ],
      signals: [
        {
          title: 'Delivery focus',
          value: topCourse ? topCourse.title : 'No course published yet',
          description: topCourse
            ? `${topCourse.learner_count || 0} learners are attached to your highest-demand course right now.`
            : 'Create a course to start building your teaching pipeline.'
        },
        {
          title: 'Operational note',
          value: cohortPerformance.length ? `${average(cohortPerformance, 'score').toFixed(1)} average score` : 'No assessments recorded yet',
          description: 'Use progress and performance trends together to decide where to add support, refresh content, or adjust pacing.'
        }
      ]
    };
  }

  if (user.role === 'admin') {
    const overallProgress = average(progress, 'completion_percentage');
    const overallScore = average(performance, 'score');
    const activeEnrollments = enrollments.filter(item => item.status === 'active').length;
    const topCourse = courses.reduce((best, course) => (
      Number(course.learner_count || 0) > Number(best?.learner_count || 0) ? course : best
    ), courses[0] || null);

    return {
      spotlight: {
        eyebrow: 'Operations overview',
        title: `Monitor system health, ${user.name}`,
        description: 'Keep the catalog, enrollments, and delivery metrics aligned so the platform reads clearly to learners, instructors, and stakeholders.',
        meta: [
          `${courseCount} courses live`,
          `${enrollments.length} enrollment records`,
          `${activeEnrollments} active learning journeys`
        ]
      },
      actions: roleActions.admin,
      stats: [
        { key: 'catalog', label: 'Catalog Courses', value: courseCount, icon: 'courses', tone: 'stat-card-courses' },
        { key: 'enrollments', label: 'Enrollments', value: enrollments.length, icon: 'enrollments', tone: 'stat-card-enrolled' },
        { key: 'progress', label: 'Overall Progress', value: `${overallProgress.toFixed(1)}%`, icon: 'performance', tone: 'stat-card-progress' },
        { key: 'score', label: 'Overall Score', value: performance.length ? overallScore.toFixed(1) : 'N/A', icon: 'certificate', tone: 'stat-card-score' }
      ],
      signals: [
        {
          title: 'Highest demand course',
          value: topCourse ? topCourse.title : 'Catalog still empty',
          description: topCourse
            ? `${topCourse.learner_count || 0} learners are connected to the busiest course in the catalog.`
            : 'Seed or create courses to turn the admin panel into a meaningful operating view.'
        },
        {
          title: 'Platform momentum',
          value: `${activeEnrollments} active enrollments`,
          description: 'This is a quick read on how many learning journeys are still in motion across the current catalog.'
        }
      ]
    };
  }

  const myEnrollments = enrollments.filter(item => item.user_id === user.id);
  const myProgress = progress.filter(item => item.user_id === user.id);
  const myPerformance = performance.filter(item => item.user_id === user.id);
  const completedCourses = myEnrollments.filter(item => item.status === 'completed').length;

  return {
    spotlight: {
      eyebrow: 'Learning command center',
      title: `Welcome back, ${user.name}`,
      description: 'Review your active coursework, keep momentum visible, and move confidently through a structured catalog built for steady progress.',
      meta: [
        `${myEnrollments.length} courses in your plan`,
        `${completedCourses} completed milestones`,
        `${average(myPerformance, 'score').toFixed(1)} average score`
      ]
    },
    actions: roleActions.learner,
    stats: [
      { key: 'catalog', label: 'Catalog Courses', value: courseCount, icon: 'courses', tone: 'stat-card-courses' },
      { key: 'enrolled', label: 'My Enrollments', value: myEnrollments.length, icon: 'enrollments', tone: 'stat-card-enrolled' },
      { key: 'progress', label: 'Avg Progress', value: `${average(myProgress, 'completion_percentage').toFixed(1)}%`, icon: 'performance', tone: 'stat-card-progress' },
      { key: 'score', label: 'Avg Score', value: myPerformance.length ? average(myPerformance, 'score').toFixed(1) : 'N/A', icon: 'certificate', tone: 'stat-card-score' }
    ],
    signals: [
      {
        title: 'Current pace',
        value: `${completedCourses} completed courses`,
        description: myEnrollments.length
          ? 'Your pace improves when progress is updated regularly after each lesson or learning session.'
          : 'Start with the catalog to build your first learning plan and unlock progress tracking.'
      },
      {
        title: 'Next best move',
        value: myProgress.length ? `${average(myProgress, 'completion_percentage').toFixed(1)}% average completion` : 'No tracked progress yet',
        description: 'Use the course catalog to find a new path, then continue your active modules from the learning view.'
      }
    ]
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState({ spotlight: null, actions: [], stats: [], signals: [] });
  const [loading, setLoading] = useState(true);

  usePageTitle('Dashboard');

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const [coursesRes, enrollRes, progressRes, perfRes] = await Promise.all([
          getAllCourses().catch(() => ({ data: { data: [] } })),
          getAllEnrollments().catch(() => ({ data: { data: [] } })),
          getAllProgress().catch(() => ({ data: { data: [] } })),
          getAllPerformance().catch(() => ({ data: { data: [] } })),
        ]);
        setDashboard(buildDashboardModel(
          user,
          coursesRes.data.data || [],
          enrollRes.data.data || [],
          progressRes.data.data || [],
          perfRes.data.data || []
        ));
      } catch {} finally { setLoading(false); }
    };
    fetchStats();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="section-eyebrow">{dashboard.spotlight?.eyebrow}</span>
          <h1 className="dashboard-hero-title">{dashboard.spotlight?.title}</h1>
          <p className="dashboard-hero-text">{dashboard.spotlight?.description}</p>
          <div className="dashboard-hero-actions">
            {dashboard.actions.map(action => (
              <Link key={action.to} to={action.to} className="btn btn-primary">
                {action.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="dashboard-hero-panel">
          <p className="dashboard-panel-label">Operational snapshot</p>
          <div className="dashboard-panel-metrics">
            {dashboard.spotlight?.meta?.map((item) => (
              <div key={item} className="dashboard-panel-metric">
                <span className="dashboard-panel-dot"></span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="stats-grid">
        {dashboard.stats.map((stat) => (
          <div key={stat.key} className={`stat-card ${stat.tone}`}>
            <div className="stat-icon"><Icon name={stat.icon} size={22} /></div>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>
      <section className="dashboard-signal-grid">
        {dashboard.signals.map((signal) => (
          <article key={signal.title} className="dashboard-signal-card">
            <span className="dashboard-signal-label">{signal.title}</span>
            <h2 className="dashboard-signal-title">{signal.value}</h2>
            <p className="dashboard-signal-text">{signal.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
