
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;


export default function usePageContent(page) {
  const [heading, setHeading] = useState(null);
  const [sections, setSections] = useState([]);
  // Plain admin-uploaded photos (block_type "gallery") — no title/body
  // rendered alongside them, just the image. Added for the History page's
  // and Health & Safety page's previously-hardcoded images; any other page
  // can use this too now, it just starts empty.
  const [gallery, setGallery] = useState([]);
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
        setGallery(items.filter((i) => i.block_type === "gallery"));
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

  return { heading, sections, gallery, loaded };
}
