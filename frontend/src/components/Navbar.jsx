import { NavLink } from 'react-router-dom';

export default function Navbar() {
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
          <NavLink
            to="/admin/signup"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Admin Sign Up
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
