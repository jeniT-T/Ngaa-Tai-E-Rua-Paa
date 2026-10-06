import { useEffect } from "react";
import useSiteSettings from "../hooks/useSiteSettings.js";

export default function SiteTheme() {
  const { settings } = useSiteSettings();
  useEffect(() => {
    const colour = /^#[0-9a-f]{6}$/i.test(settings.secondary_colour) ? settings.secondary_colour : '#0081BD';
    const root = document.documentElement.style;
    root.setProperty('--primary', colour);
    root.setProperty('--bg-tint-opacity', colour.toLowerCase() === '#0081bd' ? '0' : '0.06');
    root.setProperty('--primary-rgb', [1, 3, 5].map((start) => parseInt(colour.slice(start, start + 2), 16)).join(', '));
    root.setProperty('--primary-light', `color-mix(in srgb, ${colour} 85%, white)`);
    root.setProperty('--primary-dark', `color-mix(in srgb, ${colour} 72%, black)`);
  }, [settings.secondary_colour]);
  return null;
}
