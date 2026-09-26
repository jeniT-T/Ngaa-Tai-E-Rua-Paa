
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function useGuestBookingAccess(token) {
  const [status, setStatus] = useState("checking"); 
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    let cancelled = false;
    setStatus("checking");

    fetch(`${API_BASE}/bookings/guest/${token}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setStatus("invalid");
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setStatus("invalid");
          return;
        }
        setBooking(data.booking);
        setStatus(data.active ? "allowed" : "denied");
      })
      .catch(() => {
        if (!cancelled) setStatus("invalid");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { status, booking };
}
