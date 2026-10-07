const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

export async function confirmBookingConflicts({ startDate, endDate, area, excludeId }) {
  const params = new URLSearchParams({ startDate: String(startDate).slice(0, 10), endDate: String(endDate).slice(0, 10), area });
  if (excludeId) params.set('excludeId', excludeId);
  const res = await fetch(`${API_BASE}/bookings/conflicts?${params}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to check booking conflicts');
  if (!data.conflicts.length) return true;
  const details = data.conflicts.map((booking) => `${booking.requester_name}: ${String(booking.start_date).slice(0, 10)} → ${String(booking.end_date).slice(0, 10)} (${booking.area})`).join('\n');
  return window.confirm(`Warning: these dates and areas overlap with approved bookings:\n${details}\n\nContinue anyway?`);
}
