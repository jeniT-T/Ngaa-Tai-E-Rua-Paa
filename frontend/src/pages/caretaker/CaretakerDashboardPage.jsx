// frontend/src/pages/caretaker/CaretakerDashboardPage.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Planned features — not implemented yet, shown as placeholders.
const PLANNED_FEATURES = [
  {
    icon: '✅',
    title: 'Task Manager',
    description: 'Add, edit and delete caretaker tasks.',
  },
  {
    icon: '📦',
    title: 'Equipment Inventory',
    description: 'See what equipment is available and its condition/location.',
  },
  {
    icon: '🗓️',
    title: 'Upcoming Task Schedule',
    description: 'View and plan upcoming scheduled tasks.',
  },
  {
    icon: '📆',
    title: 'Holiday Calendar',
    description: 'Check which public holidays fall in the coming weeks.',
  },
];

// Existing caretaker pages the dashboard can link to today.
const AVAILABLE_LINKS = [
  { to: '/caretaker/checklists', icon: '📝', title: 'Checklists', description: 'Existing caretaker checklists.' },
  { to: '/caretaker/tutorials', icon: '🎓', title: 'Tutorials', description: 'Guides on caring for the marae.' },
];

export default function CaretakerDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="px-6 py-16 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Caretaker Dashboard</h1>
      <p className="text-gray-600 mb-10">Kia ora, {user?.name}. Manage marae upkeep from here.</p>

      <div className="grid gap-6 md:grid-cols-2 mb-10">
        {AVAILABLE_LINKS.map(({ to, icon, title, description }) => (
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

      <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming soon</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {PLANNED_FEATURES.map(({ icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col items-start gap-3 p-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 opacity-75"
          >
            <span className="text-4xl">{icon}</span>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600 leading-relaxed">{description}</p>
            <span className="mt-auto pt-2 text-sm font-medium text-gray-400">Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}
