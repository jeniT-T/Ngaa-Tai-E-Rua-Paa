import { useEffect, useState } from "react";
import ContentImage from "../components/ContentImage.jsx";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

async function loadPageContent(page, setHeading, setSections, setGallery) {
  try {
    const res = await fetch(`${API_BASE}/content/public/${page}`);
    const data = await res.json();
    if (!res.ok) return;
    const items = data.items || [];
    setHeading(items.find((i) => i.block_type === "heading") || null);
    setSections(items.filter((i) => i.block_type === "section"));
    setGallery(items.filter((i) => i.block_type === "gallery"));
  } catch {
    // Content service unreachable — fall back to the page's default copy below.
  }
}

function HistoryPage() {
  const [heading, setHeading] = useState(null);
  const [sections, setSections] = useState([]);
  // The Top.jpg/Flag.jpg gallery was hardcoded (§5) — now admin-uploaded
  // "gallery" content items if any have been added (Content Manager →
  // History page), falling back to the original two photos so nothing
  // changes until an admin actually replaces them.
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    loadPageContent("history", setHeading, setSections, setGallery);
  }, []);

  return (
    <div className="px-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-4">
        {heading ? heading.title : "History of the Marae"}
      </h1>

      {heading && <ContentImage item={heading} />}

      <div className="grid grid-cols-2 gap-3 mb-8">
        {gallery.length > 0 ? (
          gallery.map((item) => (
            <ContentImage
              key={item.id}
              item={item}
              className="rounded-xl object-cover w-full h-48"
              style={{ maxHeight: "none", marginBottom: 0 }}
            />
          ))
        ) : (
          <>
            <img
              src="/images/Top.jpg"
              alt="Aerial view of Ngaa Tai E Rua Paa and its grounds"
              className="rounded-xl object-cover w-full h-48"
            />
            <img
              src="/images/Flag.jpg"
              alt="The memorial and flagpoles at Ngaa Tai E Rua Paa"
              className="rounded-xl object-cover w-full h-48"
            />
          </>
        )}
      </div>

      {!heading && (
        <p className="text-gray-500 italic mb-8">
          Placeholder content — replace with the marae's real history and whakapapa.
        </p>
      )}

      <div className="space-y-6 text-gray-700 leading-relaxed">
        {heading?.body && <p className="whitespace-pre-line">{heading.body}</p>}

        {sections.length > 0 ? (
          sections.map((item) => (
            <div key={item.id}>
              <ContentImage item={item} />
              {item.title && (
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h2>
              )}
              <p className="whitespace-pre-line">{item.body}</p>
            </div>
          ))
        ) : !heading ? (
          <>
            <p>
              For generations, this marae has stood as a gathering place for whānau, hapū and
              the wider community — a home for hui, wānanga, tangihanga and celebrations alike.
              It carries the stories, values and mana of the people who built and cared for it.
            </p>
            <p>
              The wharenui was built to honour our tūpuna, and every carving, tukutuku panel
              and kōwhaiwhai pattern inside tells part of that story. Visitors are welcome to
              learn about this history during their stay — ask the caretaker or host for more
              details.
            </p>
            <p>
              Today, the marae continues to serve as a living connection between the past and
              present, open to whānau and manuhiri who come to learn, celebrate and reconnect.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default HistoryPage;
