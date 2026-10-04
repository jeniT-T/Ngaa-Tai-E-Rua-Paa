// frontend/src/hooks/useGenericGuestAccess.js
//
// Backs the generic, non-booking-specific guest QR code the client can post
// physically around the marae itself (as opposed to the per-booking
// link/QR from useGuestBookingAccess.js, which is personal to one booking
// and shared digitally) -- see §24. Checks GET /api/bookings/guest-active,
// which is only "active" while an approved booking's date range covers
// *today* specifically -- i.e. only while someone is actually in
// residence, not before arrival or after departure.
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

export default function useGenericGuestAccess() {
  const [status, setStatus] = useState("checking"); // checking | allowed | denied
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("checking");

    fetch(`${API_BASE}/bookings/guest-active`)
      .then(async (res) => {
        if (cancelled) return;
        const data = await res.json();
        if (!res.ok) {
          setStatus("denied");
          return;
        }
        setEndDate(data.endDate || null);
        setStatus(data.active ? "allowed" : "denied");
      })
      .catch(() => {
        if (!cancelled) setStatus("denied");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { status, endDate };
}
