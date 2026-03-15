index-B_Y1J4qs.js:1 Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html". Strict MIME type checking is enforced for module scripts per HTML spec.import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (user) return null;

  return (
    <nav className={`top-nav ${mobileOpen ? 'is-open' : ''}`}>
      <div className="top-nav-inner">
        <NavLink to="/" className="brand">
          Smart Appointments
        </NavLink>
        <button
          className="nav-hamburger"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="top-nav-links">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Home
          </NavLink>
          <NavLink to="/staff/login" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Staff Login
          </NavLink>
          <NavLink to="/admin/signup" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Admin Signup
          </NavLink>
        </div>
      </div>
      <div className={`top-nav-mobile ${mobileOpen ? 'open' : ''}`}>
        <NavLink to="/" onClick={() => setMobileOpen(false)} className="nav-link">
          Home
        </NavLink>
        <NavLink to="/staff/login" onClick={() => setMobileOpen(false)} className="nav-link">
          Staff Login
        </NavLink>
        <NavLink to="/admin/signup" onClick={() => setMobileOpen(false)} className="nav-link">
          Admin Signup
        </NavLink>
      </div>
    </nav>
  );
}
