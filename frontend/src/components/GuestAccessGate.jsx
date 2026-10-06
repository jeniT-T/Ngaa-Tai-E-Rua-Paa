// frontend/src/components/GuestAccessGate.jsx
import AccessDeniedRedirect from "./AccessDeniedRedirect.jsx";
import { useParams } from "react-router-dom";
import useGuestBookingAccess from "../hooks/useGuestBookingAccess.js";

export default function GuestAccessGate({ children }) {
  const { token } = useParams();
  const { status } = useGuestBookingAccess(token);

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
    return <AccessDeniedRedirect message="This booking's guide is unavailable because the stay has ended or the booking is not approved." />;
  }

  return children;
}
