import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getArrivalItems,
  createArrivalItem,
  updateArrivalItem,
  deleteArrivalItem,
  getYoutubeEmbedUrl,
} from "../api/arrivalItems";

const GROUP_OPTIONS = [
  { value: "equipment", label: "Equipment & Appliances" },
  { value: "cleaning", label: "Cleaning Instructions" },
  { value: "facilities", label: "Facilities & General Information" },
];

const EMPTY_FORM = {
  id: null,
  itemKey: "",
  groupKey: "equipment",
  title: "",
  color: "#2c3e50",
  body: "",
  youtubeUrl: "",
};

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ArrivalEditPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    refreshItems();
  }, []);

  async function refreshItems() {
    setLoading(true);
    try {
      const data = await getArrivalItems();
      setItems(data);
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
      itemKey: item.item_key,
      groupKey: item.group_key,
      title: item.title,
      color: item.color || "#2c3e50",
      body: item.body || "",
      youtubeUrl: item.youtube_url || "",
    });
    setIsNew(false);
    setError(null);
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const itemKey = form.itemKey.trim() || slugify(form.title);
        const created = await createArrivalItem({
          itemKey,
          groupKey: form.groupKey,
          title: form.title,
          color: form.color,
          body: form.body,
          youtubeUrl: form.youtubeUrl,
        });
        await refreshItems();
        startEditItem(created);
      } else {
        const updated = await updateArrivalItem(form.id, {
          groupKey: form.groupKey,
          title: form.title,
          color: form.color,
          body: form.body,
          youtubeUrl: form.youtubeUrl,
        });
        await refreshItems();
        startEditItem(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await deleteArrivalItem(item.id);
      if (form.id === item.id) startNewItem();
      await refreshItems();
    } catch (err) {
      setError(err.message);
    }
  }

  const embedPreview = getYoutubeEmbedUrl(form.youtubeUrl);

  const groupedItems = GROUP_OPTIONS.map((group) => ({
    ...group,
    items: items.filter((item) => item.group_key === group.value),
  }));

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", textAlign: "left", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ color: "#2c3e50", borderBottom: "3px solid #d4af37", paddingBottom: "16px", marginBottom: "8px" }}>Edit Arrival Info</h1>
        <Link
          to="/arrival"
          style={{
            display: "inline-block",
            padding: "10px 16px",
            background: "#d4af37",
            color: "#2c3e50",
            borderRadius: "4px",
            textDecoration: "none",
            fontWeight: "500",
            fontSize: "0.95rem",
            whiteSpace: "nowrap",
          }}
        >
          ← Back to Arrival Page
        </Link>
      </div>
      <p style={{ fontSize: "1rem", color: "#777", marginBottom: "24px", fontStyle: "italic" }}>
        Add or edit an item below. Changes are saved immediately and will show up on the Arrival page. This page currently has no access restrictions.
      </p>

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
                          border: `1px solid ${item.color}30`,
                          background: form.id === item.id ? `${item.color}15` : "#fff",
                        }}
                      >
                        <button
                          onClick={() => startEditItem(item)}
                          style={{
                            flex: 1,
                            textAlign: "left",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#2c3e50",
                            fontSize: "0.9rem",
                          }}
                        >
                          {item.title}
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#d32f2f",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            marginLeft: "8px",
                          }}
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

            {error && (
              <div style={{ background: "#fdecea", color: "#d32f2f", padding: "10px 14px", borderRadius: "4px", marginBottom: "16px", fontSize: "0.9rem" }}>
                {error}
              </div>
            )}

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

            {isNew && (
              <label style={{ display: "block", marginBottom: "12px" }}>
                <span style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "4px" }}>
                  Item key (unique, optional — auto-generated from title if left blank)
                </span>
                <input
                  type="text"
                  value={form.itemKey}
                  onChange={(e) => handleChange("itemKey", e.target.value)}
                  placeholder="e.g. aircon"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.95rem" }}
                />
              </label>
            )}

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
                placeholder="Describe the item, use a blank line to start a new paragraph."
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
          </form>
        </div>
      </div>
    </div>
  );
}
