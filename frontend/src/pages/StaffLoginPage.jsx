import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { registerDevice } = useNotification();
  const [mode, setMode] = useState('login');
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    department: '',
    division: '',
  });
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get('/departments/').then(({ data }) => setDepartments(data)).catch(() => {});
  }, []);

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

  useEffect(() => {
    if (!form.department || mode !== 'signup') {
      setDivisions([]);
      return;
    }
    api.get(`/divisions/?department_id=${form.department}`).then(({ data }) => setDivisions(data)).catch(() => {});
  }, [form.department, mode]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === 'department') {
      setForm((prev) => ({ ...prev, department: value, division: '' }));
      return;
    }
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
      setToast('Login successful. Redirecting...');
      setTimeout(() => navigateByRole(user), 650);
    } catch (err) {
      setError(extractErrorMessage(err, 'Invalid credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitSignup = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/staff/register/', {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        department: form.department || null,
        division: form.division || null,
        role: 'Staff',
      });
      const user = await login(form.email, form.password);
      await tryRegisterDevice();
      setToast('Account created and login successful. Redirecting...');
      setTimeout(() => navigateByRole(user), 700);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to sign up. Check your inputs and try again.'));
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
              Log in to respond quickly, update appointment statuses, and communicate with visitors from one central dashboard.
            </p>
          </section>
          <section className="auth-panel">
            <div className="hero">
              <h1>Staff Access</h1>
            </div>
            <p className="page-subtitle">Sign in to manage appointments or create a new staff profile.</p>
            <form className="card" onSubmit={mode === 'login' ? submitLogin : submitSignup}>
              <div className="mode-switch">
                <button
                  type="button"
                  className={mode === 'login' ? 'mode-btn active' : 'mode-btn'}
                  onClick={() => setMode('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={mode === 'signup' ? 'mode-btn active' : 'mode-btn'}
                  onClick={() => setMode('signup')}
                >
                  Sign Up
                </button>
              </div>

              <div className="form-grid">
                {mode === 'signup' && (
                  <div className="field-group full">
                    <label className="field-label" htmlFor="full_name">Full Name</label>
                    <input
                      id="full_name"
                      name="full_name"
                      placeholder="Full Name"
                      value={form.full_name}
                      onChange={onChange}
                      required
                    />
                  </div>
                )}
                <div className="field-group">
                  <label className="field-label" htmlFor="staff_email">Email</label>
                  <input
                    id="staff_email"
                    name="email"
                    type="email"
                    placeholder="Email"
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
                    placeholder="Password"
                    value={form.password}
                    onChange={onChange}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    minLength={8}
                    required
                  />
                </div>
                {mode === 'signup' && (
                  <div className="field-group">
                    <label className="field-label" htmlFor="staff_department">Department</label>
                    <select id="staff_department" name="department" value={form.department} onChange={onChange} required>
                      <option value="">Select Department</option>
                      {departments.map((dep) => (
                        <option key={dep.id} value={dep.id}>
                          {dep.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {mode === 'signup' && (
                  <div className="field-group">
                    <label className="field-label" htmlFor="staff_division">Division</label>
                    <select
                      id="staff_division"
                      name="division"
                      value={form.division}
                      onChange={onChange}
                      required
                      disabled={!form.department}
                    >
                      <option value="">Select Division</option>
                      {divisions.map((div) => (
                        <option key={div.id} value={div.id}>
                          {div.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="field-group full">
                  <button type="submit" disabled={isSubmitting}>
                    {mode === 'login'
                      ? isSubmitting
                        ? 'Authenticating...'
                        : 'Login'
                      : isSubmitting
                      ? 'Creating account...'
                      : 'Create Account'}
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
