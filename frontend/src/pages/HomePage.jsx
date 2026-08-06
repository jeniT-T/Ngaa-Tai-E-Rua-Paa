import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

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
  const bookingLink = user ? "/bookings" : "/login";

  return (
    <div>
      {/* HERO SECTION */}
      <section
        style={{
          backgroundImage:
            "linear-gradient(rgba(8,6,13,0.55), rgba(8,6,13,0.55)), url(/images/Front.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="text-white px-6 py-24 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-semibold mb-4">
          Welcome to the Marae
        </h1>
        <p className="text-lg md:text-xl max-w-xl mx-auto text-white/90">
          A place of connection, culture, and community.
        </p>
      </section>

      {/* FEATURE BOXES */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ to, icon, title, description }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-start gap-3 p-8 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <span className="text-4xl">{icon}</span>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-gray-600 leading-relaxed">{description}</p>
              <span className="mt-auto pt-2 text-sm font-medium" style={{ color: "#0081bd" }}>
                Learn more →
              </span>
            </Link>
          ))}

          {/* Booking box — styled the same, but with an accent border to draw the eye */}
          <Link
            to={bookingLink}
            className="flex flex-col items-start gap-3 p-8 rounded-2xl border-2 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            style={{ borderColor: "#0081bd", background: "rgba(144, 222, 255, 0.12)" }}
          >
            <span className="text-4xl">📅</span>
            <h2 className="text-xl font-semibold text-gray-900">Make a Booking</h2>
            <p className="text-gray-600 leading-relaxed">
              Renting the marae for a hui, wānanga, tangihanga or other event? Start your
              booking request here.
            </p>
            <span className="mt-auto pt-2 text-sm font-medium" style={{ color: "#0081bd" }}>
              {user ? "Request a booking →" : "Log in to book →"}
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
