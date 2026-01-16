import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ClassesPage from './pages/ClassesPage';
import AttendancePage from './pages/AttendancePage';
import FaceAttendancePage from './pages/FaceAttendancePage';
import FaceRegistrationPage from './pages/FaceRegistrationPage';
import { logger } from './utils/logger';

// Role-based route protection
const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Required role: {allowedRoles.join(' or ')}</p>
        </div>
      </div>
    );
  }

  return children;
};

// Restore session on app load
function SessionRestorer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const user = {
            id: data.id || data.user?.id,
            firstName: data.firstName || data.user?.firstName,
            lastName: data.lastName || data.user?.lastName,
            name: `${data.firstName || data.user?.firstName || ''} ${data.lastName || data.user?.lastName || ''}`.trim(),
            email: data.email || data.user?.email,
            role: data.role || data.user?.role,
          };
          dispatch({ type: 'LOGIN', payload: user });
          logger.info('Session restored', { userId: user.id });
        } else {
          // Token is invalid or expired
          localStorage.removeItem('auth_token');
          logger.info('Session expired, clearing token');
        }
      } catch (error) {
        logger.error('Session restore error', { error });
        localStorage.removeItem('auth_token');
      }
    };

    restoreSession();
  }, [dispatch]);

  return null;
}

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SessionRestorer />
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes - all authenticated users */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Classes - all authenticated users can view */}
          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <ClassesPage />
              </ProtectedRoute>
            }
          />

          {/* Attendance - teachers and admins only */}
          <Route
            path="/attendance/:classId"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />

          {/* Face Attendance - students can mark their attendance */}
          <Route
            path="/face-attendance"
            element={
              <ProtectedRoute>
                <FaceAttendancePage />
              </ProtectedRoute>
            }
          />

          {/* Face Registration - any authenticated user can register their face */}
          <Route
            path="/face-registration"
            element={
              <ProtectedRoute>
                <FaceRegistrationPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-gray-600">
        <p>&copy; {new Date().getFullYear()} Face Attendance System</p>
      </footer>
    </div>
  );
}

export default App;