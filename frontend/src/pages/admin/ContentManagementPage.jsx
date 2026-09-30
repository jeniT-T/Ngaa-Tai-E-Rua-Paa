// frontend/src/pages/admin/ContentManagementPage.jsx
import { useState, useEffect } from "react";
import { getYoutubeEmbedUrl } from "../../utils/youtube.js";
import { resolveImageUrl } from "../../utils/media.js";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;
const ALL_ROLES = ["member", "caretaker", "admin"];
const SUGGESTED_CATEGORIES = [
  "recipe",
  "onboarding",
  "Arrival Guide Emergency & Safety",
  "Arrival Guide Getting Started",
  "Arrival Guide Kitchen",
  "Arrival Guide Equipment",
  "Arrival Guide Facilities",
  "Arrival Guide Utilities & Climate",
  "Arrival Guide Cleaning & Checkout",
  "rules",
  "health_safety",
];

// Where an item can be shown. Empty string = internal content library only
// (existing behaviour, gated by "Visible to" below). Anything else = it shows
// up on that public/marae-info page instead, with no login required.
// For the arrival guide specifically, "Category" doubles as which
// collapsible group the item appears under — use "arrival", "general" or
// "leaving" (anything else falls back to "general"). See ArrivalGuideView.jsx.
//
// This list is also what makes "every page is editable" concrete: it's
// every public page the app has, and choosing one here + saving a heading
// or section is the whole mechanism — there's no separate "page editor" per
// page, it's the same form for all of them.
const PUBLIC_PAGES = [
  { value: "", label: "Library only (internal)" },
  { value: "home", label: "Home page" },
  { value: "history", label: "History page" },
  { value: "facilities", label: "Facilities page" },
  { value: "events", label: "Events page" },
  { value: "contacts", label: "Contact Us page" },
  { value: "health-and-safety", label: "Health & Safety page" },
  { value: "map", label: "Map page (heading/intro only)" },
  { value: "arrival", label: "Arrival guide (main dropdown list)" },
  { value: "arrival-gas", label: "Arrival guide → Gas page" },
  { value: "arrival-wifi", label: "Arrival guide → WiFi page" },
  { value: "arrival-emergency", label: "Arrival guide → Emergency page" },
  { value: "arrival-accessibility", label: "Arrival guide → Accessibility page" },
  { value: "arrival-rules", label: "Arrival guide → Rules & Regulations page" },
  { value: "caretaker-tutorials", label: "Caretaker Tutorials page" },
];
const PAGE_GROUPS = PUBLIC_PAGES.filter((p) => p.value);

const EMPTY_FORM = {
  title: "",
  body: "",
  category: "general",
  visibleToRoles: ["member"],
  placement: "",
  blockType: "section",
  videoUrl: "",
  imageUrl: "",
};

// One item's card — the same rendering + actions whether it's shown under a
// page group or under the library list below.
function ContentItemCard({ item, categories, moveValue, onMoveChange, onModify, onCopy, onDelete, onMove }) {
  const imageSrc = resolveImageUrl(item.image_url);

  return (
    <li className="border rounded p-4">
      <div className="flex justify-between items-start mb-2 gap-3">
        <h3 className="font-medium">{item.title}</h3>
        <div className="flex gap-1 flex-wrap justify-end">
          {item.image_url && (
            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">Image</span>
          )}
          {item.video_url && (
            <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">Video</span>
          )}
          {item.placement && (
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
              {item.placement} page · {item.block_type}
            </span>
          )}
          <span className="text-xs px-2 py-1 rounded bg-gray-100">{item.category}</span>
        </div>
      </div>

      {imageSrc && (
        <img
          src={imageSrc}
          alt={item.title}
          className="mb-2 rounded"
          style={{ maxHeight: "140px", objectFit: "cover", width: "100%" }}
        />
      )}

      <p className="text-sm text-gray-600 whitespace-pre-line mb-2">{item.body}</p>
      <p className="text-xs text-gray-500 mb-3">
        {item.placement
          ? `Public on the ${item.placement} page`
          : `Visible to: ${item.visible_to_roles.join(", ")}`}
      </p>

      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={() => onModify(item)} className="text-sm border rounded px-3 py-1">
          Modify
        </button>
        <button onClick={() => onCopy(item)} className="text-sm border rounded px-3 py-1">
          Copy
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="text-sm text-red-600 border border-red-200 rounded px-3 py-1"
        >
          Delete
        </button>

        <select
          value={moveValue}
          onChange={(e) => onMoveChange(e.target.value)}
          className="text-sm border rounded px-2 py-1 w-36"
        >
          <option value={item.category}>Keep as {item.category}</option>
          {categories.filter(c => c !== item.category).map((c) => (
            <option key={c} value={c}>
              Move to {c}
            </option>
          ))}
        </select>
        <button onClick={() => onMove(item)} className="text-sm border rounded px-3 py-1">
          Move
        </button>
      </div>
    </li>
  );
}

export default function ContentManagementPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(SUGGESTED_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [moveTarget, setMoveTarget] = useState({}); // { [itemId]: newCategory }
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/content`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load content");
      setItems(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Pulls in whatever categories actually exist in the database (which may
  // include ones an admin created on the fly), merged with the suggested
  // list, so "move" always has the item's real current category as an option.
  async function loadCategories() {
    try {
      const res = await fetch(`${API_BASE}/content/categories`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setCategories([...new Set([...SUGGESTED_CATEGORIES, ...data.categories])]);
      }
    } catch {
      // non-critical — fall back to the suggested list
    }
  }

  function toggleRole(role) {
    setForm((prev) => ({
      ...prev,
      visibleToRoles: prev.visibleToRoles.includes(role)
        ? prev.visibleToRoles.filter((r) => r !== role)
        : [...prev.visibleToRoles, role],
    }));
  }

  // Uploads the picked file immediately (before the item itself is saved) so
  // the admin gets a live preview and a plain image URL to attach — the item
  // save below is a normal JSON POST/PATCH either way, same as videoUrl.
  async function handleImageSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let picking the same file again re-trigger onChange
    if (!file) return;

    setImageError("");
    setUploadingImage(true);
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
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err) {
      setImageError(err.message);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.visibleToRoles.length === 0) {
      setError("Select at least one user type who can view this content.");
      return;
    }

    setSaving(true);
    try {
      const isEditing = Boolean(editingId);
      const res = await fetch(
        isEditing ? `${API_BASE}/content/${editingId}` : `${API_BASE}/content`,
        {
          method: isEditing ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save content");

      if (isEditing) {
        setItems((prev) => prev.map((i) => (i.id === editingId ? data.item : i)));
      } else {
        setItems((prev) => [data.item, ...prev]);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      loadCategories(); // in case a brand-new category was typed in
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setImageError("");
    setForm({
      title: item.title,
      body: item.body,
      category: item.category,
      visibleToRoles: item.visible_to_roles,
      placement: item.placement || "",
      blockType: item.block_type || "section",
      videoUrl: item.video_url || "",
      imageUrl: item.image_url || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setImageError("");
    setForm(EMPTY_FORM);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/content/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCopy(item) {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/content/${item.id}/copy`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to copy");
      setItems((prev) => [data.item, ...prev]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMove(item) {
    const category = moveTarget[item.id];
    if (!category || category === item.category) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/content/${item.id}/move`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to move");
      setItems((prev) => prev.map((i) => (i.id === item.id ? data.item : i)));
      loadCategories(); // in case it moved into a brand-new category
    } catch (err) {
      setError(err.message);
    }
  }

  const libraryItems = items.filter((i) => !i.placement);
  const previewSrc = resolveImageUrl(form.imageUrl);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Content Manager</h1>
      <p className="text-sm text-gray-500 mb-6">
        Add, edit, move, copy, or delete content — and choose which user types can see it. Every
        public page in the app (including Contact Us) is edited the same way: pick it under "Show
        on public page" below, and it replaces that page's placeholder copy immediately.
      </p>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <section className="mb-10 border rounded p-4">
        <h2 className="text-lg font-medium mb-4">{editingId ? "Edit item" : "Add new item"}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />
          <textarea
            placeholder="Body / content"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required
            rows={4}
            className="w-full border rounded px-3 py-2"
          />

          <div>
            <label className="block text-sm font-medium mb-1">Category (area)</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select a category...</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Show on public page</label>
            <select
              value={form.placement}
              onChange={(e) => setForm({ ...form, placement: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              {PUBLIC_PAGES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choosing a page here makes this item visible to everyone (logged in or not) on
              that page — "Visible to" below only applies to library items.
            </p>
          </div>

          {form.placement && (
            <div>
              <label className="block text-sm font-medium mb-1">Block type</label>
              <select
                value={form.blockType}
                onChange={(e) => setForm({ ...form, blockType: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="section">Section (a card in the page's list)</option>
                <option value="heading">Heading (the page's title / intro text)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Image (optional)</label>
            {previewSrc && (
              <img
                src={previewSrc}
                alt="Selected"
                className="mb-2 rounded border"
                style={{ maxHeight: "160px", objectFit: "cover" }}
              />
            )}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageSelect}
                disabled={uploadingImage}
                className="text-sm"
              />
              {uploadingImage && <span className="text-xs text-gray-500">Uploading...</span>}
              {form.imageUrl && !uploadingImage && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                  className="text-xs text-red-600 border border-red-200 rounded px-2 py-1"
                >
                  Remove image
                </button>
              )}
            </div>
            {imageError && <p className="text-xs text-red-600 mt-1">{imageError}</p>}
            <p className="text-xs text-gray-500 mt-1">
              JPEG, PNG, WEBP or GIF, up to 8MB. Shown above this item's text wherever it appears.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">YouTube video URL (optional)</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
            {form.videoUrl && !getYoutubeEmbedUrl(form.videoUrl) && (
              <p className="text-xs text-red-600 mt-1">That doesn't look like a valid YouTube URL yet.</p>
            )}
            {getYoutubeEmbedUrl(form.videoUrl) && (
              <div className="mt-2" style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: "6px", overflow: "hidden" }}>
                <iframe
                  src={getYoutubeEmbedUrl(form.videoUrl)}
                  title="Video preview"
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Visible to</label>
            <div className="flex gap-4">
              {ALL_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={form.visibleToRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                  />
                  {role}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Save changes" : "Add item"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="border rounded px-4 py-2">
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-1">Pages</h2>
        <p className="text-sm text-gray-500 mb-4">
          Every public page, grouped by what's currently on it. A page with nothing listed is
          still showing its built-in placeholder copy — add a heading or section above (pick this
          page under "Show on public page") to replace it.
        </p>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-6">
            {PAGE_GROUPS.map((page) => {
              const pageItems = items.filter((i) => i.placement === page.value);
              return (
                <div key={page.value} className="border rounded p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">{page.label}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100">
                      {pageItems.length} {pageItems.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  {pageItems.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">
                      Nothing here yet — this page is showing its placeholder text.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {pageItems.map((item) => (
                        <ContentItemCard
                          key={item.id}
                          item={item}
                          categories={categories}
                          moveValue={moveTarget[item.id] ?? item.category}
                          onMoveChange={(value) =>
                            setMoveTarget((prev) => ({ ...prev, [item.id]: value }))
                          }
                          onModify={startEdit}
                          onCopy={handleCopy}
                          onDelete={handleDelete}
                          onMove={handleMove}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-1">Content Library</h2>
        <p className="text-sm text-gray-500 mb-4">
          Items not tied to a public page — visible only to logged-in users whose role is checked
          under "Visible to" (recipes, onboarding guides, equipment instructions, and so on).
        </p>
        {loading ? (
          <p>Loading...</p>
        ) : libraryItems.length === 0 ? (
          <p className="text-gray-500">No library content yet.</p>
        ) : (
          <ul className="space-y-3">
            {libraryItems.map((item) => (
              <ContentItemCard
                key={item.id}
                item={item}
                categories={categories}
                moveValue={moveTarget[item.id] ?? item.category}
                onMoveChange={(value) => setMoveTarget((prev) => ({ ...prev, [item.id]: value }))}
                onModify={startEdit}
                onCopy={handleCopy}
                onDelete={handleDelete}
                onMove={handleMove}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
