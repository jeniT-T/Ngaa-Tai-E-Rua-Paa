import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ChevronLeft } from "lucide-react";

export default function StaffBackButton() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!['admin', 'manager', 'caretaker'].includes(user?.role) || ['/', '/admin', '/manager', '/caretaker'].includes(location.pathname.replace(/\/+$/, '') || '/')) return null;

  function goBack() {
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }
    const dashboard = `/${user.role}`;
    navigate(location.pathname === dashboard ? '/' : dashboard, {
      state: { showHome: true },
    });
  }

  return (
    <div className="staff-back-navigation">
      <button type="button" onClick={goBack} className="btn btn-outline btn-action btn-compact">
        <ChevronLeft size={18} aria-hidden="true" />
        Back
      </button>
    </div>
  );
}
