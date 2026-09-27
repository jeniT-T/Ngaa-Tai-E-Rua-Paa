
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;


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
