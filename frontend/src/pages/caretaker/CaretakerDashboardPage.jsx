// frontend/src/pages/caretaker/CaretakerDashboardPage.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AVAILABLE_LINKS = [
  { to: '/caretaker/schedule', title: 'Task Schedule', description: 'View upcoming scheduled tasks for today.' },
  { to: '/caretaker/tutorials', title: 'Tutorials', description: 'Guides on caring for the marae.' },
  { to: '/checklists', title: 'Checklists', description: 'View the opening & closing checklists.' },
];

export default function CaretakerDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="px-6 py-16 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Caretaker Dashboard</h1>
      <p className="text-gray-600 mb-10">Kia ora, {user?.name}. Manage marae upkeep from here.</p>

      {/* Stacked one on top of the other, per request — not a grid. */}
      <div className="flex flex-col gap-6 max-w-md">
        {AVAILABLE_LINKS.map(({ to, title, description }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-start gap-3 p-8 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
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
