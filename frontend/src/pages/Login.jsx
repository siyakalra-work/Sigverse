import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  getDemoUsers,
  loginWithEmail,
  loginWithGithub,
  requestPasswordReset,
  resetPassword,
  signupWithEmail,
  verifySignupOtp
} from '../services/authService';
import Icon from '../components/Icon';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'learner'
};

const INITIAL_RESET = {
  email: '',
  otp: '',
  newPassword: ''
};

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7a3 3 0 0 0 4.2 4.2" />
      <path d="M9.9 5.1A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a21.7 21.7 0 0 1-5.2 5.8" />
      <path d="M6.6 6.7A21.5 21.5 0 0 0 1 12s4 7 11 7a10.8 10.8 0 0 0 4.1-.8" />
    </svg>
  );
}

function getPasswordStrength(password) {
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!password) return { score: 0, label: 'Weak' };
  if (password.length >= 12 && hasMixedCase && hasNumber && hasSpecial) {
    return { score: 4, label: 'Strong' };
  }
  if (password.length >= 10 && hasMixedCase) {
    return { score: 3, label: 'Good' };
  }
  if (password.length >= 6) {
    return { score: 2, label: 'Fair' };
  }
  return { score: 1, label: 'Weak' };
}

function PasswordStrength({ password }) {
  const { score, label } = getPasswordStrength(password);

  return (
    <div className="password-strength" aria-live="polite">
      <div className="password-strength-bars">
        {[1, 2, 3, 4].map((value) => (
          <span
            key={value}
            className={`password-strength-bar${value <= score ? ` filled-${score}` : ''}`}
          />
        ))}
      </div>
      <span className="password-strength-label">{label}</span>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  hint,
  placeholder,
  autoComplete,
  showStrength = false
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="input-password-wrapper">
        <input
          type={show ? 'text' : 'password'}
          className="form-input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{ paddingRight: '2.75rem' }}
          required
        />
        <button
          type="button"
          className="input-password-toggle"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {hint && <span className="form-hint">{hint}</span>}
      {showStrength && <PasswordStrength password={value} />}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [view, setView] = useState('login');
  const [form, setForm] = useState(INITIAL_FORM);
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [resetForm, setResetForm] = useState(INITIAL_RESET);
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  usePageTitle('Sign In');

  useEffect(() => {
    getDemoUsers()
      .then((res) => setDemoUsers(res.data.data || []))
      .catch(() => {});
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateResetField = (field, value) => {
    setResetForm((current) => ({ ...current, [field]: value }));
  };

  const getAuthErrorMessage = (err) => {
    if (err.response?.status === 404) {
      return 'Login and signup routes are not available on the running backend yet. Restart the backend server and try again.';
    }

    if (!err.response) {
      return 'Cannot reach the backend. Check that the deployed API URL is configured correctly and the backend service is running.';
    }

    if (Array.isArray(err.response?.data?.errors) && err.response?.data?.errors.length) {
      return err.response.data.errors.join(' ');
    }

    return err.response?.data?.message || 'Authentication failed';
  };

  const switchView = (nextView) => {
    setView(nextView);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowResetPassword(false);
    setGithubLoading(false);
  };

  const handleLocalSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (view === 'login') {
        const res = await loginWithEmail({
          email: form.email,
          password: form.password
        });
        const payload = res.data.data;
        if (payload?.token) {
          await login(payload.token);
          navigate('/dashboard', { replace: true });
          return;
        }
      }

      if (view === 'signup') {
        if (form.password !== form.confirmPassword) {
          showToast('Passwords do not match', 'error');
          return;
        }

        const res = await signupWithEmail({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role
        });
        const payload = res.data.data;

        if (payload?.otpRequired) {
          setOtpEmail(form.email);
          setOtpCode('');
          setView('signup-otp');
          showToast('OTP sent to your email. Verify to finish creating your account.', 'success');
          return;
        }

        if (payload?.requiresApproval) {
          showToast('Instructor signup request sent to admin. You can log in after approval.', 'success');
          setView('login');
          setForm(INITIAL_FORM);
          return;
        }

        if (payload?.token) {
          await login(payload.token);
          navigate('/dashboard', { replace: true });
          return;
        }

        showToast('Account created successfully. Please log in.', 'success');
        setView('login');
        setForm(INITIAL_FORM);
      }
    } catch (err) {
      showToast(getAuthErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (view === 'signup-otp') {
        const res = await verifySignupOtp({ email: otpEmail, otp: otpCode });
        const payload = res.data.data;
        if (payload?.requiresApproval) {
          showToast('Instructor signup request sent to admin. You can log in after approval.', 'success');
          setView('login');
          setForm(INITIAL_FORM);
          return;
        }
        if (payload?.token) {
          await login(payload.token);
          navigate('/dashboard', { replace: true });
          return;
        }
        showToast('Account verified. Please log in.', 'success');
        setView('login');
        setForm(INITIAL_FORM);
      }
    } catch (err) {
      showToast(getAuthErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await requestPasswordReset({ email: resetForm.email });
      if (res.data.data?.otpRequired) {
        setView('reset');
        setResetForm((current) => ({ ...current, otp: '' }));
        showToast('OTP sent to your email. Use it to reset your password.', 'success');
      }
    } catch (err) {
      showToast(getAuthErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await resetPassword({
        email: resetForm.email,
        otp: resetForm.otp,
        newPassword: resetForm.newPassword
      });
      showToast('Password updated. Please log in.', 'success');
      setView('login');
      setResetForm(INITIAL_RESET);
    } catch (err) {
      showToast(getAuthErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = () => {
    setGithubLoading(true);
    loginWithGithub();
  };

  const handleCopyDemo = async (demo) => {
    try {
      await navigator.clipboard.writeText(demo.password);
      showToast('Password copied', 'info');
    } catch {
      showToast('Unable to copy password from this browser session.', 'error');
    }
  };

  const isLoginFlow = ['login', 'forgot', 'reset'].includes(view);
  const isSignupFlow = ['signup', 'signup-otp'].includes(view);

  return (
    <div className="login-page">
      <div className="login-bg-effects">
        <div className="login-orb login-orb-1"></div>
        <div className="login-orb login-orb-2"></div>
        <div className="login-orb login-orb-3"></div>
      </div>
      <div className="login-card login-card-wide">
        <div className="login-card-inner">
          <span className="login-kicker">Professional learning workspace</span>
          <div className="login-logo sigverse-logo">
            <Icon name="brand" size={38} className="logo-icon-svg" />
          </div>
          <h1 className="login-title">Sigverse</h1>
          <p className="login-subtitle">OAuth plus local sign in for learners, instructors, and admins.</p>

          <div className="login-mode-switch">
            <button
              type="button"
              className={`login-mode-btn ${isLoginFlow ? 'active' : ''}`}
              onClick={() => switchView('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`login-mode-btn ${isSignupFlow ? 'active' : ''}`}
              onClick={() => switchView('signup')}
            >
              Sign Up
            </button>
          </div>

          {(view === 'login' || view === 'signup') && (
            <form onSubmit={handleLocalSubmit} className="login-form">
              {view === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <PasswordField
                label="Password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                show={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
                hint="Minimum 6 characters"
                autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                showStrength={view === 'signup'}
              />
              {view === 'signup' && (
                <>
                  <PasswordField
                    label="Confirm Password"
                    value={form.confirmPassword}
                    onChange={(event) => updateField('confirmPassword', event.target.value)}
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((current) => !current)}
                    autoComplete="new-password"
                  />
                  <div className="form-group">
                    <label className="form-label">Register As</label>
                    <select
                      className="form-input"
                      value={form.role}
                      onChange={(event) => updateField('role', event.target.value)}
                    >
                      <option value="learner">Learner</option>
                      <option value="instructor">Instructor Request</option>
                    </select>
                    <span className="form-hint">Instructor accounts require admin approval before login is enabled.</span>
                  </div>
                </>
              )}
              <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
                {loading ? 'Please wait...' : view === 'login' ? 'Login with Email' : 'Create Account'}
              </button>
              {view === 'login' && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm login-helper-btn"
                  onClick={() => {
                    setResetForm({ email: form.email || '', otp: '', newPassword: '' });
                    switchView('forgot');
                  }}
                >
                  Forgot password?
                </button>
              )}
            </form>
          )}

          {view === 'signup-otp' && (
            <form onSubmit={handleOtpVerify} className="login-form">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={otpEmail} autoComplete="email" disabled />
              </div>
              <div className="form-group">
                <label className="form-label">OTP Code</label>
                <input
                  type="text"
                  className="form-input otp-input"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                  placeholder="Enter 6-digit code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                />
                <span className="form-hint">Enter the 6-digit code sent to your email.</span>
              </div>
              <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm login-helper-btn"
                onClick={() => {
                  setOtpCode('');
                  switchView('signup');
                }}
              >
                Back to Sign Up
              </button>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="login-form">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={resetForm.email}
                  onChange={(event) => updateResetField('email', event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
                <span className="form-hint">We will send a one-time OTP so you can set a new password.</span>
              </div>
              <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm login-helper-btn"
                onClick={() => switchView('login')}
              >
                Back to Login
              </button>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="login-form">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={resetForm.email}
                  onChange={(event) => updateResetField('email', event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">OTP Code</label>
                <input
                  type="text"
                  className="form-input otp-input"
                  value={resetForm.otp}
                  onChange={(event) => updateResetField('otp', event.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                />
              </div>
              <PasswordField
                label="New Password"
                value={resetForm.newPassword}
                onChange={(event) => updateResetField('newPassword', event.target.value)}
                show={showResetPassword}
                onToggle={() => setShowResetPassword((current) => !current)}
                hint="Minimum 6 characters"
                autoComplete="new-password"
                showStrength
              />
              <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm login-helper-btn"
                onClick={() => switchView('login')}
              >
                Back to Login
              </button>
            </form>
          )}

          <div className="login-divider"></div>

          <button className="btn-github" onClick={handleGithubLogin} disabled={githubLoading}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {githubLoading ? 'Redirecting…' : 'Continue with GitHub'}
          </button>

          {demoUsers.length > 0 && (
            <div className="demo-login-grid">
              {demoUsers.map((demo) => (
                <div key={demo.role} className="demo-login-card">
                  <strong>{demo.role}</strong>
                  <span>{demo.email}</span>
                  <div>
                    <code>{demo.password}</code>
                    <button type="button" className="demo-copy-btn" onClick={() => handleCopyDemo(demo)}>
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="login-footer-text">Use GitHub OAuth or the demo local accounts above for role testing.</p>
        </div>
      </div>
    </div>
  );
}
