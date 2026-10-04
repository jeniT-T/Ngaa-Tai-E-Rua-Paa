// frontend/src/hooks/useSiteSettings.js
//
// The handful of things specific to THIS marae's identity rather than page
// content — site name/logo, the map's image + pin layout, and the booking
// form's area/type options and "whakapapa" question wording. Backed by the
// site_settings table (see backend/routes/settings.js) so an admin can
// change all of this from a form (SiteSettingsPage.jsx) instead of a
// developer editing source code — see the project doc for why this exists
// (the client may hand this product to other marae for their own use).
//
// DEFAULT_SETTINGS mirrors what used to be hardcoded in each consuming
// file, and is what every page shows while the fetch is in flight (or if it
// fails), so there's never a flash of broken/empty UI.
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

export const DEFAULT_SETTINGS = {
  site_name: "Marae System",
  logo_url: null,
  map_image_url: null,
  map_pins: [
    { type: "Entrance", x: 80, y: 61 },
    { type: "Main Facility", x: 46, y: 68 },
    { type: "Assembly area 1", x: 45, y: 16 },
    { type: "Walking Route", x: 55, y: 42 },
    { type: "Facilities", x: 18, y: 68 },
    { type: "Open Space", x: 72, y: 35 },
  ],
  booking_types: [
    { value: "standard", label: "Standard hire" },
    { value: "event", label: "Event" },
    { value: "tangihanga", label: "Tangihanga" },
  ],
  booking_areas: [
    { value: "general", label: "General area" },
    { value: "paa", label: "Entire Paa" },
  ],
  whakapapa_question_enabled: true,
  whakapapa_question_label: "Do you whakapapa to the Paa?",
};

// Cached at module scope — every page that mounts this hook (Navbar, Map,
// both booking forms, both booking lists) would otherwise each fire their
// own fetch on every navigation. Good for the lifetime of one page load;
// an admin's own save invalidates it immediately (see below) so their
// Site Settings page reflects its own changes without a full reload.
let cached = null;
let inFlight = null;

function fetchSettings() {
  if (cached) return Promise.resolve(cached);
  if (inFlight) return inFlight;
  inFlight = fetch(`${API_BASE}/settings`)
    .then((res) => res.json())
    .then((data) => {
      cached = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
      return cached;
    })
    .catch(() => DEFAULT_SETTINGS)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export function invalidateSiteSettingsCache() {
  cached = null;
}

export default function useSiteSettings() {
  const [settings, setSettings] = useState(cached || DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let active = true;
    fetchSettings().then((result) => {
      if (active) {
        setSettings(result);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { settings, loading };
}
