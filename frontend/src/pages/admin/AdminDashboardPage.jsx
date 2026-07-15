import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <p>Welcome, {user?.name}. Manage marae content from here.</p>
      {/* TODO: content management UI */}
    </div>
  );
}