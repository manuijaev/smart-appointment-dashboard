import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import StaffLoginPage from './pages/StaffLoginPage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminSignupPage from './pages/AdminSignupPage';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

function roleHomePath(user) {
  return user?.role === 'Admin' ? '/admin/dashboard' : '/staff/dashboard';
}

function ProtectedRoute({ children, roles, loginPath = '/staff/login' }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={loginPath} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to={roleHomePath(user)} replace />;
  return children;
}

function HomeRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to={roleHomePath(user)} replace />;
  return <HomePage />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route
          path="/staff/login"
          element={
            <PublicOnlyRoute>
              <StaffLoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/admin/signup"
          element={
            <PublicOnlyRoute>
              <AdminSignupPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute roles={['Staff', 'Admin']}>
              <StaffDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['Admin']} loginPath="/staff/login">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
