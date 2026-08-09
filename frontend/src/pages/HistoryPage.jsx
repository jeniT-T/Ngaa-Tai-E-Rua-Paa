import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

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

function HistoryPage() {
  const [heading, setHeading] = useState(null);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    loadPageContent("history", setHeading, setSections);
  }, []);

  return (
    <div className="px-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-4">
        {heading ? heading.title : "History of the Marae"}
      </h1>

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
