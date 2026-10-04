import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ContentImage from "../components/ContentImage.jsx";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

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
    ? sections.map((s) => ({ title: s.title, description: s.body, image_url: s.image_url }))
    : DEFAULT_FACILITIES;

  return (
    <div className="px-6 py-16 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-4">
        {heading ? heading.title : "Available Facilities"}
      </h1>
      {heading && <ContentImage item={heading} />}
      {heading?.body ? (
        <p className="text-gray-600 mb-8 whitespace-pre-line">{heading.body}</p>
      ) : (
        <p className="text-gray-500 italic mb-8">
          Placeholder content — replace with the marae's actual facilities and capacities.
        </p>
      )}

      {/* These 6 aren't clickable, so a light gray sets them apart from the
          Map link box below, which gets a slightly darker gray. Health &
          Safety and Rules & Regulations used to be two more boxes here —
          both are now part of the Marae Guide instead (approved booking or
          caretaker/admin only), so there's nothing to link to for a visitor
          who hasn't booked yet. */}
      <div className="grid gap-5 sm:grid-cols-2 mb-12">
        {facilities.map(({ title, description, image_url }) => (
          <div
            key={title}
            className="p-6 rounded-xl border border-gray-200 bg-gray-50 shadow-sm"
          >
            {image_url && <ContentImage item={{ title, image_url }} />}
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      {/* Map — the one remaining clickable box, a slightly darker gray
          than the 6 non-clickable facility boxes above. */}
      <Link
        to="/map"
        className="block p-6 rounded-xl border border-gray-200 bg-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Find your way around</h2>
        <p className="text-gray-600">
          See where everything is on an interactive map of the grounds →
        </p>
      </Link>
    </div>
  );
}

export default FacilitiesPage;
