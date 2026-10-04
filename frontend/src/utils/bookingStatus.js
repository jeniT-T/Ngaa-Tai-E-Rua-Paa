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
