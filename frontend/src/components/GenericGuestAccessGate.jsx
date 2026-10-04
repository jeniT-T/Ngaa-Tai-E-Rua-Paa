// frontend/src/components/GenericGuestAccessGate.jsx
//
// Gates the generic guest routes (/arrival/guest, /checklists/guest,
// /tutorials/guest -- no token) behind "is there currently an active,
// in-date-range booking at the marae right now" -- see
// useGenericGuestAccess.js and §24. This is the sibling of
// GuestAccessGate.jsx, which gates the per-booking token routes instead.
import useGenericGuestAccess from "../hooks/useGenericGuestAccess.js";

export default function GenericGuestAccessGate({ children }) {
  const { status } = useGenericGuestAccess();

  if (status === "checking") {
    return <div className="p-8 text-center text-gray-500">Checking access...</div>;
  }

  if (status === "denied") {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <h1 className="text-xl font-semibold mb-2">Marae guide</h1>
        <p className="text-gray-600">
          This guide is only available while there's a current stay at the marae. If you're
          here as a guest right now, please check with your host or the marae office.
        </p>
      </div>
    );
  }

  return children;
}
