// frontend/src/pages/ReportIssuePage.jsx
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function ReportIssuePage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/issues`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");

      setSuccess(true);
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Contact Management</h1>
      <p className="text-gray-600 mb-6">
        Report an issue or ask a question — this goes directly to the marae management team.
      </p>

      {success && (
        <p className="mb-4 text-green-700 bg-green-50 border border-green-200 rounded p-3">
          Thanks — your message has been sent to management.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
        <textarea
          placeholder="Describe the issue..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className="w-full border rounded px-3 py-2"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
