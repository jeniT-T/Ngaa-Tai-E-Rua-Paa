
import { Link } from "react-router-dom";
import useArrivalAccess from "../hooks/useArrivalAccess.js";

export default function ArrivalAccessGate({ children }) {
  const status = useArrivalAccess();

  if (status === "checking") {
    return <div className="p-8 text-center text-gray-500">Checking access...</div>;
  }

  if (status === "denied") {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <h1 className="text-xl font-semibold mb-2">Arrival information</h1>
        <p className="text-gray-600 mb-4">
          This page is only available once you have an approved booking, from when it's
          confirmed through to the end of your stay.
        </p>
        <Link to="/bookings" className="underline font-medium">
          View my bookings →
        </Link>
      </div>
    );
  }

  return children;
}
