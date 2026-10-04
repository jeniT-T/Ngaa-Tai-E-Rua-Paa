
import { useState } from "react";
import { Link } from "react-router-dom";
import BookingCalendar from "../components/BookingCalendar.jsx";
import useBookingAvailability from "../hooks/useBookingAvailability.js";
import useSiteSettings from "../hooks/useSiteSettings.js";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

export default function BookingRequestPage() {
  const { settings } = useSiteSettings();
  const bookingTypes = settings.booking_types;
  const areas = settings.booking_areas;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookingType, setBookingType] = useState(bookingTypes[0]?.value || "");
  const [area, setArea] = useState(areas[0]?.value || "");
  const [purpose, setPurpose] = useState("");
  const [whakapapa, setWhakapapa] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { unavailableDays, loading: loadingAvailability } = useBookingAvailability();

  // The booking type/area options only arrive once the site-settings fetch
  // resolves — if the current selection isn't one of the real options
  // (e.g. a marae that doesn't offer "standard"), fall back to the first
  // real one for display/submission rather than silently submitting
  // something invalid. Computed at render time (not via a state-syncing
  // effect) since it's a pure derivation of bookingTypes/areas + the
  // current selection.
  const effectiveBookingType = bookingTypes.some((t) => t.value === bookingType)
    ? bookingType
    : bookingTypes[0]?.value || "";
  const effectiveArea = areas.some((a) => a.value === area) ? area : areas[0]?.value || "";

  function handleSelectRange(nextStart, nextEnd) {
    setStartDate(nextStart);
    setEndDate(nextEnd);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (settings.whakapapa_question_enabled && whakapapa !== "yes" && whakapapa !== "no") {
      setError(`Please answer: ${settings.whakapapa_question_label}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          bookingType: effectiveBookingType,
          area: effectiveArea,
          purpose,
          // When the marae has switched this question off entirely (Site
          // Settings), there's nothing to answer — always send false.
          whakapapa: settings.whakapapa_question_enabled ? whakapapa === "yes" : false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit booking request");

      setSuccess(true);
      setStartDate("");
      setEndDate("");
      setBookingType(bookingTypes[0]?.value || "");
      setArea(areas[0]?.value || "");
      setPurpose("");
      setWhakapapa("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Request a Booking</h1>
      <p className="text-gray-600 mb-6">
        Tell us about your hui, event or stay and we'll get back to you to confirm.
      </p>

      {success && (
        <div className="mb-4 text-green-700 bg-green-50 border border-green-200 rounded p-3">
          <p>Thanks — your booking request has been sent. We'll email you once it's been reviewed.</p>
          <Link to="/bookings" className="underline font-medium">
            View my bookings →
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
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

        {settings.whakapapa_question_enabled && (
          <div>
            <label htmlFor="whakapapa" className="block text-sm font-medium mb-1">
              {settings.whakapapa_question_label}
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
        )}

        <div>
          <label htmlFor="area" className="block text-sm font-medium mb-1">
            Which area do you need?
          </label>
          <select
            id="area"
            value={effectiveArea}
            onChange={(e) => setArea(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {areas.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Booking any area reserves the whole property for your dates — the marae doesn't
            take two bookings for overlapping dates, even if they're for different areas.
          </p>
        </div>

        <div>
          <label htmlFor="bookingType" className="block text-sm font-medium mb-1">
            Type of booking
          </label>
          <select
            id="bookingType"
            value={effectiveBookingType}
            onChange={(e) => setBookingType(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {bookingTypes.map(({ value, label }) => (
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

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary btn-action"
        >
          {submitting ? "Submitting..." : "Submit request"}
        </button>
      </form>
    </div>
  );
}
