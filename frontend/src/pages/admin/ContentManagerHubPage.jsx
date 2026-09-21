// frontend/src/pages/admin/ContentManagerHubPage.jsx
import { Link } from "react-router-dom";

// Landing page for the Content Manager. Rather than one long scrolling list
// of every content item on the site, admins pick which page they want to
// edit first, then land on a view scoped to just that page's items.
// The arrival guide is special-cased to its own dedicated editor (better
// suited to managing 40+ individual dropdown items — color, video, group).
const PAGES = [
  { to: "/admin/arrival", icon: "🧭", title: "Arrival Guide", description: "The main dropdown list of equipment, cleaning and facilities info." },
  { to: "/admin/content/edit?page=home", icon: "🏠", title: "Home Page", description: "Hero heading and intro text." },
  { to: "/admin/content/edit?page=history", icon: "🏛️", title: "History Page", description: "Heading and story sections." },
  { to: "/admin/content/edit?page=facilities", icon: "🏠", title: "Facilities Page", description: "Heading and facility cards." },
  { to: "/admin/content/edit?page=events", icon: "📅", title: "Events Page", description: "Heading and upcoming event cards." },
  { to: "/admin/content/edit?page=contacts", icon: "☎️", title: "Contact Us Page", description: "Heading and contact cards." },
  { to: "/admin/content/edit?page=health-and-safety", icon: "🩹", title: "Health & Safety Page", description: "Heading and evacuation info." },
  { to: "/admin/content/edit?page=map", icon: "🗺️", title: "Map Page", description: "Heading, intro text and the 6 map pin labels/descriptions." },
  { to: "/admin/content/edit?page=arrival-emergency", icon: "🚨", title: "Arrival → Emergency Page", description: "Evacuation points and procedures." },
  { to: "/admin/content/edit?page=arrival-rules", icon: "📋", title: "Arrival → Rules Page", description: "Rules and regulations." },
  { to: "/admin/content/edit?page=", icon: "📚", title: "Library Only (Internal)", description: "Content shown in the logged-in content library, not on a public page." },
];

export default function ContentManagerHubPage() {
  return (
    <div className="px-6 py-16 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Content Manager</h1>
      <p className="text-gray-600 mb-10">Choose which page you'd like to edit.</p>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PAGES.map(({ to, icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-start gap-2 p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <span className="text-3xl">{icon}</span>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            <span className="mt-auto pt-2 text-sm font-medium" style={{ color: "#0081bd" }}>
              Edit →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
