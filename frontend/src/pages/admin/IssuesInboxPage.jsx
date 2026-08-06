// frontend/src/pages/admin/IssuesInboxPage.jsx
import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const STATUS_STYLES = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};

export default function IssuesInboxPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadIssues();
  }, []);

  async function loadIssues() {
    setLoading(true);
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

  async function updateStatus(id, status) {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/issues/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update issue");
      setIssues((prev) => prev.map((i) => (i.id === id ? data.issue : i)));
    } catch (err) {
      setError(err.message);
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
                    {issue.reporter_name} · {issue.reporter_email}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${STATUS_STYLES[issue.status]}`}>
                  {issue.status}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">{issue.message}</p>
              <select
                value={issue.status}
                onChange={(e) => updateStatus(issue.id, e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
