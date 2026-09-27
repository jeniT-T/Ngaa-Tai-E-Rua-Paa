
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

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

  const approvedDays = new Set(
    ranges.filter((r) => r.status === "approved").flatMap((r) => expandRangeToDays(r.startDate, r.endDate))
  );

  const pendingDays = new Set(
    ranges.filter((r) => r.status === "pending").flatMap((r) => expandRangeToDays(r.startDate, r.endDate))
  );

  const unavailableDays = new Set([...approvedDays, ...pendingDays]);

  return { unavailableDays, approvedDays, pendingDays, loading, error };
}
