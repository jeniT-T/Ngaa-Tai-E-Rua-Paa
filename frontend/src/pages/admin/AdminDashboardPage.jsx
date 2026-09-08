// frontend/src/pages/admin/AdminDashboardPage.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const FEATURES = [
  {
    to: '/admin/content',
    icon: '📝',
    title: 'Content Manager',
    description: 'Add, edit, move, copy or delete content anywhere on the site, including public pages.',
  },
  {
    to: '/admin/bookings',
    icon: '📅',
    title: 'Booking Requests',
    description: 'Review pending booking requests and approve or deny them.',
  },
  {
    to: '/admin/users',
    icon: '👥',
    title: 'Manage Users & Roles',
    description: "View registered users and change a person's role.",
  },
  {
    to: '/admin/issues',
    icon: '🛠️',
    title: 'Reported Issues',
    description: 'See issues reported by users and track what still needs attention.',
  },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="px-6 py-16 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-10">Welcome, {user?.name}. Manage marae content from here.</p>

      <div className="grid gap-6 md:grid-cols-2">
        {FEATURES.map(({ to, icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-start gap-3 p-8 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <span className="text-4xl">{icon}</span>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600 leading-relaxed">{description}</p>
            <span className="mt-auto pt-2 text-sm font-medium" style={{ color: '#0081bd' }}>
              Open →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
