import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

const CHECKLIST_ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'caretaker', label: 'Caretaker' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
];
const DEFAULT_ASSIGNED_ROLES = CHECKLIST_ROLES.map(({ value }) => value);

function RoleAssignmentFields({ assignedRoles, onChange }) {
  function toggleRole(role, checked) {
    onChange(
      checked
        ? [...new Set([...assignedRoles, role])]
        : assignedRoles.filter((assignedRole) => assignedRole !== role)
    );
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Assign to user types</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {CHECKLIST_ROLES.map(({ value, label }) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={assignedRoles.includes(value)}
              onChange={(e) => toggleRole(value, e.target.checked)}
              className="h-4 w-4"
            />
            {label}
          </label>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Choose one or more roles. Existing checklists are assigned to all roles by default.
      </p>
    </fieldset>
  );
}

function NewChecklistForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemsText, setItemsText] = useState('');
  const [assignedRoles, setAssignedRoles] = useState(DEFAULT_ASSIGNED_ROLES);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const items = itemsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const res = await fetch(`${API_BASE}/checklists`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, assignedRoles, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checklist');

      onCreated(data.checklist);
      setTitle('');
      setDescription('');
      setItemsText('');
      setAssignedRoles(DEFAULT_ASSIGNED_ROLES);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded p-4 mb-10 space-y-3">
      <h2 className="text-lg font-medium">New checklist</h2>
      {error && <p className="text-red-600">{error}</p>}
      <input
        type="text"
        placeholder="Title (e.g. Opening, Closing, Toilets & Disability)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full border rounded px-3 py-2"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full border rounded px-3 py-2"
      />
      <RoleAssignmentFields assignedRoles={assignedRoles} onChange={setAssignedRoles} />
      <textarea
        placeholder={'Checklist items, one per line, e.g.\nSweep outside toilets\nEmpty rubbish bin'}
        value={itemsText}
        onChange={(e) => setItemsText(e.target.value)}
        rows={5}
        className="w-full border rounded px-3 py-2"
      />
      <button
        type="submit"
        disabled={saving}
        className="btn btn-primary btn-action"
      >
        {saving ? 'Creating...' : 'Create checklist'}
      </button>
    </form>
  );
}

function AddItemRow({ checklistId, onAdded }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/checklists/${checklistId}/items`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) {
        onAdded(data.checklist);
        setText('');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
      <input
        type="text"
        placeholder="Add an item..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 border rounded px-3 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={saving}
        className="btn btn-primary btn-action"
      >
        Add
      </button>
    </form>
  );
}

function ChecklistCard({ checklist, onChange }) {
  const { user, isChecklistItemChecked, setChecklistItemChecked } = useAuth();
  const progressScope = `user:${user?.id}`;
  const isChecked = (item) => isChecklistItemChecked(progressScope, checklist.id, item.id);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(checklist.title);
  const [description, setDescription] = useState(checklist.description || '');
  const [assignedRoles, setAssignedRoles] = useState(checklist.assigned_roles || DEFAULT_ASSIGNED_ROLES);

  async function deleteItem(itemId) {
    const res = await fetch(`${API_BASE}/checklists/${checklist.id}/items/${itemId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (res.ok) onChange(data.checklist);
  }

  async function saveDetails(e) {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/checklists/${checklist.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, assignedRoles }),
    });
    const data = await res.json();
    if (res.ok) {
      onChange(data.checklist);
      setEditing(false);
    }
  }

  async function deleteChecklist() {
    const res = await fetch(`${API_BASE}/checklists/${checklist.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok || res.status === 204) onChange(null, checklist.id);
  }

  const doneCount = checklist.items.filter(isChecked).length;

  return (
    <div className="border rounded-2xl p-6 bg-white shadow-sm">
      {editing ? (
        <form onSubmit={saveDetails} className="space-y-2 mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2 font-semibold"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <RoleAssignmentFields assignedRoles={assignedRoles} onChange={setAssignedRoles} />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-action">
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm border rounded px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{checklist.title}</h2>
            {checklist.description && (
              <p className="text-gray-600 text-sm mt-1">{checklist.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {doneCount}/{checklist.items.length} done
              {checklist.created_by_name ? ` · created by ${checklist.created_by_name}` : ''}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Assigned to: {assignedRoles
                .map((role) => CHECKLIST_ROLES.find((option) => option.value === role)?.label || role)
                .join(', ')}
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button onClick={() => setEditing(true)} className="text-sm" style={{ color: 'var(--primary)' }}>
              Edit
            </button>
            <button onClick={deleteChecklist} className="text-sm text-red-600">
              Delete
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {checklist.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <label className="checklist-item-label flex-1">
            <input
              type="checkbox"
              aria-label={item.text}
              checked={isChecked(item)}
              onChange={(event) => setChecklistItemChecked(progressScope, checklist.id, item.id, event.target.checked)}
              className="h-4 w-4"
            />
            <span className={`flex-1 text-sm ${isChecked(item) ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {item.text}
            </span>
            </label>
            <button onClick={() => deleteItem(item.id)} className="text-xs text-gray-400 hover:text-red-600">
              Remove
            </button>
          </li>
        ))}
        {checklist.items.length === 0 && (
          <li className="text-sm text-gray-400">No items yet.</li>
        )}
      </ul>

      <AddItemRow checklistId={checklist.id} onAdded={onChange} />
    </div>
  );
}

export default function ChecklistsPage() {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChecklists();
  }, []);

  async function loadChecklists() {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/checklists`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load checklists');
      const data = await res.json();
      setChecklists(data.checklists);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleChecklistChange(updated, deletedId) {
    setChecklists((prev) => {
      if (deletedId) return prev.filter((c) => c.id !== deletedId);
      return prev.map((c) => (c.id === updated.id ? updated : c));
    });
  }

  function handleCreated(newChecklist) {
    setChecklists((prev) => [newChecklist, ...(prev || [])]);
  }

  return (
    <div className="px-6 py-16 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Checklists</h1>
      <p className="text-gray-600 mb-10">
        Kia ora {user?.name}, create and manage the checklists for your own tasks.
      </p>

      {error && <p className="text-red-600 mb-6">{error}</p>}

      <NewChecklistForm onCreated={handleCreated} />

      {checklists === null ? (
        <p>Loading checklists...</p>
      ) : checklists.length === 0 ? (
        <p className="text-gray-500">No checklists yet — create your first one above.</p>
      ) : (
        <div className="space-y-6">
          {checklists.map((checklist) => (
            <ChecklistCard key={checklist.id} checklist={checklist} onChange={handleChecklistChange} />
          ))}
        </div>
      )}
    </div>
  );
}
