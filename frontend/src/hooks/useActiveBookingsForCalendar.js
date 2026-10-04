import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

// Same timezone-safe date-only parsing as useBookingAvailability.js (see
// its comment for why — a naive Date + toISOString() round-trip rolls the
// date back a day in any positive-UTC-offset timezone, which is exactly
// the bug §18 fixed on the booking calendar; this hook feeds the
// caretaker's *own* calendar, so it needs the identical treatment).
function parseDateOnly(dateString) {
  const [year, month, day] = String(dateString).slice(0, 10).split("-").map(Number);
  return { year, month, day };
}

function toDateKeyUTC(utcMillis) {
  const d = new Date(utcMillis);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function expandRangeToDays(startDate, endDate) {
  const days = [];
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  let cursor = Date.UTC(start.year, start.month - 1, start.day);
  const endMillis = Date.UTC(end.year, end.month - 1, end.day);
  while (cursor <= endMillis) {
    days.push(toDateKeyUTC(cursor));
    cursor += ONE_DAY_MS;
  }
  return days;
}

// Approved bookings, keyed by every "yyyy-MM-dd" day they cover, for
// caretaker/manager/admin to overlay onto the caretaker task
// calendar/schedule (see GET /api/bookings/calendar) — so a booking that's
// actually happening shows up there, not just caretaker-added tasks.
export default function useActiveBookingsForCalendar() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/bookings/calendar`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setBookings(data.bookings || []);
      })
      .catch(() => {
        // leave it empty — a failed fetch just means no booking overlay,
        // never a broken calendar
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // dateKey ("yyyy-MM-dd") -> array of bookings covering that day
  const byDate = new Map();
  for (const booking of bookings) {
    for (const day of expandRangeToDays(booking.start_date, booking.end_date)) {
      if (!byDate.has(day)) byDate.set(day, []);
      byDate.get(day).push(booking);
    }
  }

  function bookingsOnDay(dateKey) {
    return byDate.get(dateKey) || [];
  }

  return { bookings, bookingsOnDay, loading };
}
