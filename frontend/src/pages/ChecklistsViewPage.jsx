
import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

export default function ChecklistsViewPage() {
  const { user } = useAuth();
  const { token: guestToken } = useParams();
  const location = useLocation();
  // Reachable four ways now (see App.jsx and §24): from the caretaker
  // dashboard (caretaker/admin), from the Marae Guide (a member with an
  // active booking), and from either guest route (per-booking token, or
  // the generic site-wide QR) -- guests have no `user` at all, so that's
  // detected from the URL instead.
  const isGuest = location.pathname.startsWith("/checklists/guest");
  const [checklists, setChecklists] = useState(null);
  const [error, setError] = useState("");

  const isCaretakerStaff = user?.role === "caretaker" || user?.role === "admin";
  const backTo = isCaretakerStaff
    ? "/caretaker"
    : isGuest
      ? (guestToken ? `/arrival/guest/${guestToken}` : "/arrival/guest")
      : "/arrival";
  const backLabel = isCaretakerStaff ? "← Back to Caretaker Dashboard" : "← Back to Marae Guide";

  useEffect(() => {
    const url = isGuest
      ? (guestToken ? `${API_BASE}/checklists/guest/${guestToken}` : `${API_BASE}/checklists/guest-active`)
      : `${API_BASE}/checklists`;
    fetch(url, isGuest ? undefined : { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load checklists");
        setChecklists(data.checklists);
      })
      .catch((err) => setError(err.message));
  }, [isGuest, guestToken]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-start gap-4 mb-2">
        <h1 className="text-2xl font-semibold">Opening &amp; Closing Checklists</h1>
        <Link to={backTo} className="text-sm underline whitespace-nowrap">
          {backLabel}
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
