import { Link } from 'react-router-dom';
import { useTasks } from '../context/TaskContext.jsx';

function toLocalDateString(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const URGENCY_STYLES = {
  high: { background: '#fee2e2', color: '#b91c1c' },
  medium: { background: '#fef3c7', color: '#92400e' },
  low: { background: '#e0f2fe', color: '#075985' },
};

export default function UpcomingTasksPanel() {
  const { tasks, loading } = useTasks();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const todayStr = toLocalDateString(today);
  const tomorrowStr = toLocalDateString(tomorrow);

  const upcoming = (tasks || [])
    .filter((t) => !t.completed && (t.date === todayStr || t.date === tomorrowStr))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

  if (loading) return null;

  return (
    <div className="flex flex-col items-start gap-3 p-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Upcoming Tasks</h2>

      {upcoming.length === 0 ? (
        <p className="text-gray-600 leading-relaxed">Nothing due today or tomorrow.</p>
      ) : (
        <ul className="space-y-2 w-full">
          {upcoming.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={URGENCY_STYLES[task.urgency] || URGENCY_STYLES.medium}
                >
                  {task.date === todayStr ? 'Today' : 'Tomorrow'}
                </span>
                <span className="text-sm text-gray-800">{task.title}</span>
              </div>
              {task.startTime && <span className="text-xs text-gray-400">{task.startTime}</span>}
            </li>
          ))}
        </ul>
      )}

      {/* Positioned exactly like the "Open →" link on every other tile
          (mt-auto pushes it to the bottom of the card). */}
      <Link to="/caretaker/schedule" className="mt-auto pt-2 text-sm font-medium" style={{ color: '#0081bd' }}>
        View schedule →
      </Link>
    </div>
  );
}
