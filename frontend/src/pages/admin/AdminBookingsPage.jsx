// frontend/src/pages/admin/AdminBookingsPage.jsx
import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const AREA_LABELS = { general: "General area", paa: "Entire Paa" };

function toDateLabel(dateString) {
  return dateString ? String(dateString).slice(0, 10) : "";
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notesDraft, setNotesDraft] = useState({}); // { [bookingId]: text }

  async function loadBookings() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bookings`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load bookings");
      setBookings(data.bookings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function decide(id, status) {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notesDraft[id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update booking");
      setBookings((prev) => prev.map((b) => (b.id === id ? data.booking : b)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Booking Requests</h1>
      <p className="text-sm text-gray-500 mb-6">
        Review, approve, or deny booking requests. The requester gets emailed automatically
        when you make a decision.
      </p>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-500">No booking requests yet.</p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <li key={booking.id} className="border rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">
                    {toDateLabel(booking.start_date)} → {toDateLabel(booking.end_date)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {booking.requester_name} · {booking.requester_email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {booking.booking_type} · {AREA_LABELS[booking.area] || booking.area}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${STATUS_STYLES[booking.status]}`}>
                  {booking.status}
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">{booking.purpose}</p>

              <p className="text-xs text-gray-500 mb-3">
                Whakapapa to the Paa: <span className="font-medium">{booking.whakapapa ? "Yes" : "No"}</span>
              </p>

              {booking.admin_notes && (
                <p className="text-xs text-gray-600 italic mb-3">
                  Current note: {booking.admin_notes}
                </p>
              )}

              {booking.status === "pending" && (
                <div className="space-y-2">
                  <textarea
                    placeholder="Optional note to include in the decision email..."
                    value={notesDraft[booking.id] ?? ""}
                    onChange={(e) =>
                      setNotesDraft((prev) => ({ ...prev, [booking.id]: e.target.value }))
                    }
                    rows={2}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => decide(booking.id, "approved")}
                      className="text-sm bg-green-600 text-white rounded px-3 py-1"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decide(booking.id, "denied")}
                      className="text-sm bg-red-600 text-white rounded px-3 py-1"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
