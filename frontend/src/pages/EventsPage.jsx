import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ContentImage from "../components/ContentImage.jsx";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

async function loadPageContent(page, setHeading, setSections) {
  try {
    const res = await fetch(`${API_BASE}/content/public/${page}`);
    const data = await res.json();
    if (!res.ok) return;
    const items = data.items || [];
    setHeading(items.find((i) => i.block_type === "heading") || null);
    setSections(items.filter((i) => i.block_type === "section"));
  } catch {
    // Content service unreachable — fall back to the page's default copy below.
  }
}

function EventsPage() {
  const [heading, setHeading] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPageContent("events", setHeading, setSections).finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-6 py-16 max-w-4xl mx-auto text-center">
      <h1 className="text-3xl font-semibold text-gray-900 mb-4">
        {heading ? heading.title : "Events"}
      </h1>
      {heading && <ContentImage item={heading} />}
      {heading?.body && (
        <p className="text-gray-600 mb-6 whitespace-pre-line">{heading.body}</p>
      )}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : sections.length > 0 ? (
        // One event per row, in a bigger box — an admin's uploaded photo
        // (see ContentImage.jsx, from the image-upload feature) already
        // shows here automatically when a section has one; this just gives
        // it more room to be seen than the old 2-per-row grid did.
        <div className="grid gap-6 text-left">
          {sections.map((item) => (
            <div
              key={item.id}
              className="p-8 rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <ContentImage item={item} style={{ maxHeight: "420px" }} />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-10 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <p className="text-gray-600">
            There are no upcoming events listed right now. Check back soon, or{" "}
            <Link to="/contacts" className="font-medium" style={{ color: "var(--primary)" }}>
              contact us
            </Link>{" "}
            to find out what's happening at the marae.
          </p>
        </div>
      )}
    </div>
  );
}

export default EventsPage;
