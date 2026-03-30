import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import BackButton from './components/BackButton';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import EnrolledCourses from './pages/EnrolledCourses';
import LearningView from './pages/LearningView';
import PerformanceView from './pages/PerformanceView';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import InstructorPanel from './pages/InstructorPanel';
import RoleAccessPage from './pages/RoleAccessPage';
import NotFound from './pages/NotFound';
import { useAuth } from './hooks/useAuth';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;
  return <Navigate to="/login" />;
}

function AppRoutes() {
  const location = useLocation();
  const hideBackOn = ['/login', '/auth/callback'];

  return (
    <>
      <ScrollToTop />
      <Navbar />
      {!hideBackOn.includes(location.pathname) && <BackButton />}
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/access" element={<ProtectedRoute><RoleAccessPage /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><CourseList /></ProtectedRoute>} />
        <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
        <Route path="/my-courses" element={<ProtectedRoute allowedRoles={['learner']}><EnrolledCourses /></ProtectedRoute>} />
        <Route path="/learn/:courseId" element={<ProtectedRoute allowedRoles={['learner']}><LearningView /></ProtectedRoute>} />
        <Route path="/performance" element={<ProtectedRoute allowedRoles={['learner']}><PerformanceView /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
        <Route path="/instructor" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorPanel /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
