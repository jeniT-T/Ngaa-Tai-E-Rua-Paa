// frontend/src/pages/admin/ArrivalContentEditorPage.jsx
//
// A dedicated editor for the arrival guide's dropdown items — ported from
// the teammate's ArrivalEditPage design (per-item color picker, grouped
// sidebar, live video preview), but wired to the shared content_items
// table/API instead of a separate arrival_items table, so every item here
// is the same data the public Content Manager could also edit, and stays
// consistent with the access-gating and CMS architecture used everywhere
// else on the site.
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getYoutubeEmbedUrl } from "../../utils/youtube.js";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const GROUP_OPTIONS = [
  { value: "equipment", label: "Equipment & Appliances" },
  { value: "cleaning", label: "Cleaning Instructions" },
  { value: "facilities", label: "Facilities & General Information" },
];
const KNOWN_GROUPS = GROUP_OPTIONS.map((g) => g.value);

const EMPTY_FORM = {
  id: null,
  groupKey: "equipment",
  title: "",
  color: "#2c3e50",
  body: "",
  youtubeUrl: "",
};

const EMPTY_HEADING_FORM = { id: null, title: "", body: "" };

export default function ArrivalContentEditorPage() {
  const [items, setItems] = useState([]);
  const [heading, setHeading] = useState(EMPTY_HEADING_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingHeading, setSavingHeading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    refreshItems();
  }, []);

  async function refreshItems() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/content`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load content");

      const arrivalItems = data.items.filter((i) => i.placement === "arrival");
      setItems(arrivalItems.filter((i) => i.block_type !== "heading"));

      const headingItem = arrivalItems.find((i) => i.block_type === "heading");
      setHeading(
        headingItem
          ? { id: headingItem.id, title: headingItem.title, body: headingItem.body }
          : EMPTY_HEADING_FORM
      );
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startNewItem() {
    setForm(EMPTY_FORM);
    setIsNew(true);
    setError(null);
  }

  function startEditItem(item) {
    setForm({
      id: item.id,
      groupKey: KNOWN_GROUPS.includes(item.category) ? item.category : "facilities",
      title: item.title,
      color: item.color || "#2c3e50",
      body: item.body || "",
      youtubeUrl: item.video_url || "",
    });
    setIsNew(false);
    setError(null);
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // placement/blockType must always be sent explicitly — the API writes
  // them as-given (not merged), so omitting them would clear the item off
  // the arrival page entirely.
  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        category: form.groupKey,
        placement: "arrival",
        blockType: "section",
        videoUrl: form.youtubeUrl,
        color: form.color,
      };
      const res = await fetch(
        isNew ? `${API_BASE}/content` : `${API_BASE}/content/${form.id}`,
        {
          method: isNew ? "POST" : "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save item");
      await refreshItems();
      startEditItem(data.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/content/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      if (form.id === item.id) startNewItem();
      await refreshItems();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleHeadingSubmit(e) {
    e.preventDefault();
    setSavingHeading(true);
    setError(null);
    try {
      const payload = {
        title: heading.title || "Marae Facilities & Operations Guide",
        body: heading.body,
        placement: "arrival",
        blockType: "heading",
      };
      const res = await fetch(
        heading.id ? `${API_BASE}/content/${heading.id}` : `${API_BASE}/content`,
        {
          method: heading.id ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save heading");
      setHeading({ id: data.item.id, title: data.item.title, body: data.item.body });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingHeading(false);
    }
  }

  const embedPreview = getYoutubeEmbedUrl(form.youtubeUrl);
  const groupedItems = [
    ...GROUP_OPTIONS,
    ...(items.some((i) => !KNOWN_GROUPS.includes(i.category))
      ? [{ value: "__other__", label: "Other" }]
      : []),
  ].map((group) => ({
    ...group,
    items:
      group.value === "__other__"
        ? items.filter((i) => !KNOWN_GROUPS.includes(i.category))
        : items.filter((i) => i.category === group.value),
  }));

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", textAlign: "left", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ color: "#2c3e50", borderBottom: "3px solid #d4af37", paddingBottom: "16px", marginBottom: "8px" }}>Edit Arrival Guide</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link
            to="/admin/content"
            style={{ display: "inline-block", padding: "10px 16px", background: "#eee", color: "#2c3e50", borderRadius: "4px", textDecoration: "none", fontWeight: "500", fontSize: "0.95rem", whiteSpace: "nowrap" }}
          >
            ← Content Manager
          </Link>
          <Link
            to="/arrival"
            style={{ display: "inline-block", padding: "10px 16px", background: "#d4af37", color: "#2c3e50", borderRadius: "4px", textDecoration: "none", fontWeight: "500", fontSize: "0.95rem", whiteSpace: "nowrap" }}
          >
            View live page →
          </Link>
        </div>
      </div>
      <p style={{ fontSize: "1rem", color: "#777", marginBottom: "24px", fontStyle: "italic" }}>
        Add, edit or remove dropdown items shown on the arrival guide. Only admins can access this page.
      </p>

      {error && (
        <div style={{ background: "#fdecea", color: "#d32f2f", padding: "10px 14px", borderRadius: "4px", marginBottom: "16px", fontSize: "0.9rem" }}>
          {error}
        </div>
      )}

      {/* Page heading / intro */}
      <form
        onSubmit={handleHeadingSubmit}
        style={{ background: "#fafafa", padding: "20px", borderRadius: "6px", border: "1px solid #ddd", marginBottom: "32px" }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.05rem", color: "#2c3e50" }}>Page title &amp; intro text</h2>
        <label style={{ display: "block", marginBottom: "12px" }}>
          <span style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "4px" }}>Title</span>
          <input
            type="text"
            value={heading.title}
            onChange={(e) => setHeading((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Marae Facilities & Operations Guide"
            style={{ width: "100%", padding: "10px 12px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.95rem" }}
          />
        </label>
        <label style={{ display: "block", marginBottom: "12px" }}>
          <span style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "4px" }}>Intro text</span>
          <textarea
            rows={2}
            value={heading.body}
            onChange={(e) => setHeading((prev) => ({ ...prev, body: e.target.value }))}
            placeholder="Please follow these guidelines to ensure proper use of all marae facilities."
            style={{ width: "100%", padding: "10px 12px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.95rem", fontFamily: "sans-serif", resize: "vertical" }}
          />
        </label>
        <button
          type="submit"
          disabled={savingHeading}
          style={{ padding: "8px 16px", background: savingHeading ? "#999" : "#2c3e50", color: "#fff", border: "none", borderRadius: "4px", cursor: savingHeading ? "not-allowed" : "pointer", fontWeight: "500", fontSize: "0.9rem" }}
        >
          {savingHeading ? "Saving..." : "Save title & intro"}
        </button>
      </form>

      <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
        {/* Item list */}
        <div style={{ flex: "1", minWidth: "280px" }}>
          <button
            onClick={startNewItem}
            style={{
              width: "100%",
              padding: "10px 16px",
              marginBottom: "16px",
              background: "#2c3e50",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "0.95rem",
            }}
          >
            + Add New Item
          </button>
          {loading ? (
            <p style={{ color: "#777" }}>Loading items...</p>
          ) : (
            groupedItems.map((group) => (
              <div key={group.value} style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "0.95rem", color: "#2c3e50", marginBottom: "8px" }}>{group.label}</h3>
                {group.items.length === 0 ? (
                  <p style={{ color: "#999", fontSize: "0.85rem" }}>No items yet.</p>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          marginBottom: "6px",
                          borderRadius: "4px",
                          border: `1px solid ${item.color || "#2c3e50"}30`,
                          background: form.id === item.id ? `${item.color || "#2c3e50"}15` : "#fff",
                        }}
                      >
                        <button
                          onClick={() => startEditItem(item)}
                          style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", color: "#2c3e50", fontSize: "0.9rem" }}
                        >
                          {item.title}
                        </button>
                        {item.video_url && <span style={{ fontSize: "0.85rem", marginRight: "6px" }}>📹</span>}
                        <button
                          onClick={() => handleDelete(item)}
                          style={{ background: "none", border: "none", color: "#d32f2f", cursor: "pointer", fontSize: "0.85rem", marginLeft: "8px" }}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>

        {/* Edit form */}
        <div style={{ flex: "2", minWidth: "320px" }}>
          <form onSubmit={handleSubmit} style={{ background: "#fafafa", padding: "24px", borderRadius: "6px", border: "1px solid #ddd" }}>
            <h2 style={{ marginTop: 0, fontSize: "1.2rem", color: "#2c3e50" }}>{isNew ? "New Item" : `Editing: ${form.title}`}</h2>

            <label style={{ display: "block", marginBottom: "12px" }}>
              <span style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "4px" }}>Title</span>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g. Airconditioning"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.95rem" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "12px" }}>
              <span style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "4px" }}>Section</span>
              <select
                value={form.groupKey}
                onChange={(e) => handleChange("groupKey", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.95rem" }}
              >
                {GROUP_OPTIONS.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "block", marginBottom: "12px" }}>
              <span style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "4px" }}>Accent color</span>
              <input
                type="color"
                value={form.color}
                onChange={(e) => handleChange("color", e.target.value)}
                style={{ width: "60px", height: "36px", padding: "0", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "12px" }}>
              <span style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "4px" }}>Body text</span>
              <textarea
                required
                rows={10}
                value={form.body}
                onChange={(e) => handleChange("body", e.target.value)}
                placeholder="Describe the item. Use a blank line to start a new paragraph, and lines starting with • for a list."
                style={{ width: "100%", padding: "10px 12px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.95rem", fontFamily: "sans-serif", resize: "vertical" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "12px" }}>
              <span style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "4px" }}>YouTube video URL (optional)</span>
              <input
                type="url"
                value={form.youtubeUrl}
                onChange={(e) => handleChange("youtubeUrl", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.95rem" }}
              />
            </label>
            {form.youtubeUrl && !embedPreview && (
              <p style={{ color: "#d32f2f", fontSize: "0.85rem", marginTop: "-4px", marginBottom: "12px" }}>
                That doesn't look like a valid YouTube URL yet.
              </p>
            )}
            {embedPreview && (
              <div style={{ marginBottom: "16px" }}>
                <span style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "4px" }}>Preview</span>
                <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: "6px", overflow: "hidden" }}>
                  <iframe
                    src={embedPreview}
                    title="Video preview"
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "10px 20px",
                  background: saving ? "#999" : "#2c3e50",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  fontSize: "0.95rem",
                }}
              >
                {saving ? "Saving..." : isNew ? "Create Item" : "Save Changes"}
              </button>
              {!isNew && (
                <button type="button" onClick={startNewItem} style={{ padding: "10px 20px", background: "#fff", color: "#2c3e50", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer", fontWeight: "500", fontSize: "0.95rem" }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
