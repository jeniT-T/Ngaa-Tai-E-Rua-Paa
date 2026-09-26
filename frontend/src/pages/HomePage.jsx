import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import useArrivalAccess from "../hooks/useArrivalAccess.js";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const FEATURES = [
  {
    to: "/history",
    title: "History of the Marae",
    description:
      "Learn the story of our whare, our whakapapa, and the people who have cared for this place.",
  },
  {
    to: "/facilities",
    title: "Available Facilities",
    description:
      "See the wharenui, wharekai, accommodation and grounds available for your stay or event.",
  },
];

const STATUS_STYLES = {
  pending: { label: "Pending review", bg: "#fff8e1", color: "#8a6d00" },
  approved: { label: "Approved", bg: "#e8f5e9", color: "#1b5e20" },
  denied: { label: "Denied", bg: "#fdecea", color: "#b71c1c" },
  cancelled: { label: "Cancelled", bg: "#f0f0f0", color: "#616161" },
};


function MyBookingStatus() {
  const [bookings, setBookings] = useState(null);
  const arrivalAccess = useArrivalAccess();

  useEffect(() => {
    fetch(`${API_BASE}/bookings/mine`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setBookings(data.bookings || []))
      .catch(() => setBookings([]));
  }, []);

  if (!bookings || bookings.length === 0) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = [...bookings]
    .filter((b) => new Date(b.end_date) >= today)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0] || bookings[0];

  const style = STATUS_STYLES[current.status] || STATUS_STYLES.pending;
  const dateRange = `${new Date(current.start_date).toLocaleDateString()} – ${new Date(
    current.end_date
  ).toLocaleDateString()}`;

  return (
    <section className="feature-grid" style={{ marginBottom: "1rem" }}>
      <div className="feature-box feature-box-accent">
        <h2>Your booking</h2>
        <p>
          {dateRange}
          {current.purpose ? ` — ${current.purpose}` : ""}
        </p>
        <span
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{ background: style.bg, color: style.color, display: "inline-block", marginTop: "0.5rem" }}
        >
          {style.label}
        </span>
        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link to="/bookings" className="link-text">
            View my bookings →
          </Link>
          {arrivalAccess === "allowed" && (
            <Link to="/arrival" className="link-text">
              Arrival information →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function HomePage() {
  const { user } = useAuth();
  const [hero, setHero] = useState(null);
  const bookingLink = user ? "/bookings/new" : "/login";

  useEffect(() => {
    fetch(`${API_BASE}/content/public/home`)
      .then((res) => res.json())
      .then((data) => setHero((data.items || []).find((i) => i.block_type === "heading") || null))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO SECTION */}
      <section
        style={{
          backgroundImage:
            "linear-gradient(rgba(26, 26, 26, 0.6), rgba(26, 26, 26, 0.6)), url(/images/Front.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="hero-section"
      >
        <h1 className="text-white">
          {hero ? hero.title : "Welcome to the Marae"}
        </h1>
        <p className="text-white/90">
          {hero ? hero.body : "A place of connection, culture, and community."}
        </p>
      </section>

      {/* A member's own booking status, if they have one — the only thing
          that differs from what a logged-out visitor sees. */}
      {user && user.role === "member" && <MyBookingStatus />}

      {/* FEATURE BOXES */}
      <section className="feature-grid">
        {FEATURES.map(({ to, title, description }) => (
          <Link key={to} to={to} className="feature-box">
            <h2>{title}</h2>
            <p>{description}</p>
            <span className="link-text">Learn more →</span>
          </Link>
        ))}

        {/* Booking box — styled the same, but with an accent border to draw the eye */}
        <Link
          to={bookingLink}
          state={!user ? { from: { pathname: "/bookings/new" } } : undefined}
          className="feature-box feature-box-accent"
        >
          <h2>Make a Booking</h2>
          <p>
            Renting the marae for a hui, wānanga, tangihanga or other event? Start your
            booking request here.
          </p>
          <span className="link-text">
            {user ? "Request a booking →" : "Log in to book →"}
          </span>
        </Link>
      </section>
    </div>
  );
}

export default HomePage;
