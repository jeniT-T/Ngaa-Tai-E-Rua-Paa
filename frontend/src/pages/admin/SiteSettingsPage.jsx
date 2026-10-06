// frontend/src/pages/admin/SiteSettingsPage.jsx
//
// The handful of things specific to THIS marae's identity rather than page
// content — see database/migration_site_settings.sql and
// frontend/src/hooks/useSiteSettings.js for the full rationale (the client
// may hand this product to a different marae, which previously meant a
// developer editing source code for its branding, map and booking-form
// wording). Everything else — History, Facilities, Contact Us, the Marae
// Guide, Events, and so on — is still edited from Content Manager; this
// page is deliberately narrow, covering only what Content Manager can't.
import { useEffect, useState } from "react";
import { resolveImageUrl } from "../../utils/media.js";
import { invalidateSiteSettingsCache } from "../../hooks/useSiteSettings.js";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

function ImageField({ label, hint, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const previewSrc = resolveImageUrl(value);

  async function handleSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let picking the same file again re-trigger onChange
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch(`${API_BASE}/content/upload`, {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload image");
      onChange(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      {previewSrc && (
        <img
          src={previewSrc}
          alt=""
          className="mb-2 rounded border"
          style={{ maxHeight: "160px", objectFit: "cover" }}
        />
      )}
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleSelect}
          disabled={uploading}
          className="text-sm"
        />
        {uploading && <span className="text-xs text-gray-500">Uploading...</span>}
        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="btn btn-error btn-danger-action btn-compact"
          >
            Remove (use default)
          </button>
        )}
      </div>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

// Shared editor for "booking types" and "booking areas" — both are just a
// list of {value, label}.
function OptionListEditor({ label, hint, options, onChange }) {
  function updateOption(index, field, fieldValue) {
    onChange(options.map((o, i) => (i === index ? { ...o, [field]: fieldValue } : o)));
  }
  function removeOption(index) {
    onChange(options.filter((_, i) => i !== index));
  }
  function addOption() {
    onChange([...options, { value: "", label: "" }]);
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="value (e.g. wedding)"
              value={option.value}
              onChange={(e) => updateOption(index, "value", e.target.value)}
              className="w-1/3 border rounded px-2 py-1 text-sm"
            />
            <input
              type="text"
              placeholder="Label people see"
              value={option.label}
              onChange={(e) => updateOption(index, "label", e.target.value)}
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
            <button type="button" onClick={() => removeOption(index)} className="text-red-600 text-sm px-2">
              Remove
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addOption} className="text-sm border rounded px-3 py-1 mt-2">
        + Add option
      </button>
    </div>
  );
}

function MapPinsEditor({ pins, onChange }) {
  function updatePin(index, field, value) {
    onChange(pins.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }
  function removePin(index) {
    onChange(pins.filter((_, i) => i !== index));
  }
  function addPin() {
    onChange([...pins, { type: "", x: 50, y: 50 }]);
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Map pins</label>
      <p className="text-xs text-gray-500 mb-2">
        A pin's number on the map is its position in this list — the 1st pin here is "1" on
        the map, and matches the 1st item under Content Manager → Map page for its name,
        description and photo. Adding, removing or reordering a pin shifts which Content
        Manager item it matches, so update those to line up again.
      </p>
      <div className="space-y-2">
        {pins.map((pin, index) => (
          <div key={index} className="flex gap-2 items-center">
            <span className="text-xs text-gray-400 w-6">#{index + 1}</span>
            <input
              type="text"
              placeholder="Category label (e.g. Entrance)"
              value={pin.type}
              onChange={(e) => updatePin(index, "type", e.target.value)}
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={pin.x}
              onChange={(e) => updatePin(index, "x", Number(e.target.value))}
              title="Horizontal position, % from the left"
              className="w-20 border rounded px-2 py-1 text-sm"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={pin.y}
              onChange={(e) => updatePin(index, "y", Number(e.target.value))}
              title="Vertical position, % from the top"
              className="w-20 border rounded px-2 py-1 text-sm"
            />
            <button type="button" onClick={() => removePin(index)} className="text-red-600 text-sm px-2">
              Remove
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-1">x / y are % position on the map image (0-100).</p>
      <button type="button" onClick={addPin} className="text-sm border rounded px-3 py-1 mt-2">
        + Add pin
      </button>
    </div>
  );
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then((res) => res.json())
      .then((data) => setSettings(data.settings))
      .catch(() => setLoadError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  function update(field, value) {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSavedAt(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Drop any list rows the admin added but never filled in, rather than
    // bouncing the whole save over a blank row.
    const bookingTypes = settings.booking_types.filter((o) => o.value || o.label);
    const bookingAreas = settings.booking_areas.filter((o) => o.value || o.label);
    const mapPins = settings.map_pins.filter((p) => p.type || p.x !== 50 || p.y !== 50);

    if (bookingTypes.length === 0) {
      setError("There needs to be at least one booking type.");
      return;
    }
    if (bookingAreas.length === 0) {
      setError("There needs to be at least one booking area.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: settings.site_name,
          secondaryColour: settings.secondary_colour || "#0081BD",
          logoUrl: settings.logo_url,
          mapImageUrl: settings.map_image_url,
          mapPins,
          bookingTypes,
          bookingAreas,
          whakapapaQuestionEnabled: settings.whakapapa_question_enabled,
          whakapapaQuestionLabel: settings.whakapapa_question_label,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      setSettings(data.settings);
      invalidateSiteSettingsCache();
      setSavedAt(Date.now());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 max-w-2xl mx-auto">Loading...</div>;
  }
  if (loadError || !settings) {
    return <div className="p-8 max-w-2xl mx-auto text-red-600">{loadError || "Failed to load settings."}</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Site Settings</h1>
      <p className="text-gray-600 mb-8">
        The handful of things specific to this marae rather than page content — its name and
        logo, the map, and the booking form's own wording. Everything else (History,
        Facilities, Contact Us, the Marae Guide, and so on) is edited from Content Manager.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-medium mb-1">Site name</label>
          <p className="text-xs text-gray-500 mb-2">
            Shown next to the logo in the navigation bar, and as the browser tab title.
          </p>
          <input
            type="text"
            value={settings.site_name}
            onChange={(e) => update("site_name", e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="secondaryColour" className="block text-sm font-medium mb-1">Secondary colour</label>
          <p className="text-xs text-gray-500 mb-2">
            Choose the accent used for navigation, buttons, links and background highlights. Applies across the site after saving.
          </p>
          <div className="flex items-center gap-3">
            <input
              id="secondaryColour"
              type="color"
              value={settings.secondary_colour || "#0081BD"}
              onChange={(event) => update("secondary_colour", event.target.value)}
              className="h-12 w-16 cursor-pointer"
            />
            <span>{settings.secondary_colour || "#0081BD"}</span>
            <button type="button" className="btn btn-outline btn-compact" onClick={() => update("secondary_colour", "#0081BD")}>
              Return to default
            </button>
          </div>
        </div>

        <ImageField
          label="Logo"
          hint="Shown in the navigation bar. Leave empty to use the default logo."
          value={settings.logo_url}
          onChange={(url) => update("logo_url", url)}
        />

        <ImageField
          label="Map image"
          hint="The background image on the Map page, that pins sit on top of. Leave empty to use the default map."
          value={settings.map_image_url}
          onChange={(url) => update("map_image_url", url)}
        />

        <MapPinsEditor pins={settings.map_pins} onChange={(pins) => update("map_pins", pins)} />

        <OptionListEditor
          label="Booking types"
          hint="The options on the booking form's 'Type of booking' dropdown."
          options={settings.booking_types}
          onChange={(v) => update("booking_types", v)}
        />

        <OptionListEditor
          label="Booking areas"
          hint="The options on the booking form's 'Which area do you need?' dropdown."
          options={settings.booking_areas}
          onChange={(v) => update("booking_areas", v)}
        />

        <div>
          <div className="flex items-center gap-2 mb-1">
            <input
              id="whakapapaEnabled"
              type="checkbox"
              checked={settings.whakapapa_question_enabled}
              onChange={(e) => update("whakapapa_question_enabled", e.target.checked)}
            />
            <label htmlFor="whakapapaEnabled" className="text-sm font-medium">
              Ask a "whakapapa" question on the booking form
            </label>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Some marae ask whether the person booking has whakapapa ties to the marae. Turn
            this off if that doesn't apply here.
          </p>
          {settings.whakapapa_question_enabled && (
            <input
              type="text"
              value={settings.whakapapa_question_label}
              onChange={(e) => update("whakapapa_question_label", e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          )}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary btn-action">
            {saving ? "Saving..." : "Save settings"}
          </button>
          {savedAt && <span className="text-sm text-green-700">Saved</span>}
        </div>
      </form>
    </div>
  );
}
