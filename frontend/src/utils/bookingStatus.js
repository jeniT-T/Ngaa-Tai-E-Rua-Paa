// frontend/src/utils/bookingStatus.js
//
// Shared by MyBookingsPage.jsx and ManagerBookingsPage.jsx — a booking is
// only "complete" (and so only reviewable, by either side — see
// StarRating.jsx's two call sites) once it's approved AND its stay has
// actually finished. Mirrors isBookingComplete() in
// backend/routes/bookings.js, which is what actually enforces this; this
// copy is just for deciding whether to show the review UI at all.
export function isBookingComplete(booking) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return booking.status === "approved" && new Date(booking.end_date) < today;
}


// A stay remains current through its entire end date in New Zealand.
export function hasBookingEnded(booking, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type) => parts.find((part) => part.type === type).value;
  const today = `${value('year')}-${value('month')}-${value('day')}`;
  const endDate = String(booking.end_date || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(endDate) && endDate < today;
}
