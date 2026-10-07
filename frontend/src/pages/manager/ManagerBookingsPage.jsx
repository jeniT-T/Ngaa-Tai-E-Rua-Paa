import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { confirmBookingConflicts } from "../../utils/bookingConflicts.js";
import GuestAccessShare from "../../components/GuestAccessShare.jsx";
import StarRating from "../../components/StarRating.jsx";
import { hasBookingEnded, isBookingComplete } from "../../utils/bookingStatus.js";
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

export default function ManagerBookingsPage({ previous = false }) {
  const { settings } = useSiteSettings();
  const typeLabels = Object.fromEntries(settings.booking_types.map((t) => [t.value, t.label]));
  const areaLabels = Object.fromEntries(settings.booking_areas.map((a) => [a.value, a.label]));

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [filters, setFilters] = useState({ customer: '', status: '', area: '', from: '', to: '' });
  const visibleBookings = bookings.filter((booking) => {
    const customer = `${booking.requester_name || ''} ${booking.requester_email || ''}`.toLowerCase();
    return hasBookingEnded(booking, now) === previous &&
      customer.includes(filters.customer.trim().toLowerCase()) &&
      (!filters.status || booking.status === filters.status) &&
      (!filters.area || booking.area === filters.area) &&
      (!filters.from || toDateLabel(booking.end_date) >= filters.from) &&
      (!filters.to || toDateLabel(booking.start_date) <= filters.to);
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

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

  async function deleteBooking(booking) {
    if (!window.confirm(`Permanently delete the booking for ${booking.requester_name} (${toDateLabel(booking.start_date)} → ${toDateLabel(booking.end_date)})? Its reviews will also be removed. This cannot be undone.`)) return;
    setError("");
    setDeletingId(booking.id);
    try {
      const res = await fetch(`${API_BASE}/bookings/${booking.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete booking");
      }
      setBookings((previousBookings) => previousBookings.filter((item) => item.id !== booking.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function decide(id, status) {
    setError("");
    setUpdatingId(id);
    try {
      if (status === 'approved') {
        const booking = bookings.find((item) => item.id === id);
        if (!await confirmBookingConflicts({ startDate: booking.start_date, endDate: booking.end_date, area: booking.area, excludeId: id })) return;
      }
      const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notesDraft[id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update booking");
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...data.booking } : b)));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-start gap-4 mb-2">
        <h1 className="text-2xl font-semibold">{previous ? "Previous Bookings" : "Booking Requests"}</h1>
        <div className="flex flex-col gap-2">
        <Link
          to="/manager/bookings/new"
          className="flex justify-center items-center text-sm border rounded px-10 py-2 whitespace-nowrap"
        >
          + New booking for a customer
        </Link>
        <Link
          to={previous ? "/manager/bookings" : "/manager/bookings/previous"}
          className="flex justify-center items-center text-sm border rounded px-10 py-2 whitespace-nowrap"
        >
          {previous ? "Current bookings" : "Previous bookings"}
        </Link>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {previous
          ? "Bookings whose end date has passed. View booking details and review previous guests."
          : "Review, approve, or deny booking requests. The requester gets emailed automatically when you make a decision."}
      </p>

      {/* Generic, non-booking-specific guest access*/}
      {!previous && <div className="border rounded-lg p-4 mb-6 bg-gray-50">
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
      </div>}

      <section className="border rounded p-4 mb-6 space-y-3" aria-label="Booking filters">
        <h2 className="font-semibold">Search and filter bookings</h2>
        <label>Customer
          <input type="search" placeholder="Name or email" value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })} />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label>Status
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              {['pending', 'approved', 'denied', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label>Area
            <select value={filters.area} onChange={(e) => setFilters({ ...filters, area: e.target.value })}>
              <option value="">All areas</option>
              {settings.booking_areas.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
            </select>
          </label>
          <label>From date<input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></label>
          <label>To date<input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></label>
        </div>
        <p className="text-sm text-gray-500">Shows bookings overlapping the selected date range.</p>
        <button type="button" className="btn btn-outline btn-compact" onClick={() => setFilters({ customer: '', status: '', area: '', from: '', to: '' })}>Clear filters</button>
      </section>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : visibleBookings.length === 0 ? (
        <p className="text-gray-500">{previous ? "No previous bookings match your filters." : "No current bookings match your filters."}</p>
      ) : (
        <ul className="space-y-4">
          {visibleBookings.map((booking) => (
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

              {!previous && booking.status === "pending" && (
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
                      disabled={updatingId !== null || deletingId !== null}
                      className="btn btn-success btn-success-action btn-compact"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decide(booking.id, "denied")}
                      disabled={updatingId !== null || deletingId !== null}
                      className="btn btn-error btn-danger-action btn-compact"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              )}

              {!previous && booking.status === "approved" && (
                <div className="mt-2">
                  <GuestAccessShare token={booking.guest_access_token} />
                </div>
              )}

              {isBookingComplete(booking) && <ManagerGuestReviewPanel bookingId={booking.id} />}
              <div className="mt-3 flex flex-wrap gap-2">
                  {!previous && booking.status !== "pending" && (
                    <button
                      type="button"
                      onClick={() => decide(booking.id, "pending")}
                      disabled={updatingId !== null || deletingId !== null}
                      className="btn btn-outline btn-action btn-compact"
                    >
                      {updatingId === booking.id ? "Updating..." : "Change status to pending"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteBooking(booking)}
                    disabled={deletingId !== null || updatingId !== null}
                    className="btn btn-error btn-danger-action btn-compact"
                  >
                    {deletingId === booking.id ? "Deleting..." : "Delete booking"}
                  </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
