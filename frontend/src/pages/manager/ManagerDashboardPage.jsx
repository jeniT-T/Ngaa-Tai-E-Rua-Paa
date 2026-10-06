import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UpcomingTasksPanel from '../../components/UpcomingTasksPanel.jsx';

const FEATURES = [
  {
    to: '/manager/bookings/new',
    title: 'Make a Booking for a Customer',
    description: 'Create and approve a booking on behalf of someone who booked by phone or in person.',
  },
  {
    to: '/manager/bookings',
    title: 'Booking Requests',
    description: 'Review pending booking requests and approve or deny them.',
  },
  {
    to: '/manager/users',
    title: 'Manage Users & Roles',
    description: "View registered users, change a person's role, or create a caretaker/admin account directly.",
  },
  {
    to: '/manager/issues',
    title: 'Reported Issues',
    description: 'See issues reported by users and track what still needs attention.',
  },
  {
    to: '/checklists',
    title: 'Checklists',
    description: 'View the checklists assigned to managers.',
  },
  {
    to: '/caretaker/calendar',
    title: 'Caretaker Calendar',
    description: "The same task calendar the caretaker uses, including any marae booking that's currently on.",
  },
  {
    to: '/caretaker/equipment',
    title: 'Equipment',
    description: 'View what equipment is on hand and its condition (read-only).',
  },
];

export default function ManagerDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="px-6 py-16 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Manager Dashboard</h1>
      <p className="text-gray-600 mb-10">Welcome, {user?.name}. Manage bookings, people and issues from here.</p>

      <div className="grid gap-6 md:grid-cols-2">
        <UpcomingTasksPanel />
        {FEATURES.map(({ to, title, description }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-start gap-3 p-8 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600 leading-relaxed">{description}</p>
            <span className="mt-auto pt-2 text-sm font-medium" style={{ color: 'var(--primary)' }}>
              Open →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
