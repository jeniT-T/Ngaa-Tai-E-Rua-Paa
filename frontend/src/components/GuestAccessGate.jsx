// frontend/src/components/GuestAccessGate.jsx
import { useParams } from "react-router-dom";
import useGuestBookingAccess from "../hooks/useGuestBookingAccess.js";

export default function GuestAccessGate({ children }) {
  const { token } = useParams();
  const { status, booking } = useGuestBookingAccess(token);

  if (status === "checking") {
    return <div className="p-8 text-center text-gray-500">Checking this link...</div>;
  }

  if (status === "invalid") {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <h1 className="text-xl font-semibold mb-2">Link not found</h1>
        <p className="text-gray-600">
          This arrival-info link doesn't match a booking. Please check it with whoever shared it
          with you, or contact the marae directly.
        </p>
      </div>
    );
  }

  if (status === "denied") {
    const notYetStarted = booking && new Date(booking.startDate) > new Date();
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <h1 className="text-xl font-semibold mb-2">Marae guide</h1>
        <p className="text-gray-600">
          {notYetStarted
            ? "This booking hasn't been approved yet, so the marae guide isn't available through this link yet. Please check back closer to the stay."
            : "This booking's marae guide is no longer available through this link — the stay has ended, or the booking wasn't approved."}
        </p>
      </div>
    );
  }

  return children;
}
