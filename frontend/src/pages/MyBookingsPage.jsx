// frontend/src/pages/MyBookingsPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BookingCalendar from "../components/BookingCalendar.jsx";
import useBookingAvailability from "../hooks/useBookingAvailability.js";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const BOOKING_TYPES = [
  { value: "standard", label: "Standard hire" },
  { value: "event", label: "Event" },
  { value: "tangihanga", label: "Tangihanga" },
];

const AREAS = [
  { value: "general", label: "General area" },
  { value: "paa", label: "Entire Paa" },
];

const AREA_LABELS = { general: "General area", paa: "Entire Paa" };

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

function EditBookingForm({ booking, onCancel, onSaved }) {
  const [startDate, setStartDate] = useState(toDateInputValue(booking.start_date));
  const [endDate, setEndDate] = useState(toDateInputValue(booking.end_date));
  const [bookingType, setBookingType] = useState(booking.booking_type);
  const [area, setArea] = useState(booking.area || "general");
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
        body: JSON.stringify({ startDate, endDate, bookingType, area, purpose, whakapapa: whakapapa === "yes" }),
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
      <div>
        <label className="block text-xs font-medium mb-1">Do you whakapapa to the Paa?</label>
        <select
          value={whakapapa}
          onChange={(e) => setWhakapapa(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Which area do you need?</label>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
        >
          {AREAS.map(({ value, label }) => (
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
          {BOOKING_TYPES.map(({ value, label }) => (
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
          className="text-sm bg-black text-white rounded px-3 py-1 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save & re-request"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm border rounded px-3 py-1">
          Cancel edit
        </button>
      </div>
    </form>
  );
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  async function loadBookings() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/bookings/mine`, { credentials: "include" });
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
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-semibold">My Bookings</h1>
        <Link
          to="/bookings/new"
          className="text-sm bg-black text-white rounded px-4 py-2"
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
                    {booking.booking_type} · {AREA_LABELS[booking.area] || booking.area}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line mb-2">{booking.purpose}</p>
              <p className="text-xs text-gray-500 mb-2">
                Whakapapa to the Paa: {booking.whakapapa ? "Yes" : "No"}
              </p>
              {booking.admin_notes && (
                <p className="text-xs text-gray-600 italic mb-2">
                  Note from the marae: {booking.admin_notes}
                </p>
              )}

              {booking.status !== "cancelled" && editingId !== booking.id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(booking.id)}
                    className="text-sm border rounded px-3 py-1"
                  >
                    Edit / re-request
                  </button>
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="text-sm text-red-600 border border-red-200 rounded px-3 py-1"
                  >
                    Cancel booking
                  </button>
                </div>
              )}

              {editingId === booking.id && (
                <EditBookingForm
                  booking={booking}
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
