
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

export const DEFAULT_SETTINGS = {
  site_name: "Manage My Marae",
  secondary_colour: "#0081BD",
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
  window.dispatchEvent(new Event("site-settings-updated"));
}

export default function useSiteSettings() {
  const [settings, setSettings] = useState(cached || DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let active = true;
    const refresh = () => fetchSettings().then((result) => {
      if (active) {
        setSettings(result);
        setLoading(false);
      }
    });
    refresh();
    window.addEventListener("site-settings-updated", refresh);
    return () => {
      window.removeEventListener("site-settings-updated", refresh);
      active = false;
    };
  }, []);

  return { settings, loading };
}
