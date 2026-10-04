// frontend/src/pages/TutorialsViewPage.jsx
//
// Read-only view of the caretaker's tutorial content, reachable by anyone
// who currently has Marae Guide access — an approved, still-current
// booking, or caretaker/admin (same ArrivalAccessGate as /arrival and
// /checklists, see App.jsx). Same content as the caretaker's own Tutorials
// page (both read the "caretaker-tutorials" placement via usePageContent),
// just presented for a guest rather than the caretaker.
import { Link, useLocation, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import usePageContent from "../hooks/usePageContent.js";
import ContentImage from "../components/ContentImage.jsx";
import { getYoutubeEmbedUrl } from "../utils/youtube.js";

export default function TutorialsViewPage() {
  const { heading, sections, loaded } = usePageContent("caretaker-tutorials");
  const [searchTerm, setSearchTerm] = useState("");

  // Reachable from the Marae Guide (member with an active booking) or
  // either guest route (per-booking token, or the generic site-wide QR) --
  // see App.jsx and §24. The content fetch above was already public/
  // unauthenticated either way; only the back-link needs to know which
  // route got us here, same reasoning as ChecklistsViewPage.jsx.
  const { token: guestToken } = useParams();
  const location = useLocation();
  const isGuest = location.pathname.startsWith("/tutorials/guest");
  const backTo = isGuest ? (guestToken ? `/arrival/guest/${guestToken}` : "/arrival/guest") : "/arrival";

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const words = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    return sections.filter((item) => {
      const haystack = `${item.title} ${item.body || ""}`.toLowerCase();
      return words.some((word) => haystack.includes(word));
    });
  }, [sections, searchTerm]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-start gap-4 mb-2">
        <h1 className="text-2xl font-semibold">{heading ? heading.title : "Tutorials"}</h1>
        <Link to={backTo} className="text-sm underline whitespace-nowrap">
          ← Back to Marae Guide
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {heading?.body || "Guides the caretaker team uses — useful to know how things around the marae work."}
      </p>

      <div style={{ position: "relative", marginBottom: "24px" }}>
        <input
          type="search"
          aria-label="Search tutorials"
          placeholder="Search tutorials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border rounded-full px-4 py-2"
          style={{ maxWidth: "480px" }}
        />
      </div>

      {!loaded ? (
        <p className="text-gray-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">
          {searchTerm
            ? `No tutorials found matching "${searchTerm}".`
            : "No tutorials have been added yet."}
        </p>
      ) : (
        <div className="space-y-5">
          {filtered.map((item) => {
            const embedUrl = getYoutubeEmbedUrl(item.video_url);
            return (
              <div key={item.id} className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
                <ContentImage item={item} />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.body}</p>
                {embedUrl && (
                  <div
                    style={{
                      position: "relative",
                      paddingBottom: "56.25%",
                      height: 0,
                      marginTop: "16px",
                      borderRadius: "var(--radius-panel)",
                      overflow: "hidden",
                    }}
                  >
                    <iframe
                      src={embedUrl}
                      title={`${item.title} video`}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
