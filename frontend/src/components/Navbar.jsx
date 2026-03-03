import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  if (user) return null;

  return (
    <nav className="top-nav">
      <div className="top-nav-inner">
        <NavLink to="/" className="brand">
          Smart Appointments
        </NavLink>
        <div className="top-nav-links">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Home
          </NavLink>
          <NavLink to="/staff/login" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Staff Login
          </NavLink>
          <NavLink
            to="/admin/login"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Admin Login
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
