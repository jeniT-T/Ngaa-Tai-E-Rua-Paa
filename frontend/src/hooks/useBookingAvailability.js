
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

// startDate/endDate arrive from the backend as e.g.
// "2026-10-03T00:00:00.000Z" — a plain SQL DATE column (no time zone of its
// own) that the pg driver/JSON round-trip always represents at UTC
// midnight. The old version built a real Date from that string, called
// setHours(0,0,0,0) (which operates in the *browser's local* time zone),
// then read it back with toISOString() (UTC again) — two unnecessary
// timezone conversions that cancel out in some zones and don't in others:
// anywhere UTC+, that round-trip rolled the date back a day, which is
// exactly the "day before" bug reported against the calendar that uses
// this. Pulling the Y/M/D straight out of the string and walking the range
// with Date.UTC(...) never touches the local time zone at all, so the key
// this produces always matches the calendar date the backend actually
// means, regardless of what time zone the browser is in.
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

export default function useBookingAvailability(excludeId) {
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const query = excludeId ? `?excludeId=${excludeId}` : "";
    fetch(`${API_BASE}/bookings/availability${query}`, { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load availability");
        if (!cancelled) setRanges(data.ranges);
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
  }, [excludeId]);

  const approvedDays = new Set(
    ranges.filter((r) => r.status === "approved").flatMap((r) => expandRangeToDays(r.startDate, r.endDate))
  );

  const pendingDays = new Set(
    ranges.filter((r) => r.status === "pending").flatMap((r) => expandRangeToDays(r.startDate, r.endDate))
  );

  const unavailableDays = new Set([...approvedDays, ...pendingDays]);

  return { unavailableDays, approvedDays, pendingDays, loading, error };
}
