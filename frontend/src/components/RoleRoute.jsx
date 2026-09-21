
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wrap any <Route element={...}> with this to restrict it by role.
// Usage:
//   <Route path="/admin" element={<RoleRoute allowed={['admin']}><AdminDashboardPage /></RoleRoute>} />
export default function RoleRoute({ allowed, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // Remember where the user was trying to go, so login can send them back
  // here afterwards instead of dropping them on a generic page.
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowed.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}