import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import useArrivalAccess from "../../hooks/useArrivalAccess.js";

export default function MemberHomePage() {
  const { user } = useAuth();
  const arrivalAccess = useArrivalAccess();

  const links = [
    {
      to: "/bookings",
      icon: "",
      title: "My Bookings",
      description: "See the status of your booking requests, or edit/cancel one.",
    },
    {
      to: "/bookings/new",
      icon: "",
      title: "Request a Booking",
      description: "Hire the marae for a hui, wānanga, tangihanga or other event.",
    },
    ...(arrivalAccess === "allowed"
      ? [
          {
            to: "/arrival",
            icon: "📍",
            title: "Arrival Information",
            description: "Parking, keys, wifi, and everything else you need for your stay.",
          },
        ]
      : []),
    {
      to: "/report-issue",
      icon: "",
      title: "Report an Issue",
      description: "Let the marae team know if something needs attention.",
    },
  ];

  return (
    <div className="px-6 py-16 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Kia ora, {user?.name}</h1>
      <p className="text-gray-600 mb-10">Here's what you can do from here.</p>

      <div className="grid gap-6 md:grid-cols-2">
        {links.map(({ to, icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-start gap-3 p-8 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <span className="text-4xl">{icon}</span>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600 leading-relaxed">{description}</p>
            <span className="mt-auto pt-2 text-sm font-medium" style={{ color: "#0081bd" }}>
              Open →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
