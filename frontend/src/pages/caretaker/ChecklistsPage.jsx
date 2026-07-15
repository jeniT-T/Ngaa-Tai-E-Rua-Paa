import { useAuth } from '../../context/AuthContext';

export default function ChecklistsPage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Caretaker Checklists</h1>
      <p>Kia ora {user?.name}, here are your tasks.</p>
      {/* TODO: checklist items, use ChecklistItem.jsx component */}
    </div>
  );
}