
import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

export default function ChecklistsViewPage() {
  const { user, isChecklistItemChecked, setChecklistItemChecked } = useAuth();
  const { token: guestToken } = useParams();
  const location = useLocation();
  // Reachable four ways now (see App.jsx and §24): from the caretaker
  // dashboard (caretaker/admin), from the Marae Guide (a member with an
  // active booking), and from either guest route (per-booking token, or
  // the generic site-wide QR) -- guests have no `user` at all, so that's
  // detected from the URL instead.
  const isGuest = location.pathname.startsWith("/checklists/guest");
  const [bookingId, setBookingId] = useState("");
  const [bookings, setBookings] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [recordsLoadedFor, setRecordsLoadedFor] = useState("");
  const progressScope = isGuest ? `guest:${guestToken || "active"}` : `user:${user?.id}:booking:${bookingId}`;
  const [checklists, setChecklists] = useState(null);
  const [error, setError] = useState("");

  const isCaretakerStaff = user?.role === "caretaker" || user?.role === "admin";
  const isManager = user?.role === "manager";
  const backTo = isCaretakerStaff
    ? "/caretaker"
    : isManager
      ? "/manager"
    : isGuest
      ? (guestToken ? `/arrival/guest/${guestToken}` : "/arrival/guest")
      : "/arrival";
  const backLabel = isCaretakerStaff
    ? "← Back to Caretaker Dashboard"
    : isManager
      ? "← Back to Manager Dashboard"
      : "← Back to Marae Guide";

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

  useEffect(() => {
    if (isGuest) return;
    let cancelled = false;
    fetch(`${API_BASE}/checklists/completion-bookings`, { credentials: 'include' })
      .then(async (res) => { const data = await res.json(); if (!res.ok) throw new Error(data.error); return data; })
      .then((data) => { if (!cancelled) { setBookings(data.bookings); setBookingId(String(data.bookings[0]?.id || '')); } })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [isGuest]);

  useEffect(() => {
    if (!bookingId || isGuest) return;
    let cancelled = false;
    fetch(`${API_BASE}/checklists/completions?bookingId=${bookingId}`, { credentials: 'include' })
      .then(async (res) => { const data = await res.json(); if (!res.ok) throw new Error(data.error); return data; })
      .then((data) => { if (!cancelled) { setCompletions(data.completions); setRecordsLoadedFor(bookingId); } })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [bookingId, isGuest]);

  async function saveCompletion(checklist) {
    setSavingId(checklist.id);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/checklists/${checklist.id}/complete`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, checkedItemIds: checklist.items.filter((item) => isChecklistItemChecked(progressScope, checklist.id, item.id)).map((item) => item.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save completion');
      setCompletions((previous) => [data.completion, ...previous]);
    } catch (err) { setError(err.message); }
    finally { setSavingId(null); }
  }

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

      {!isGuest && user?.role !== "member" && <Link to="/checklists/default" className="btn btn-outline btn-compact mb-4">Edit default cleaning checklist</Link>}
      {!isGuest && user?.role !== "member" && <Link to="/caretaker/checklists" className="btn btn-outline btn-compact mb-4">Edit checklists</Link>}
      {!isGuest && (
        <div className="mb-6">
          <label htmlFor="completion-booking">Booking for cleaning completion</label>
          <select id="completion-booking" value={bookingId} disabled={savingId !== null} onChange={(event) => setBookingId(event.target.value)}>
            <option value="">Select an approved booking</option>
            {bookings.map((booking) => <option key={booking.id} value={booking.id}>
              {booking.requester_name} · {String(booking.start_date).slice(0, 10)} → {String(booking.end_date).slice(0, 10)} · {booking.purpose}
            </option>)}
          </select>
          <p className="text-sm text-gray-500 mt-2">Check every item, then save completion to record your name and the time for this booking.</p>
        </div>
      )}

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!checklists ? (
        <p>Loading...</p>
      ) : checklists.length === 0 ? (
        <p className="text-gray-500">No checklists have been added yet.</p>
      ) : (
        <div className="space-y-3">
          {checklists.filter((checklist) => isGuest || !checklist.booking_id || String(checklist.booking_id) === bookingId).map((checklist) => (
            <details key={checklist.id} className="border rounded-xl p-4">
              <summary className="text-lg font-semibold cursor-pointer select-none">
                {checklist.title}
              </summary>
              {checklist.description && (
                <p className="text-sm text-gray-600 mt-2 mb-3">{checklist.description}</p>
              )}
              <ul className="space-y-1.5 mt-3">
                {checklist.items.map((item) => (
                  <li key={item.id} className="text-sm">
                    <label className="checklist-item-label">
                      <input
                        type="checkbox"
                        disabled={savingId !== null || (!isGuest && completions.some((record) => String(record.booking_id) === bookingId && record.checklist_id === checklist.id))}
                        checked={(!isGuest && completions.some((record) => String(record.booking_id) === bookingId && record.checklist_id === checklist.id)) || isChecklistItemChecked(progressScope, checklist.id, item.id)}
                        onChange={(event) => setChecklistItemChecked(progressScope, checklist.id, item.id, event.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0"
                      />
                      <span className={isChecklistItemChecked(progressScope, checklist.id, item.id) ? "text-gray-400 line-through" : "text-gray-700"}>
                        {item.text}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              {!isGuest && bookingId && recordsLoadedFor === bookingId && (
                <div className="mt-3">
                  {completions.some((record) => String(record.booking_id) === bookingId && record.checklist_id === checklist.id) ? (
                    <p className="text-sm text-green-700">Completion saved for this booking.</p>
                  ) : (
                    <button type="button" className="btn btn-primary btn-compact" onClick={() => saveCompletion(checklist)}
                      disabled={savingId !== null || !checklist.items.length || !checklist.items.every((item) => isChecklistItemChecked(progressScope, checklist.id, item.id))}>
                      {savingId === checklist.id ? 'Saving...' : 'Save completion'}
                    </button>
                  )}
                </div>
              )}
            </details>
          ))}
        </div>
      )}
      {!isGuest && bookingId && recordsLoadedFor === bookingId && (
        <section className="mt-6 border rounded p-4">
          <h2 className="font-semibold">Completion records</h2>
          {!completions.length ? <p>No checklists completed for this booking yet.</p> : completions.map((record) => (
            <details key={record.id} className="mt-3">
              <summary>{record.checklist_title} — {record.completed_by_name} · {new Date(record.completed_at).toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}</summary>
              <ul>{record.items.map((item) => <li key={item.id}>✓ {item.text}</li>)}</ul>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
