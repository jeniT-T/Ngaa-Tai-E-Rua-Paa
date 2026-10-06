
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;


export default function useArrivalAccess() {
  const { user } = useAuth();
  const [status, setStatus] = useState("checking"); // checking | allowed | denied

  useEffect(() => {
    if (!user) {
      setStatus("denied");
      return;
    }

    if (user.role === "caretaker" || user.role === "manager" || user.role === "admin") {
      setStatus("allowed");
      return;
    }

    let cancelled = false;

    fetch(`${API_BASE}/bookings/mine`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const hasActiveApprovedBooking = (data.bookings || []).some((booking) => {
          if (booking.status !== "approved") return false;
          const endDate = new Date(booking.end_date);
          return endDate >= today;
        });

        setStatus(hasActiveApprovedBooking ? "allowed" : "denied");
      })
      .catch(() => {
        if (!cancelled) setStatus("denied");
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return status;
}
