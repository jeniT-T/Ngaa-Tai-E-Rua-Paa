// frontend/src/hooks/usePageContent.js
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Shared by every public/marae-info page. Fetches whatever content an admin
// has placed on `page` via the Content Manager and splits it into:
//   - heading: the single item (if any) marked as block_type "heading" —
//     used to override a page's title/intro text.
//   - sections: every item marked "section" — rendered as the page's list
//     of cards/paragraphs, grouped by their `category` if the page needs
//     grouping (e.g. the arrival guide's equipment/cleaning/facilities).
// Every page that uses this keeps its original hardcoded content as a
// fallback, so nothing breaks if the CMS has nothing for that page yet.
export default function usePageContent(page) {
  const [heading, setHeading] = useState(null);
  const [sections, setSections] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/content/public/${page}`);
        const data = await res.json();
        if (cancelled || !res.ok) return;
        const items = data.items || [];
        setHeading(items.find((i) => i.block_type === "heading") || null);
        setSections(items.filter((i) => i.block_type === "section"));
      } catch {
        // Content service unreachable — pages fall back to their default copy.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return { heading, sections, loaded };
}
