// frontend/src/pages/MyBookingsPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BookingCalendar from "../components/BookingCalendar.jsx";
import useBookingAvailability from "../hooks/useBookingAvailability.js";
import useSiteSettings from "../hooks/useSiteSettings.js";
import GuestAccessShare from "../components/GuestAccessShare.jsx";
import StarRating from "../components/StarRating.jsx";
import { isBookingComplete } from "../utils/bookingStatus.js";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

const STATUS_STYLES = {
  pending: { label: "Pending review", bg: "#fff8e1", color: "#8a6d00" },
  approved: { label: "Approved", bg: "#e8f5e9", color: "#1b5e20" },
  denied: { label: "Denied", bg: "#fdecea", color: "#b71c1c" },
  cancelled: { label: "Cancelled", bg: "#f0f0f0", color: "#616161" },
};

function toDateInputValue(dateString) {
  // Postgres returns e.g. "2026-08-20T00:00:00.000Z" — trim to yyyy-mm-dd for <input type="date">
  return dateString ? String(dateString).slice(0, 10) : "";
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span
      className="text-xs font-medium px-2 py-1 rounded-full"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}

function EditBookingForm({ booking, settings, onCancel, onSaved }) {
  const [startDate, setStartDate] = useState(toDateInputValue(booking.start_date));
  const [endDate, setEndDate] = useState(toDateInputValue(booking.end_date));
  const [bookingType, setBookingType] = useState(booking.booking_type);
  const [area, setArea] = useState(booking.area || settings.booking_areas[0]?.value || "");
  const [purpose, setPurpose] = useState(booking.purpose);
  const [whakapapa, setWhakapapa] = useState(booking.whakapapa ? "yes" : "no");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Exclude this booking's own dates from the availability check, otherwise
  // its own current dates would show up as "unavailable" to itself.
  const { unavailableDays, loading: loadingAvailability } = useBookingAvailability(booking.id);

  function handleSelectRange(nextStart, nextEnd) {
    setStartDate(nextStart);
    setEndDate(nextEnd);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/${booking.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          bookingType,
          area,
          purpose,
          ...(settings.whakapapa_question_enabled ? { whakapapa: whakapapa === "yes" } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update booking");
      onSaved(data.booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3 border-t pt-3">
      <p className="text-xs text-gray-500">
        Saving changes will send this booking back to pending for the admin to review again.
      </p>
      <div>
        <label className="block text-xs font-medium mb-1">
          Availability {loadingAvailability && <span className="text-gray-400 font-normal">(loading…)</span>}
        </label>
        <BookingCalendar
          unavailableDays={unavailableDays}
          startDate={startDate}
          endDate={endDate}
          onSelectRange={handleSelectRange}
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
      </div>
      {settings.whakapapa_question_enabled && (
        <div>
          <label className="block text-xs font-medium mb-1">{settings.whakapapa_question_label}</label>
          <select
            value={whakapapa}
            onChange={(e) => setWhakapapa(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs font-medium mb-1">Which area do you need?</label>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
        >
          {settings.booking_areas.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Type</label>
        <select
          value={bookingType}
          onChange={(e) => setBookingType(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
        >
          {settings.booking_types.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Purpose / details</label>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          required
          rows={3}
          className="w-full border rounded px-2 py-1 text-sm"
        />
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="booking-action btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save & re-request"}
        </button>
        <button type="button" onClick={onCancel} className="booking-action text-sm border rounded px-3 py-1">
          Cancel edit
        </button>
      </div>
    </form>
  );
}

// A guest's own review of their stay, once it's over — star rating +
// freeform notes about the marae. Separate from (and never shown) the
// manager's private review of the guest (see GET /api/bookings/:id/guest-review
// in backend/routes/bookings.js, which only ever returns the guest_* half of
// the row). Collapsed by default, loaded lazily on open.
function GuestReviewPanel({ bookingId }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleOpen() {
    setOpen(true);
    if (loaded) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/guest-review`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load your review");
      if (data.review) {
        setRating(data.review.rating || 0);
        setNotes(data.review.notes || "");
        setSavedAt(data.review.reviewedAt || null);
      } else {
        setEditing(true);
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
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/guest-review`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save your review");
      setRating(data.review.rating || 0);
      setNotes(data.review.notes || "");
      setSavedAt(data.review.reviewedAt);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={handleOpen} className="booking-action text-sm border rounded px-3 py-1">
        Leave a review
      </button>
    );
  }

  return (
    <div className="mt-2 border-t pt-3 space-y-2">
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : editing ? (
        <>
          <p className="text-xs text-gray-500">How was your stay?</p>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            placeholder="Anything you'd like to tell us about your stay..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border rounded px-2 py-1 text-sm"
          />
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-sm border rounded px-3 py-1.5"
            >
              {saving ? "Saving..." : "Submit review"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm underline text-gray-500">
              Close
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-1">Your review</p>
          <StarRating value={rating} readOnly />
          {notes && <p className="text-sm text-gray-700 whitespace-pre-line mt-1">{notes}</p>}
          {savedAt && (
            <p className="text-xs text-gray-400 mt-1">
              Submitted {new Date(savedAt).toLocaleDateString()}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <button type="button" onClick={() => setEditing(true)} className="text-sm underline">
              Edit
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm underline text-gray-500">
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  const { settings } = useSiteSettings();
  const typeLabels = Object.fromEntries(settings.booking_types.map((t) => [t.value, t.label]));
  const areaLabels = Object.fromEntries(settings.booking_areas.map((a) => [a.value, a.label]));

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  // A plain promise chain, not an async function called directly — every
  // setState call below sits inside a .then()/.catch() callback (deferred
  // to a microtask), never synchronously in this effect's own call frame.
  // (`loading`/`error` already start at their correct values — true/"" —
  // so there's nothing to reset synchronously before the fetch anyway.)
  // This was previously an `async function loadBookings()` called directly
  // from the effect, which set state synchronously before its first
  // `await` — a pre-existing react-hooks/set-state-in-effect lint finding
  // predating this engagement, cleaned up here alongside this round's
  // other fixes.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/bookings/mine`, { credentials: "include" })
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

  async function handleCancel(id) {
    if (!window.confirm("Cancel this booking?")) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}/cancel`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel booking");
      setBookings((prev) => prev.map((b) => (b.id === id ? data.booking : b)));
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSaved(updated) {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setEditingId(null);
  }

  return (
    <div className="my-bookings-page p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-semibold">My Bookings</h1>
        <Link
          to="/bookings/new"
          className="btn btn-primary"
          style={{ padding: "10px 20px", fontSize: "0.9rem" }}
        >
          + Request a new booking
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Requests you've made to hire the marae, and their current status.
      </p>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-500">
          You haven't made any booking requests yet.{" "}
          <Link to="/bookings/new" className="underline font-medium">
            Request one now
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <li key={booking.id} className="border rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">
                    {toDateInputValue(booking.start_date)} → {toDateInputValue(booking.end_date)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {typeLabels[booking.booking_type] || booking.booking_type} ·{" "}
                    {areaLabels[booking.area] || booking.area}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line mb-2">{booking.purpose}</p>
              {settings.whakapapa_question_enabled && (
                <p className="text-xs text-gray-500 mb-2">
                  {settings.whakapapa_question_label} {booking.whakapapa ? "Yes" : "No"}
                </p>
              )}
              {booking.admin_notes && (
                <p className="text-xs text-gray-600 italic mb-2">
                  Note from the marae: {booking.admin_notes}
                </p>
              )}

              {booking.status !== "cancelled" && editingId !== booking.id && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setEditingId(booking.id)}
                    className="booking-action text-sm border rounded px-3 py-1"
                  >
                    Edit / re-request
                  </button>
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="booking-action booking-action-danger text-sm text-red-600 border border-red-200 rounded px-3 py-1"
                  >
                    Cancel booking
                  </button>
                </div>
              )}

              {booking.status === "approved" && (
                <div className="mt-2">
                  <GuestAccessShare token={booking.guest_access_token} />
                </div>
              )}

              {isBookingComplete(booking) && (
                <div className="mt-2">
                  <GuestReviewPanel bookingId={booking.id} />
                </div>
              )}

              {editingId === booking.id && (
                <EditBookingForm
                  booking={booking}
                  settings={settings}
                  onCancel={() => setEditingId(null)}
                  onSaved={handleSaved}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
