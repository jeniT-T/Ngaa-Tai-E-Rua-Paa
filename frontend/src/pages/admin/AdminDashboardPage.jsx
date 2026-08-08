// frontend/src/pages/admin/AdminDashboardPage.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <p className="mb-4">Welcome, {user?.name}. Manage marae content from here.</p>
      <div className="flex flex-col gap-2 items-start">
        <Link to="/admin/content" className="underline">
          Manage content →
        </Link>
        <Link to="/admin/users" className="underline">
          Manage users &amp; roles →
        </Link>
        <Link to="/admin/issues" className="underline">
          Reported issues →
        </Link>
      </div>
    </div>
  );
}