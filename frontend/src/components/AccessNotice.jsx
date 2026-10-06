import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AccessNotice() {
  const location = useLocation();
  const navigate = useNavigate();
  const message = location.state?.accessNotice;

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => {
      const state = { ...location.state };
      delete state.accessNotice;
      navigate(location.pathname + location.search + location.hash, { replace: true, state });
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [message, location, navigate]);

  if (!message) return null;

  return (
    <div className="access-notice" role="status" aria-live="polite">
      {message} You've been returned to the home page.
    </div>
  );
}
