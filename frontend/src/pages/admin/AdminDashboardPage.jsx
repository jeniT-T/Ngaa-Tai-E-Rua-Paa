// frontend/src/pages/admin/AdminDashboardPage.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <p className="mb-4">Welcome, {user?.name}. Manage marae content from here.</p>
      <Link to="/admin/users" className="underline">
        Manage users &amp; roles →
      </Link>
      {/* TODO: content management UI */}
    </div>
  );
}