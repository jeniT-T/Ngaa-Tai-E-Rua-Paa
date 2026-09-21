import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const FEATURES = [
  {
    to: "/history",
    icon: "🏛️",
    title: "History of the Marae",
    description:
      "Learn the story of our whare, our whakapapa, and the people who have cared for this place.",
  },
  {
    to: "/facilities",
    icon: "🏠",
    title: "Available Facilities",
    description:
      "See the wharenui, wharekai, accommodation and grounds available for your stay or event.",
  },
];

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

      {/* FEATURE BOXES */}
      <section className="feature-grid">
        {FEATURES.map(({ to, icon, title, description }) => (
          <Link key={to} to={to} className="feature-box">
            <span className="icon">{icon}</span>
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
          <span className="icon">📅</span>
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
