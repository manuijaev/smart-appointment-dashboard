import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AdminSignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    document.body.classList.add('auth-background');
    return () => {
      document.body.classList.remove('auth-background');
    };
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

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setToast('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setIsAuthenticating(true);
    try {
      await api.post('/staff/register/', {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: 'Admin',
      });

      await login(form.email, form.password);
      setToast('Admin account created. Redirecting...');
      setTimeout(() => navigate('/admin/dashboard'), 700);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to create admin account.'));
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-shell">
        <div className="auth-wrap">
          <section className="auth-hero admin-control-hero">
            <span className="auth-badge">Admin Onboarding</span>
            <h2>Create Admin Access</h2>
            <p>
              Register a new admin account to manage teams, departments, divisions, and appointments in production.
            </p>
          </section>
          <section className="auth-panel">
            <div className="hero">
              <h1>Admin Sign Up</h1>
            </div>
            <p className="page-subtitle">Create your admin profile and continue to the admin dashboard.</p>
            <form className="card" onSubmit={submit}>
              <div className="form-grid">
                <div className="field-group full">
                  <label className="field-label" htmlFor="admin_full_name">Full Name</label>
                  <input
                    id="admin_full_name"
                    name="full_name"
                    value={form.full_name}
                    onChange={onChange}
                    placeholder="Full Name"
                    required
                  />
                </div>
                <div className="field-group full">
                  <label className="field-label" htmlFor="admin_signup_email">Email</label>
                  <input
                    id="admin_signup_email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="Email"
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="admin_signup_password">Password</label>
                  <input
                    id="admin_signup_password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder="Password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="admin_confirm_password">Confirm Password</label>
                  <input
                    id="admin_confirm_password"
                    name="confirm_password"
                    type="password"
                    value={form.confirm_password}
                    onChange={onChange}
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div className="field-group full">
                  <button type="submit" disabled={isAuthenticating}>
                    {isAuthenticating ? 'Creating account...' : 'Create Admin Account'}
                  </button>
                </div>
              </div>
              {error && <p className="error">{error}</p>}
            </form>
            <div className="auth-mini-links">
              <span>Already have admin credentials?</span>
              <Link to="/admin/login" className="auth-text-link">
                Go to Admin Login
              </Link>
            </div>
          </section>
        </div>
      </div>
      {toast && <div className="toast toast-success">{toast}</div>}
    </div>
  );
}
