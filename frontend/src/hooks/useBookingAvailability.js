// frontend/src/hooks/useBookingAvailability.js
// Fetches the date ranges that are already booked (pending or approved) so a
// calendar can gray out unavailable days. excludeId lets a booker editing
// their own booking view the calendar without their own dates blocking them.
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Turn a "YYYY-MM-DD" (or any Date-parseable) start/end pair into a Set of
// "YYYY-MM-DD" strings covering every day in the range, inclusive.
function expandRangeToDays(startDate, endDate) {
  const days = [];
  const cursor = new Date(startDate);
  const end = new Date(endDate);
  cursor.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
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

  // Days that are hard-unavailable (an approved booking already has them).
  const approvedDays = new Set(
    ranges.filter((r) => r.status === "approved").flatMap((r) => expandRangeToDays(r.startDate, r.endDate))
  );
  // Days that are tentatively taken (a pending request is in for them) —
  // still shown as unavailable to pick, since two people shouldn't both
  // apply for the same dates, but kept distinct in case the UI wants to
  // style them differently later.
  const pendingDays = new Set(
    ranges.filter((r) => r.status === "pending").flatMap((r) => expandRangeToDays(r.startDate, r.endDate))
  );

  const unavailableDays = new Set([...approvedDays, ...pendingDays]);

  return { unavailableDays, approvedDays, pendingDays, loading, error };
}
