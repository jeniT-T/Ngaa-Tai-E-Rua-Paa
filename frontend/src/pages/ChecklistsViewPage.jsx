
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

export default function ChecklistsViewPage() {
  const [checklists, setChecklists] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/checklists`, { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load checklists");
        setChecklists(data.checklists);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-start gap-4 mb-2">
        <h1 className="text-2xl font-semibold">Opening &amp; Closing Checklists</h1>
        <Link to="/caretaker" className="text-sm underline whitespace-nowrap">
          ← Back to Caretaker Dashboard
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        What the caretaker team follows to open and close up — useful to know what's expected
        during your stay.
      </p>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!checklists ? (
        <p>Loading...</p>
      ) : checklists.length === 0 ? (
        <p className="text-gray-500">No checklists have been added yet.</p>
      ) : (
        <div className="space-y-3">
          {checklists.map((checklist) => (
            <details key={checklist.id} className="border rounded-xl p-4">
              <summary className="text-lg font-semibold cursor-pointer select-none">
                {checklist.title}
              </summary>
              {checklist.description && (
                <p className="text-sm text-gray-600 mt-2 mb-3">{checklist.description}</p>
              )}
              <ul className="space-y-1.5 mt-3">
                {checklist.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    <span
                      aria-hidden="true"
                      className="mt-0.5"
                      style={{ color: item.is_done ? "#1b5e20" : "#999" }}
                    >
                      {item.is_done ? "✓" : "○"}
                    </span>
                    <span className={item.is_done ? "text-gray-400 line-through" : "text-gray-700"}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
