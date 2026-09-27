// frontend/src/pages/manager/ManagerNewBookingPage.jsx
//
// Lets a manager create a booking on behalf of a customer who booked by
// phone or in person, rather than through the customer's own account. This
// reuses the exact same POST /api/bookings endpoint the self-serve
// BookingRequestPage.jsx uses — the only difference is a manager may also
// send `userId` (whose account the booking is filed under) and `status`
// (so it can be marked approved immediately instead of sitting in the
// pending queue). See backend/routes/bookings.js for that logic.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BookingCalendar from "../../components/BookingCalendar.jsx";
import useBookingAvailability from "../../hooks/useBookingAvailability.js";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

const BOOKING_TYPES = [
  { value: "standard", label: "Standard hire" },
  { value: "event", label: "Event" },
  { value: "tangihanga", label: "Tangihanga" },
];

const AREAS = [
  { value: "general", label: "General area" },
  { value: "paa", label: "Entire Paa" },
];

export default function ManagerNewBookingPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userId, setUserId] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookingType, setBookingType] = useState("standard");
  const [area, setArea] = useState("general");
  const [purpose, setPurpose] = useState("");
  const [whakapapa, setWhakapapa] = useState("");
  const [markApproved, setMarkApproved] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { unavailableDays, loading: loadingAvailability } = useBookingAvailability();

  useEffect(() => {
    fetch(`${API_BASE}/admin/users`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, []);

  function handleSelectRange(nextStart, nextEnd) {
    setStartDate(nextStart);
    setEndDate(nextEnd);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!userId) {
      setError("Choose which customer this booking is for");
      return;
    }
    if (whakapapa !== "yes" && whakapapa !== "no") {
      setError("Please select whether they whakapapa to the Paa");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          startDate,
          endDate,
          bookingType,
          area,
          purpose,
          whakapapa: whakapapa === "yes",
          status: markApproved ? "approved" : "pending",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");

      // Back to the bookings list so the manager can see it land there.
      navigate("/manager/bookings");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Make a Booking for a Customer</h1>
      <p className="text-gray-600 mb-6">
        For a hui, event or stay someone arranged by phone or in person, rather than through
        their own account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium mb-1">
            Customer
          </label>
          {loadingUsers ? (
            <p className="text-sm text-gray-400">Loading customers...</p>
          ) : (
            <select
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="" disabled>
                Select a customer
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) — {u.role}
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Don't see them?{" "}
            <Link to="/manager/users" className="underline font-medium">
              Create an account for them first
            </Link>
            , then come back here.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="startDate" className="block text-sm font-medium mb-1">
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="endDate" className="block text-sm font-medium mb-1">
              End date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div>
          <p className="block text-sm font-medium mb-1">
            Availability {loadingAvailability && <span className="text-gray-400 font-normal">(loading…)</span>}
          </p>
          <BookingCalendar
            unavailableDays={unavailableDays}
            startDate={startDate}
            endDate={endDate}
            onSelectRange={handleSelectRange}
          />
        </div>

        <div>
          <label htmlFor="whakapapa" className="block text-sm font-medium mb-1">
            Do they whakapapa to the Paa?
          </label>
          <select
            id="whakapapa"
            value={whakapapa}
            onChange={(e) => setWhakapapa(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="" disabled>
              Select an answer
            </option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <label htmlFor="area" className="block text-sm font-medium mb-1">
            Which area do they need?
          </label>
          <select
            id="area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {AREAS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bookingType" className="block text-sm font-medium mb-1">
            Type of booking
          </label>
          <select
            id="bookingType"
            value={bookingType}
            onChange={(e) => setBookingType(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {BOOKING_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="purpose" className="block text-sm font-medium mb-1">
            Purpose / details
          </label>
          <textarea
            id="purpose"
            placeholder="e.g. Whānau reunion for 80 people, need the wharenui and dining hall"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
            rows={4}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex items-start gap-2 pt-1">
          <input
            id="markApproved"
            type="checkbox"
            checked={markApproved}
            onChange={(e) => setMarkApproved(e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="markApproved" className="text-sm">
            Approve immediately — the customer already confirmed this with you. Untick to leave it
            pending in the booking queue instead.
          </label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create booking"}
        </button>
      </form>
    </div>
  );
}
