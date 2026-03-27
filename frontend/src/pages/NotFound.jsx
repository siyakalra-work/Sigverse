import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

export default function NotFound() {
  return (
    <div className="page-container not-found">
      <div className="not-found-card">
        <span className="section-eyebrow">404</span>
        <h1 className="page-title">Page not found</h1>
        <p className="page-subtitle">The route you tried does not exist or has moved.</p>
        <div className="not-found-actions">
          <Link to="/dashboard" className="btn btn-primary">
            <Icon name="dashboard" size={14} />
            <span>Go to Dashboard</span>
          </Link>
          <Link to="/courses" className="btn btn-ghost">
            Browse Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
