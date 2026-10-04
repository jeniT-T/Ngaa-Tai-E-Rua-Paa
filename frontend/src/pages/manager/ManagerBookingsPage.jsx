import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import GuestAccessShare from "../../components/GuestAccessShare.jsx";
import StarRating from "../../components/StarRating.jsx";
import { isBookingComplete } from "../../utils/bookingStatus.js";
import useSiteSettings from "../../hooks/useSiteSettings.js";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

function toDateLabel(dateString) {
  return dateString ? String(dateString).slice(0, 10) : "";
}

function ManagerGuestReviewPanel({ bookingId }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleOpen() {
    setOpen(true);
    if (loaded) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/review`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load review");
      if (data.review) {
        setRating(data.review.manager_rating || 0);
        setNotes(data.review.manager_notes || "");
        setSavedAt(data.review.manager_reviewed_at || null);
      }
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!rating) {
      setError("Pick a star rating first.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/manager-review`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save review");
      setSavedAt(data.review.manager_reviewed_at);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={handleOpen} className="text-sm border rounded px-3 py-1.5 mt-2">
        Review this guest (private)
      </button>
    );
  }

  return (
    <div className="mt-3 border-t pt-3 space-y-2">
      <p className="text-xs text-gray-500">
        Only you and other managers can see this — the guest never will.
      </p>
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            placeholder="How good a guest were they? Any notes for next time..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border rounded px-2 py-1 text-sm"
          />
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-sm border rounded px-3 py-1.5"
            >
              {saving ? "Saving..." : "Save review"}
            </button>
            {savedAt && <span className="text-xs text-gray-400">Saved</span>}
            <button type="button" onClick={() => setOpen(false)} className="text-sm underline text-gray-500">
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ManagerBookingsPage() {
  const { settings } = useSiteSettings();
  const typeLabels = Object.fromEntries(settings.booking_types.map((t) => [t.value, t.label]));
  const areaLabels = Object.fromEntries(settings.booking_areas.map((a) => [a.value, a.label]));

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notesDraft, setNotesDraft] = useState({}); // { [bookingId]: text }

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/bookings`, { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load bookings");
        if (!cancelled) setBookings(data.bookings);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
      <div className="flex justify-between items-start gap-4 mb-2">
        <h1 className="text-2xl font-semibold">Booking Requests</h1>
        <Link
          to="/manager/bookings/new"
          className="flex justify-center items-center text-sm border rounded px-10 py-2 whitespace-nowrap"
        >
          + New booking for a customer
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Review, approve, or deny booking requests. The requester gets emailed automatically
        when you make a decision.
      </p>

      {/* Generic, non-booking-specific guest access*/}
      <div className="border rounded-lg p-4 mb-6 bg-gray-50">
        <h2 className="text-sm font-semibold mb-1">Guest access for signage</h2>
        <p className="text-xs text-gray-600 mb-2">
          A single link/QR code you can print and post physically around the marae — works
          for any guest while there's a current stay, no per-booking setup needed.
        </p>
        <GuestAccessShare
          url={`${window.location.origin}/arrival/guest`}
          buttonLabel="Get the guest access QR code"
          description="Anyone who scans this while a booking is currently active can view the marae guide, checklists and tutorials — no account needed. Not tied to any one booking, so it's safe to print and leave up permanently."
        />
      </div>

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
                    {typeLabels[booking.booking_type] || booking.booking_type} ·{" "}
                    {areaLabels[booking.area] || booking.area}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${STATUS_STYLES[booking.status]}`}>
                  {booking.status}
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">{booking.purpose}</p>

              {settings.whakapapa_question_enabled && (
                <p className="text-xs text-gray-500 mb-3">
                  {settings.whakapapa_question_label}{" "}
                  <span className="font-medium">{booking.whakapapa ? "Yes" : "No"}</span>
                </p>
              )}

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
                      className="btn btn-success btn-success-action btn-compact"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decide(booking.id, "denied")}
                      className="btn btn-error btn-danger-action btn-compact"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              )}

              {booking.status === "approved" && (
                <div className="mt-2">
                  <GuestAccessShare token={booking.guest_access_token} />
                </div>
              )}

              {isBookingComplete(booking) && <ManagerGuestReviewPanel bookingId={booking.id} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
