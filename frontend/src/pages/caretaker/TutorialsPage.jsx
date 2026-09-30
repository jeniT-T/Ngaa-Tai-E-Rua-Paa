
import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import usePageContent from "../../hooks/usePageContent.js";
import ContentImage from "../../components/ContentImage.jsx";
import { getYoutubeEmbedUrl } from "../../utils/youtube.js";

export default function TutorialsPage() {
  const { user } = useAuth();
  const { heading, sections, loaded } = usePageContent("caretaker-tutorials");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const words = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    return sections.filter((item) => {
      const haystack = `${item.title} ${item.body || ""}`.toLowerCase();
      return words.some((word) => haystack.includes(word));
    });
  }, [sections, searchTerm]);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">{heading ? heading.title : "Caretaker Tutorials"}</h1>
      <p className="text-gray-600 mb-6">
        {heading?.body || `Kia ora ${user?.name || ""}, guides on caring for the marae.`}
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
