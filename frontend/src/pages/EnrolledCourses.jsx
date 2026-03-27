import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { deleteEnrollment, getAllEnrollments } from '../services/enrollmentService';
import { getAllProgress } from '../services/progressService';
import Pagination from '../components/Pagination';
import ProgressBar from '../components/ProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';
import Icon from '../components/Icon';
import CertificateModal from '../components/CertificateModal';
import ConfirmModal from '../components/ConfirmModal';
import { downloadCertificatePdf } from '../utils/pdf';

const ENROLLMENTS_PER_PAGE = 6;

export default function EnrolledCourses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [enrollments, setEnrollments] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [certificateData, setCertificateData] = useState(null);
  const [leaveTarget, setLeaveTarget] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [enrollRes, progRes] = await Promise.all([
          getAllEnrollments(),
          getAllProgress()
        ]);
        const mine = (enrollRes.data.data || []).filter((item) => item.user_id === user?.id);
        const progData = (progRes.data.data || []).filter((item) => item.user_id === user?.id);
        const nextProgressMap = {};
        progData.forEach((item) => {
          nextProgressMap[item.course_id] = item.completion_percentage;
        });
        setEnrollments(mine);
        setProgressMap(nextProgressMap);
      } catch {} finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const totalPages = Math.max(1, Math.ceil(enrollments.length / ENROLLMENTS_PER_PAGE));
  const paginatedEnrollments = enrollments.slice(
    (currentPage - 1) * ENROLLMENTS_PER_PAGE,
    currentPage * ENROLLMENTS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleCertificateOpen = (enrollment) => {
    setCertificateData({
      learnerName: user?.name || 'Learner',
      courseTitle: enrollment.course_title,
      completedDate: new Date().toLocaleDateString()
    });
  };

  const handleCertificateDownload = () => {
    if (!certificateData) return;
    downloadCertificatePdf(certificateData);
  };

  const handleLeaveCourse = async () => {
    if (!leaveTarget) return;

    try {
      await deleteEnrollment(leaveTarget.id);
      setEnrollments((current) => current.filter((item) => item.id !== leaveTarget.id));
      showToast('You have been unenrolled from the course.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to leave the course right now.', 'error');
    }
    setLeaveTarget(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My <span className="text-gradient">Courses</span></h1>
        <p className="page-subtitle">Track your learning journey</p>
      </div>
      {enrollments.length === 0 ? (
        <div className="empty-state-container">
          <p className="empty-state">You haven't enrolled in any courses yet.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/courses')}>
            Browse Courses
          </button>
        </div>
      ) : (
        <>
          <div className="enrolled-list">
            {paginatedEnrollments.map((enrollment) => {
              const isCompleted = enrollment.status === 'completed' || Number(progressMap[enrollment.course_id] || 0) >= 100;

              return (
                <div
                  key={enrollment.id}
                  className="enrolled-card"
                  onClick={() => navigate(`/learn/${enrollment.course_id}`)}
                >
                  <div className="enrolled-card-info">
                    <h3>{enrollment.course_title}</h3>
                    <span className={`status-badge status-${enrollment.status}`}>{enrollment.status}</span>
                  </div>
                  <ProgressBar percentage={progressMap[enrollment.course_id] || 0} />
                  <div className="enrolled-card-actions">
                    <button type="button" className="btn btn-primary btn-sm">
                      <span>Continue Learning</span>
                      <Icon name="arrowRight" size={14} />
                    </button>
                    {!isCompleted && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          setLeaveTarget(enrollment);
                        }}
                      >
                        Leave Course
                      </button>
                    )}
                    {isCompleted && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCertificateOpen(enrollment);
                        }}
                      >
                        <Icon name="certificate" size={14} />
                        <span>Certificate</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={enrollments.length}
            itemLabel="enrollments"
            onPageChange={setCurrentPage}
          />
        </>
      )}
      <CertificateModal
        certificate={certificateData}
        onClose={() => setCertificateData(null)}
        onDownload={handleCertificateDownload}
      />
      {leaveTarget && (
        <ConfirmModal
          title={`Leave ${leaveTarget.course_title}?`}
          message="Your progress will be removed from your active courses list."
          confirmLabel="Leave Course"
          cancelLabel="Keep Course"
          onCancel={() => setLeaveTarget(null)}
          onConfirm={handleLeaveCourse}
        />
      )}
    </div>
  );
}
