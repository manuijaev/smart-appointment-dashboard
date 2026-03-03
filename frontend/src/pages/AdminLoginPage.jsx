import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const flash = sessionStorage.getItem('app_toast');
    if (flash) {
      setToast(flash);
      sessionStorage.removeItem('app_toast');
      setTimeout(() => setToast(''), 2500);
    }
  }, []);

  useEffect(() => {
    document.body.classList.add('auth-background');
    return () => {
      document.body.classList.remove('auth-background');
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setToast('');
    setIsAuthenticating(true);
    try {
      const user = await login(email, password);
      const role = String(user?.role || '').toLowerCase();
      if (role !== 'admin') {
        logout();
        setError('Admin access only.');
        setIsAuthenticating(false);
        return;
      }
      setToast('Login successful. Redirecting to admin dashboard...');
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 700);
    } catch {
      setError('Invalid admin credentials.');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-shell">
        <div className="auth-wrap">
          <section className="auth-hero admin-control-hero">
            <span className="auth-badge">Admin Control</span>
            <h2>Secure Operations Hub</h2>
            <p>
              Access the command center to manage staff, departments, and division structures with precision.
            </p>
          </section>
          <section className="auth-panel">
            <div className="hero">
              <h1>Admin Login</h1>
            </div>
            <p className="page-subtitle">Authenticate to continue to the protected admin dashboard.</p>
            <form className="card" onSubmit={submit}>
              <div className="form-grid">
                <div className="field-group full">
                  <label className="field-label" htmlFor="admin_email">Email</label>
                  <input
                    id="admin_email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="field-group full">
                  <label className="field-label" htmlFor="admin_password">Password</label>
                  <input
                    id="admin_password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="field-group full">
                  <button type="submit" disabled={isAuthenticating}>
                    {isAuthenticating ? 'Authenticating...' : 'Login'}
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
