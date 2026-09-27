// frontend/src/hooks/useMyActiveBooking.js
//
// The one active/current approved booking a member has, if any — same
// "approved and not yet ended" rule as useArrivalAccess.js, but hands back
// the booking itself (so its guest_access_token can be used to render a
// share link/QR code) rather than just an allowed/denied flag. Only
// meaningful for members — caretaker/admin don't have a personal booking to
// share, so this always returns null for them.
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

export default function useMyActiveBooking() {
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "member") {
      setLoading(false);
      setBooking(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`${API_BASE}/bookings/mine`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const active = (data.bookings || []).find(
          (b) => b.status === "approved" && new Date(b.end_date) >= today
        );
        setBooking(active || null);
      })
      .catch(() => {
        if (!cancelled) setBooking(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { booking, loading };
}
