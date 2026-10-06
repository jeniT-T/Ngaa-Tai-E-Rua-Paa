
import AccessDeniedRedirect from "./AccessDeniedRedirect.jsx";
import useArrivalAccess from "../hooks/useArrivalAccess.js";

export default function ArrivalAccessGate({ children }) {
  const status = useArrivalAccess();

  if (status === "checking") {
    return <div className="p-8 text-center text-gray-500">Checking access...</div>;
  }

  if (status === "denied") {
    return <AccessDeniedRedirect message="You need a current or upcoming approved booking to view this page." />;
  }

  return children;
}
