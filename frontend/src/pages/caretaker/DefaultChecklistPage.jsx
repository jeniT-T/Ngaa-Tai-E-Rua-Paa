import { useEffect, useState } from 'react';
const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

export default function DefaultChecklistPage() {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    fetch(`${API_BASE}/checklists/default-template`, { credentials: 'include' })
      .then(async (res) => { const data = await res.json(); if (!res.ok) throw new Error(data.error); return data; })
      .then((data) => setBody(data.checklist.body))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
  async function save() {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch(`${API_BASE}/checklists/default-template`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      setBody(data.checklist.body);
      setSaved(true);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Default Cleaning & Checkout Checklist</h1>
      <p className="mb-6 text-gray-600">Edit one step per line. Saved changes update the default checklist for future approved bookings. Existing booking checklists keep their own steps.</p>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {loading ? <p>Loading...</p> : (
        <section className="border rounded p-4 mb-4">
          <label htmlFor="default-checklist" className="font-semibold mb-2">Checklist</label>
          <textarea id="default-checklist" rows={22} value={body} disabled={saving}
            onChange={(event) => { setBody(event.target.value); setSaved(false); }} />
          <button type="button" className="btn btn-primary btn-compact mt-3" disabled={saving} onClick={save}>
            {saving ? 'Saving...' : 'Save checklist'}
          </button>
          {saved && <p role="status" className="text-green-700">Checklist saved.</p>}
        </section>
      )}
    </div>
  );
}
