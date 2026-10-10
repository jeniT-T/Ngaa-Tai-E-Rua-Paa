// frontend/src/pages/caretaker/EquipmentPage.jsx
//
// Equipment inventory (S36) — deliberately lean: just a name and a
// condition per item. Caretaker/admin can add, edit and remove items;
// manager (read-only here, per backend/routes/equipment.js) sees the same
// list with no write controls.
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

function NewItemForm({ onCreated }) {
  const [name, setName] = useState('');
  const [condition, setCondition] = useState('Good');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/equipment`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, condition }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add item');

      onCreated(data.item);
      setName('');
      setCondition('Good');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded p-4 mb-10 space-y-3">
      <h2 className="text-lg font-medium">Add equipment</h2>
      {error && <p className="text-red-600">{error}</p>}
      <input
        type="text"
        placeholder="Item name (e.g. Lawnmower, Extension cord)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full border rounded px-3 py-2"
      />
      <input
        type="text"
        placeholder="Condition (e.g. Good, Needs repair, Broken)"
        value={condition}
        onChange={(e) => setCondition(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />
      <button type="submit" disabled={saving} className="btn btn-primary btn-action">
        {saving ? 'Adding...' : 'Add item'}
      </button>
    </form>
  );
}

function ItemRow({ item, canManage, onChange }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [condition, setCondition] = useState(item.condition);

  async function saveDetails(e) {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/equipment/${item.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, condition }),
    });
    const data = await res.json();
    if (res.ok) {
      onChange(data.item);
      setEditing(false);
    }
  }

  async function deleteItem() {
    const res = await fetch(`${API_BASE}/equipment/${item.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok || res.status === 204) onChange(null, item.id);
  }

  if (editing) {
    return (
      <li className="border rounded-2xl p-4 bg-white shadow-sm">
        <form onSubmit={saveDetails} className="space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2 font-semibold"
          />
          <input
            type="text"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
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
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between border rounded-2xl p-4 bg-white shadow-sm">
      <div>
        <p className="font-semibold text-gray-900">{item.name}</p>
        <p className="text-sm text-gray-600">{item.condition}</p>
      </div>
      {canManage && (
        <div className="flex gap-3 shrink-0">
          <button onClick={() => setEditing(true)} className="text-sm" style={{ color: 'var(--primary)' }}>
            Edit
          </button>
          <button onClick={deleteItem} className="text-sm text-red-600">
            Delete
          </button>
        </div>
      )}
    </li>
  );
}

export default function EquipmentPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'caretaker' || user?.role === 'admin';
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  async function loadItems() {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/equipment`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load equipment');
      const data = await res.json();
      setItems(data.items);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function handleItemChange(updated, deletedId) {
    setItems((prev) => {
      if (deletedId) return prev.filter((i) => i.id !== deletedId);
      return prev.map((i) => (i.id === updated.id ? updated : i));
    });
  }

  function handleCreated(newItem) {
    setItems((prev) => [...(prev || []), newItem]);
  }

  return (
    <div className="px-6 py-16 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Equipment</h1>
      <p className="text-gray-600 mb-10">
        {canManage
          ? `Kia ora ${user?.name}, keep track of what equipment is on hand and its condition.`
          : 'What equipment is on hand and its current condition.'}
      </p>

      {error && <p className="text-red-600 mb-6">{error}</p>}

      {canManage && <NewItemForm onCreated={handleCreated} />}

      {items === null ? (
        <p>Loading equipment...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No equipment recorded yet{canManage ? ' — add the first item above.' : '.'}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} canManage={canManage} onChange={handleItemChange} />
          ))}
        </ul>
      )}
    </div>
  );
}
