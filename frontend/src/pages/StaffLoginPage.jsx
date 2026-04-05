import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { registerDevice } = useNotification();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.body.classList.add('auth-background');
    return () => {
      document.body.classList.remove('auth-background');
    };
  }, []);

  useEffect(() => {
    const flash = sessionStorage.getItem('app_toast');
    if (flash) {
      setToast(flash);
      sessionStorage.removeItem('app_toast');
      setTimeout(() => setToast(''), 2500);
    }
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const extractErrorMessage = (err, fallback) => {
    const data = err?.response?.data;
    if (!data) return fallback;
    if (typeof data.detail === 'string') return data.detail;
    const firstKey = Object.keys(data)[0];
    const firstValue = firstKey ? data[firstKey] : null;
    if (Array.isArray(firstValue) && firstValue[0]) return String(firstValue[0]);
    if (typeof firstValue === 'string') return firstValue;
    return fallback;
  };

  const navigateByRole = (user) => {
    const role = String(user?.role || '').toLowerCase();
    if (role === 'admin') navigate('/admin/dashboard');
    else navigate('/staff/dashboard');
  };

  const tryRegisterDevice = async () => {
    try {
      await registerDevice();
    } catch {
      // Notification setup should not block auth navigation.
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      await tryRegisterDevice();
      setToast(`Welcome back, ${user?.full_name || 'Staff'}! You have 0 pending visitor alerts.`);
      setTimeout(() => navigateByRole(user), 1500);
    } catch (err) {
      setError(extractErrorMessage(err, 'Invalid credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-shell">
        <div className="auth-wrap">
          <section className="auth-hero staff-portal-hero">
            <span className="auth-badge">Staff Portal</span>
            <h2>Manage Requests in Real Time</h2>
            <p>
              Log in to respond quickly, update visitor requests, and communicate with visitors from one central dashboard.
            </p>
          </section>
          <section className="auth-panel">
            <div className="hero">
              <h1>Staff Access</h1>
            </div>
            <p className="page-subtitle">Sign in to manage visitor requests.</p>
            <form className="card staff-login-card" onSubmit={submitLogin}>
              <div className="form-grid-single">
                <div className="field-group">
                  <label className="field-label" htmlFor="staff_email">Email</label>
                  <input
                    id="staff_email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={onChange}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="staff_password">Password</label>
                  <input
                    id="staff_password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={onChange}
                    autoComplete="current-password"
                    minLength={8}
                    required
                  />
                </div>
                <div className="field-group">
                  <button type="submit" disabled={isSubmitting} className="login-submit-btn">
                    {isSubmitting ? 'Authenticating...' : 'Login'}
                  </button>
                </div>
              </div>
              {error && <p className="error">{error}</p>}
            </form>
          </section>
        </div>
      </div>
      {toast && <div className="toast toast-success">{toast}</div>}
    </div>
  );
}
