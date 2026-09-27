import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import useArrivalAccess from "../hooks/useArrivalAccess.js";
import { resolveImageUrl } from "../utils/media.js";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

// The "Explore" section below — the same three destinations that used to be
// split between homepage feature boxes (History, Facilities) and a navbar
// link (Events, see Navbar.jsx). Brought together here in one place.
const EXPLORE = [
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
  {
    to: "/events",
    title: "Upcoming Events",
    description:
      "See what's coming up at the marae — hui, wānanga and community gatherings.",
  },
];

const STATUS_STYLES = {
  pending: { label: "Pending review", bg: "#fff8e1", color: "#8a6d00" },
  approved: { label: "Approved", bg: "#e8f5e9", color: "#1b5e20" },
  denied: { label: "Denied", bg: "#fdecea", color: "#b71c1c" },
  cancelled: { label: "Cancelled", bg: "#f0f0f0", color: "#616161" },
};

// A member's own upcoming/current booking, if they have one — the one
// piece of "dashboard" a regular member actually needs. Logged-out
// visitors and members with no booking never see this section, so the
// homepage stays identical for both.
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

  // Show whichever booking is most relevant: the soonest one that hasn't
  // ended yet, or failing that, the most recent one overall.
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

  // An admin can replace the default hero photo by uploading an image on the
  // home page's heading item in the Content Manager — falls back to the
  // original hardcoded photo if none has been set.
  const heroImage = resolveImageUrl(hero?.image_url) || "/images/Front.jpg";

  return (
    <div>
      {/* HERO SECTION — sized up (~50% taller, see .hero-section in
          index.css). The photo itself is admin-changeable from the Content
          Manager (upload an image on this page's heading item) and falls
          back to the original hardcoded photo if none has been set. */}
      <section
        style={{
          backgroundImage: `linear-gradient(rgba(26, 26, 26, 0.6), rgba(26, 26, 26, 0.6)), url(${heroImage})`,
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

      {/* EXPLORE — a light gray band grouping the three "learn about the
          marae" destinations (History, Facilities, Events) that used to be
          scattered between homepage boxes and a navbar link. */}
      <section style={{ background: "var(--bg-secondary)", padding: "var(--spacing-2xl) 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 var(--spacing-lg)" }}>
          <h2 style={{ textAlign: "center", marginBottom: "var(--spacing-xl)" }}>Explore</h2>
          <div className="feature-grid" style={{ padding: 0 }}>
            {EXPLORE.map(({ to, title, description }) => (
              <Link key={to} to={to} className="feature-box">
                <h2>{title}</h2>
                <p>{description}</p>
                <span className="link-text">Learn more →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — a slightly darker gray band with the one clear "book now"
          prompt, replacing the old accent feature-box for this. */}
      <section style={{
        background: "var(--bg-tertiary)",
        padding: "var(--spacing-2xl) var(--spacing-lg)",
        textAlign: "center",
      }}>
        <h2 style={{ marginBottom: "var(--spacing-lg)" }}>Interested in hiring the marae?</h2>
        <Link
          to={bookingLink}
          state={!user ? { from: { pathname: "/bookings/new" } } : undefined}
          className="btn btn-primary"
        >
          {user ? "Book now" : "Log in to book"}
        </Link>
      </section>
    </div>
  );
}

export default HomePage;
