
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import HomePage from "../pages/HomePage.jsx";

export const ROLE_HOME = {
  caretaker: "/caretaker",
  manager: "/manager",
  admin: "/admin",
};

export default function HomeRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (user && ROLE_HOME[user.role]) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  return <HomePage />;
}
