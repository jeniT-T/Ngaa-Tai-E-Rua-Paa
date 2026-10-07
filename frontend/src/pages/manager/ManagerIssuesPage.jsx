import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

const STATUS_STYLES = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};

export default function ManagerIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notesDraft, setNotesDraft] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [savedId, setSavedId] = useState(null);

  useEffect(() => {
  async function loadIssues() {
    try {
      const res = await fetch(`${API_BASE}/issues`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load issues");
      setIssues(data.issues);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
    loadIssues();
  }, []);

  async function updateStatus(id, status, completionNotes) {
    setError("");
    setBusyId(id);
    setSavedId(null);
    try {
      const res = await fetch(`${API_BASE}/issues/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, completionNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update issue");
      if (completionNotes !== undefined) setSavedId(id);
      setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, ...data.issue } : i)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteIssue(issue) {
    if (!window.confirm(`Permanently delete the reported issue "${issue.subject}"? This cannot be undone.`)) return;
    setError("");
    setBusyId(issue.id);
    try {
      const res = await fetch(`${API_BASE}/issues/${issue.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete issue');
      }
      setIssues((previous) => previous.filter((item) => item.id !== issue.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Reported Issues</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : issues.length === 0 ? (
        <p className="text-gray-500">No issues reported.</p>
      ) : (
        <ul className="space-y-3">
          {issues.map((issue) => (
            <li key={issue.id} className="border rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{issue.subject}</p>
                  <p className="text-sm text-gray-500">
                    {issue.reporter_name} · <a href={`mailto:${issue.reporter_email}`}>{issue.reporter_email}</a>
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${STATUS_STYLES[issue.status]}`}>
                  {{ open: "Open", in_progress: "In Progress", resolved: "Resolved" }[issue.status] || issue.status}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">{issue.message}</p>
              <select
                aria-label={`Status for ${issue.subject}`}
                disabled={busyId !== null}
                value={issue.status}
                onChange={(e) => updateStatus(issue.id, e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <label htmlFor={`notes-${issue.id}`} className="mt-3">Completion notes</label>
              <textarea
                id={`notes-${issue.id}`}
                rows={3}
                placeholder="Describe the work completed or how the issue was resolved..."
                value={notesDraft[issue.id] ?? issue.completion_notes ?? ''}
                onChange={(e) => { setNotesDraft({ ...notesDraft, [issue.id]: e.target.value }); setSavedId(null); }}
                disabled={busyId !== null}
              />
              <div className="flex flex-wrap gap-2 mt-3 items-center">
                <button type="button" className="btn btn-primary btn-compact" disabled={busyId !== null}
                  onClick={() => updateStatus(issue.id, undefined, notesDraft[issue.id] ?? issue.completion_notes ?? '')}>Save notes</button>
                <button type="button" className="btn btn-error btn-danger-action btn-compact" disabled={busyId !== null}
                  onClick={() => deleteIssue(issue)}>Delete issue</button>
                {busyId === issue.id && <span role="status">Saving...</span>}
                {savedId === issue.id && <span role="status" className="text-green-700">Notes saved</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
