import { Navigate } from "react-router-dom";

export default function AccessDeniedRedirect({ message = "You don't have permission to view that page." }) {
  return <Navigate to="/" replace state={{ showHome: true, accessNotice: message }} />;
}
