import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const SLOT_DURATION_MINUTES = 60;
const WORKDAY_START = 8;
const WORKDAY_END = 20;
const TIME_SLOTS = Array.from({ length: WORKDAY_END - WORKDAY_START }, (_, index) => {
  const hour = WORKDAY_START + index;
  return `${String(hour).padStart(2, '0')}:00`;
});

function buildDaysInMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDayOfMonth.getDay(); i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(year, month, day));
  }

  return cells;
}

function formatLocalDateTime(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function buildLocalDateTime(dateValue, timeValue) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hour, minute] = timeValue.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0);
}

function getLocalDateKey(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseLocalDateTime(value) {
  if (!value) return null;
  const normalized = String(value).replace(' ', 'T');
  const [datePart, timePart] = normalized.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second = 0] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}

function buildDailySlots(date) {
  const slots = [];
  const [year, month, day] = date.split('-').map(Number);
  const current = new Date(year, month - 1, day, WORKDAY_START, 0, 0);

  while (current.getHours() < WORKDAY_END) {
    const start = new Date(current);
    const end = new Date(current);
    end.setMinutes(end.getMinutes() + SLOT_DURATION_MINUTES);

    slots.push({
      start: formatLocalDateTime(start),
      end: formatLocalDateTime(end),
    });

    current.setMinutes(current.getMinutes() + SLOT_DURATION_MINUTES);
  }

  return slots;
}

function slotLabel(slot) {
  const start = parseLocalDateTime(slot.start);
  const end = parseLocalDateTime(slot.end);
  return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function formatDateTime(value) {
  const parsed = parseLocalDateTime(value);
  const date = parsed || new Date(value);
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDay(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getDayKey(date) {
  return getLocalDateKey(date);
}

function getSlotStatus(slot, bookings) {
  // Determine whether a generated hourly slot is free, pending approval, or already reserved.
  const slotStart = parseLocalDateTime(slot.start);
  const slotEnd = parseLocalDateTime(slot.end);

  const overlap = bookings.filter((booking) => {
    if (booking.status === 'denied') {
      return false;
    }
    const bookingStart = parseLocalDateTime(booking.start_datetime);
    const bookingEnd = parseLocalDateTime(booking.end_datetime);
    return !(slotEnd <= bookingStart || slotStart >= bookingEnd);
  });

  if (overlap.length === 0) {
    return 'available';
  }

  return overlap.some((booking) => booking.status === 'pending') ? 'pending' : 'booked';
}

function getDayStatus(bookings, dayKey) {
  // Mark a day as pending or booked when any booking exists for that date.
  const dayBookings = bookings.filter((booking) => booking.start_datetime.slice(0, 10) === dayKey);
  if (dayBookings.some((booking) => booking.status === 'pending')) {
    return 'pending';
  }
  if (dayBookings.some((booking) => booking.status === 'approved')) {
    return 'booked';
  }
  return null;
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateKey(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [bookings, setBookings] = useState([]);
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [editingValues, setEditingValues] = useState({ date: '', startTime: '08:00', endTime: '09:00', purpose: '' });
  const [adminSaving, setAdminSaving] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState(null);

  // Load the latest booking list so the calendar updates after approval, denial, or edits.
  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/bookings`, { credentials: 'include' });
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const monthDays = useMemo(() => buildDaysInMonth(selectedMonth), [selectedMonth]);
  const dayBookings = useMemo(
    () => bookings.filter((booking) => booking.start_datetime.slice(0, 10) === selectedDate),
    [bookings, selectedDate]
  );
  const daySlots = useMemo(() => buildDailySlots(selectedDate), [selectedDate]);
  // Keep pending and approved bookings in separate groups for the admin management panel.
  const pendingBookings = useMemo(() => bookings.filter((booking) => booking.status === 'pending'), [bookings]);
  const approvedBookings = useMemo(() => bookings.filter((booking) => booking.status === 'approved'), [bookings]);
  const userBookingNotice = useMemo(() => {
    const userBookings = bookings.filter((booking) => booking.user_id === user?.id);
    if (userBookings.length === 0) {
      return null;
    }

    const latestBooking = [...userBookings].sort((first, second) => new Date(second.created_at || 0) - new Date(first.created_at || 0))[0];

    if (latestBooking.status === 'approved') {
      return { type: 'success', text: 'Your booking has been approved.' };
    }

    if (latestBooking.status === 'denied') {
      return { type: 'error', text: 'Your booking request was not approved.' };
    }

    return { type: 'info', text: 'Your booking request is still pending approval.' };
  }, [bookings, user?.id]);

  const handleSubmit = async (slot) => {
    // Create a new booking request from a selected calendar slot.
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDateTime: slot.start,
          endDateTime: slot.end,
          purpose,
          bookingType: 'standard',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to make booking');
      }

      await fetchBookings();
      setSuccess('Booking request submitted. You will see the result here once the admin responds.');
      setPurpose('');
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    // Approve or deny a pending request from the admin workflow.
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to update booking');
      }

      await fetchBookings();
      setSuccess(`Booking ${status}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    // Remove a denied request or delete an approved booking entirely.
    if (!window.confirm('Delete this booking request?')) {
      return;
    }

    setError('');
    setSuccess('');
    setDeletingBookingId(bookingId);

    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to delete booking');
      }

      await fetchBookings();
      setSuccess('Booking removed.');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingBookingId(null);
    }
  };

  const openEdit = (booking) => {
    const start = parseLocalDateTime(booking.start_datetime);
    const end = parseLocalDateTime(booking.end_datetime);
    setEditingBookingId(booking.id);
    setEditingValues({
      date: getLocalDateKey(start),
      startTime: `${String(start.getHours()).padStart(2, '0')}:00`,
      endTime: `${String(end.getHours()).padStart(2, '0')}:00`,
      purpose: booking.purpose || '',
    });
  };

  const saveEdit = async (bookingId) => {
    // Reschedule an approved booking to a new date or time slot.
    setError('');
    setSuccess('');
    setAdminSaving(true);

    try {
      const start = buildLocalDateTime(editingValues.date, editingValues.startTime);
      const end = buildLocalDateTime(editingValues.date, editingValues.endTime);
      const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDateTime: formatLocalDateTime(start),
          endDateTime: formatLocalDateTime(end),
          purpose: editingValues.purpose,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to update booking');
      }

      await fetchBookings();
      setEditingBookingId(null);
      setSuccess('Booking updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setAdminSaving(false);
    }
  };

  const changeMonth = (direction) => {
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(nextMonth.getMonth() + direction);
    setSelectedMonth(nextMonth);
  };

  const selectDay = (date) => {
    setSelectedDate(getDayKey(date));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">Marae Booking Calendar</h1>

      <section className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Select a day</h2>
            <p className="text-sm text-slate-600">Click a day to choose it, then select a time slot below.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => changeMonth(-1)} className="rounded border px-3 py-2 text-sm">
              Previous
            </button>
            <button type="button" onClick={() => changeMonth(1)} className="rounded border px-3 py-2 text-sm">
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mt-4 text-center text-sm font-medium text-slate-600">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-2 mt-2">
          {monthDays.map((day, index) => {
            if (!day) {
              return <div key={`blank-${index}`} className="h-20 rounded border border-transparent" />;
            }

            const dayKey = getDayKey(day);
            const isSelected = dayKey === selectedDate;
            const dayStatus = getDayStatus(bookings, dayKey);
            const hasBooking = dayStatus !== null;
            const isToday = dayKey === getLocalDateKey(new Date());

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => selectDay(day)}
                className={`rounded border p-3 text-left transition ${
                  isSelected ? 'border-black bg-slate-100' : 'border-slate-200 bg-white'
                } ${hasBooking ? 'shadow-sm' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={isToday ? 'text-blue-700 font-semibold' : 'font-semibold'}>{day.getDate()}</span>
                  {hasBooking && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] text-white ${dayStatus === 'pending' ? 'bg-amber-500' : 'bg-blue-600'}`}>
                      {dayStatus === 'pending' ? 'Pending' : 'Booked'}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">{day.toLocaleDateString(undefined, { month: 'short' })}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        {user?.role !== 'admin' && (
          <>
            {userBookingNotice && (
              <div className={`mb-4 rounded border px-4 py-3 text-sm ${userBookingNotice.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : userBookingNotice.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                {userBookingNotice.text}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded border p-4">
              <h2 className="text-xl font-semibold mb-3">Slots for {new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}</h2>
              {error && <p className="text-red-600 mb-3">{error}</p>}
              {success && <p className="text-green-600 mb-3">{success}</p>}
              <div className="space-y-3">
                {daySlots.map((slot) => {
                  const status = getSlotStatus(slot, bookings);
                  const isDisabled = status !== 'available' || submitting || !purpose;
                  return (
                    <div key={`${slot.start}-${slot.end}`} className="flex flex-col gap-2 rounded border p-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{slotLabel(slot)}</p>
                        <p className="text-sm text-slate-600">
                          {status === 'available' ? 'Available' : status === 'pending' ? 'Pending approval' : 'Booked'}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleSubmit(slot)}
                        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
                      >
                        Confirm booking
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded border p-4">
              <h2 className="text-xl font-semibold mb-3">Booking details</h2>
              <p className="mb-3">Selected day: <strong>{formatDay(new Date(`${selectedDate}T00:00:00`))}</strong></p>
              <label className="block mb-2 font-medium">Reason for booking</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={5}
                className="w-full rounded border px-3 py-2"
                placeholder="Enter a short explanation for the booking"
              />
              <p className="mt-3 text-sm text-slate-600">This reason is stored and visible to admins once the request is reviewed.</p>
            </div>
          </div>
          </>
        )}
      </section>

      <section className="rounded border p-4 mt-8">
        <h2 className="text-xl font-semibold mb-3">Bookings on {new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}</h2>
        <div className="space-y-3">
          {dayBookings.length === 0 ? (
            <p>No bookings for this day.</p>
          ) : (
            dayBookings.map((booking) => {
              const isOwnBooking = booking.user_id === user?.id;
              return (
                <div key={booking.id} className="rounded border p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium">{formatDateTime(booking.start_datetime)} – {formatDateTime(booking.end_datetime)}</p>
                      <p className="text-sm text-slate-600">Booked by {booking.user_name}</p>
                      <p className="text-sm text-slate-600">Status: <span className="font-semibold capitalize">{booking.status}</span></p>
                      {booking.purpose ? (
                        <p className="mt-2 text-sm text-slate-700">Purpose: {booking.purpose}</p>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500 italic">Purpose is visible to admins only.</p>
                      )}
                    </div>
                    {isOwnBooking && booking.status !== 'denied' && (
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => openEdit(booking)} className="rounded border px-3 py-2 text-sm">
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDeleteBooking(booking.id)} disabled={deletingBookingId === booking.id} className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50">
                          {deletingBookingId === booking.id ? 'Removing…' : 'Cancel'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {user?.role === 'admin' && (
        <section className="rounded border p-4">
          <h2 className="text-xl font-semibold mb-3">Admin booking management</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Pending requests</h3>
              {pendingBookings.length === 0 ? (
                <p className="text-sm text-slate-600">No pending bookings.</p>
              ) : (
                <div className="space-y-3">
                  {pendingBookings.map((booking) => {
                    const isEditing = editingBookingId === booking.id;
                    return (
                      <div key={booking.id} className="rounded border p-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-medium">{formatDateTime(booking.start_datetime)} – {formatDateTime(booking.end_datetime)}</p>
                            <p className="text-sm text-slate-600">Booked by {booking.user_name}</p>
                            {booking.purpose && <p className="mt-2 text-sm text-slate-700">Purpose: {booking.purpose}</p>}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => handleStatusUpdate(booking.id, 'approved')} className="rounded bg-green-600 px-3 py-2 text-sm text-white">
                              Approve
                            </button>
                            <button type="button" onClick={() => handleDeleteBooking(booking.id)} disabled={deletingBookingId === booking.id} className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50">
                              {deletingBookingId === booking.id ? 'Removing…' : 'Deny'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Approved bookings</h3>
              {approvedBookings.length === 0 ? (
                <p className="text-sm text-slate-600">No approved bookings yet.</p>
              ) : (
                <div className="space-y-3">
                  {approvedBookings.map((booking) => {
                    const isEditing = editingBookingId === booking.id;
                    return (
                      <div key={booking.id} className="rounded border p-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-medium">{formatDateTime(booking.start_datetime)} – {formatDateTime(booking.end_datetime)}</p>
                            <p className="text-sm text-slate-600">Booked by {booking.user_name}</p>
                            {booking.purpose && <p className="mt-2 text-sm text-slate-700">Purpose: {booking.purpose}</p>}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => openEdit(booking)} className="rounded border px-3 py-2 text-sm">
                              Edit time
                            </button>
                            <button type="button" onClick={() => handleDeleteBooking(booking.id)} disabled={deletingBookingId === booking.id} className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50">
                              {deletingBookingId === booking.id ? 'Removing…' : 'Delete'}
                            </button>
                          </div>
                        </div>

                        {isEditing && (
                          <div className="mt-3 space-y-2">
                            <div className="grid gap-3 md:grid-cols-3">
                              <label className="text-sm">
                                <span className="mb-1 block">Date</span>
                                <input
                                  type="date"
                                  value={editingValues.date}
                                  onChange={(e) => setEditingValues((prev) => ({ ...prev, date: e.target.value }))}
                                  className="w-full rounded border px-3 py-2"
                                />
                              </label>
                              <label className="text-sm">
                                <span className="mb-1 block">Start time</span>
                                <select
                                  value={editingValues.startTime}
                                  onChange={(e) => setEditingValues((prev) => ({ ...prev, startTime: e.target.value }))}
                                  className="w-full rounded border px-3 py-2"
                                >
                                  {TIME_SLOTS.map((slot) => (
                                    <option key={slot} value={slot}>{slot}</option>
                                  ))}
                                </select>
                              </label>
                              <label className="text-sm">
                                <span className="mb-1 block">End time</span>
                                <select
                                  value={editingValues.endTime}
                                  onChange={(e) => setEditingValues((prev) => ({ ...prev, endTime: e.target.value }))}
                                  className="w-full rounded border px-3 py-2"
                                >
                                  {TIME_SLOTS.map((slot) => (
                                    <option key={slot} value={slot}>{slot}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <label className="block text-sm">
                              <span className="mb-1 block">Purpose</span>
                              <textarea
                                value={editingValues.purpose}
                                onChange={(e) => setEditingValues((prev) => ({ ...prev, purpose: e.target.value }))}
                                rows={3}
                                className="w-full rounded border px-3 py-2"
                              />
                            </label>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => saveEdit(booking.id)} disabled={adminSaving} className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50">
                                Save changes
                              </button>
                              <button type="button" onClick={() => setEditingBookingId(null)} className="rounded border px-3 py-2 text-sm">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
