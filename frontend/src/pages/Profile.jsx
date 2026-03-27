import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const isAdminSelfLocked = user?.role === 'admin';
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  usePageTitle('Profile');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch(`/users/${user.id}`, { name, email });
      setUser(res.data.data);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My <span className="text-gradient">Profile</span></h1>
      </div>
      <div className="profile-card">
        <div className="profile-avatar-section">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="profile-avatar-lg" />
          ) : (
            <div className="profile-avatar-placeholder-lg">{user?.name?.[0]?.toUpperCase() || '?'}</div>
          )}
          <span className="role-badge" data-role={user?.role}>{user?.role}</span>
        </div>
        <form onSubmit={handleSave} className="profile-form">
          {isAdminSelfLocked && <div className="toast toast-error">Admin self-edit is disabled in this build.</div>}
          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required disabled={isAdminSelfLocked} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required disabled={isAdminSelfLocked} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <input type="text" className="form-input" value={user?.role} disabled />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving || isAdminSelfLocked}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
