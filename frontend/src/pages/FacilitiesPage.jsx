import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const DEFAULT_FACILITIES = [
  {
    title: "Wharenui",
    description: "Our meeting house, seating up to 120 for hui, wānanga and overnight stays.",
  },
  {
    title: "Wharekai / Dining Hall",
    description: "A full dining hall and commercial kitchen for catering large groups.",
  },
  {
    title: "Accommodation",
    description: "Mattress room and sleeping spaces for manuhiri staying overnight.",
  },
  {
    title: "Ablution Blocks",
    description: "Multiple toilet and shower facilities, including an accessible option.",
  },
  {
    title: "Parking",
    description: "Front and back carparks with additional roadside parking for events.",
  },
  {
    title: "Grounds",
    description: "Open outdoor space suitable for gatherings, ceremonies and parking overflow.",
  },
];

// Bigger boxes for the marae-wide info pages that live alongside the
// facilities list — health & safety and the rules & regulations that used
// to only be reachable from deep inside the (now booking-gated) arrival guide.
const MORE_INFO = [
  {
    to: "/health-and-safety",
    icon: "🩹",
    title: "Health & Safety",
    description: "Emergency procedures, first aid and safety information for anyone on site.",
  },
  {
    to: "/arrival/rules",
    icon: "📋",
    title: "Rules & Regulations",
    description: "What's expected of everyone hiring or visiting the marae.",
  },
];

function FacilitiesPage() {
  const [heading, setHeading] = useState(null);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/content/public/facilities`)
      .then((res) => res.json())
      .then((data) => {
        const items = data.items || [];
        setHeading(items.find((i) => i.block_type === "heading") || null);
        setSections(items.filter((i) => i.block_type === "section"));
      })
      .catch(() => {});
  }, []);

  const facilities = sections.length > 0
    ? sections.map((s) => ({ title: s.title, description: s.body }))
    : DEFAULT_FACILITIES;

  return (
    <div className="px-6 py-16 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-4">
        {heading ? heading.title : "Available Facilities"}
      </h1>
      {heading?.body ? (
        <p className="text-gray-600 mb-8 whitespace-pre-line">{heading.body}</p>
      ) : (
        <p className="text-gray-500 italic mb-8">
          Placeholder content — replace with the marae's actual facilities and capacities.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 mb-12">
        {facilities.map(({ title, description }) => (
          <div
            key={title}
            className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      {/* Map */}
      <Link
        to="/map"
        className="block p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 mb-8"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">🗺️ Find your way around</h2>
        <p className="text-gray-600">
          See where everything is on an interactive map of the grounds →
        </p>
      </Link>

      {/* Health & Safety / Rules & Regulations */}
      <div className="grid gap-5 sm:grid-cols-2">
        {MORE_INFO.map(({ to, icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className="p-8 rounded-2xl border-2 border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <span className="text-3xl">{icon}</span>
            <h2 className="text-xl font-semibold text-gray-900 mt-2 mb-1">{title}</h2>
            <p className="text-gray-600">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default FacilitiesPage;
