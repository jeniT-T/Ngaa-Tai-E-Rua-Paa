
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wrap any <Route element={...}> with this to restrict it by role.
// Usage:
//   <Route path="/admin" element={<RoleRoute allowed={['admin']}><AdminDashboardPage /></RoleRoute>} />
export default function RoleRoute({ allowed, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}