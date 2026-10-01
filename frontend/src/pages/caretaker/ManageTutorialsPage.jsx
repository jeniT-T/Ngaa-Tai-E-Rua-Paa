// frontend/src/pages/caretaker/ManageTutorialsPage.jsx
//
// Caretaker's own content manager — same add/edit/image-upload/video-embed
// style as the admin's Content Manager (see admin/ContentManagementPage.jsx),
// but scoped to just one page: every item this creates is pinned to the
// "caretaker-tutorials" placement, so there's no placement picker and no
// "visible to roles" section (those only matter for library-only items —
// everything here is always public on the tutorials page, same tradeoff
// already made for every other public/marae-info page). The backend
// (backend/routes/content.js) enforces the same restriction independently,
// so a caretaker can never touch content on any other page even by editing
// this file or calling the API directly.
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getYoutubeEmbedUrl } from "../../utils/youtube.js";
import { resolveImageUrl } from "../../utils/media.js";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;
const PLACEMENT = "caretaker-tutorials";

const EMPTY_FORM = {
  title: "",
  body: "",
  blockType: "section",
  videoUrl: "",
  imageUrl: "",
};

function TutorialItemCard({ item, onModify, onCopy, onDelete }) {
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
          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
            {item.block_type === "heading" ? "Page heading" : "Tutorial"}
          </span>
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

      <p className="text-sm text-gray-600 whitespace-pre-line mb-3">{item.body}</p>

      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={() => onModify(item)} className="btn btn-outline btn-action btn-compact">
          Modify
        </button>
        <button onClick={() => onCopy(item)} className="btn btn-outline btn-action btn-compact">
          Copy
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="btn btn-error btn-danger-action btn-compact"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export default function ManageTutorialsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  // Uses the same public, unauthenticated endpoint every tutorials viewer
  // uses (see usePageContent.js) — it already returns every field this page
  // needs to edit (id, image_url, video_url, etc.), so there's no need for a
  // second admin-only listing route just for this.
  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/content/public/${PLACEMENT}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load tutorials");
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
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
    setSaving(true);
    try {
      const isEditing = Boolean(editingId);
      const payload = { ...form, placement: PLACEMENT };
      const res = await fetch(
        isEditing ? `${API_BASE}/content/${editingId}` : `${API_BASE}/content`,
        {
          method: isEditing ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save tutorial");

      if (isEditing) {
        setItems((prev) => prev.map((i) => (i.id === editingId ? data.item : i)));
      } else {
        setItems((prev) => [...prev, data.item]);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
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
    if (!window.confirm("Delete this tutorial? This cannot be undone.")) return;
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
      setItems((prev) => [...prev, data.item]);
    } catch (err) {
      setError(err.message);
    }
  }

  const previewSrc = resolveImageUrl(form.imageUrl);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-start gap-4 mb-2">
        <h1 className="text-2xl font-semibold">Manage Tutorials</h1>
        <Link to="/caretaker/manage-content" className="text-sm underline whitespace-nowrap">
          ← Back to Manage Content
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Add, edit, copy or delete tutorial content — everything here shows up straight away on the
        caretaker Tutorials page.
      </p>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <section className="mb-10 border rounded p-4">
        <h2 className="text-lg font-medium mb-4">{editingId ? "Edit tutorial" : "Add new tutorial"}</h2>
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
            <label className="block text-sm font-medium mb-1">Block type</label>
            <select
              value={form.blockType}
              onChange={(e) => setForm({ ...form, blockType: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="section">Tutorial (a card in the page's list)</option>
              <option value="heading">Heading (the page's title / intro text)</option>
            </select>
          </div>

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
                  className="btn btn-error btn-danger-action btn-compact"
                >
                  Remove image
                </button>
              )}
            </div>
            {imageError && <p className="text-xs text-red-600 mt-1">{imageError}</p>}
            <p className="text-xs text-gray-500 mt-1">
              JPEG, PNG, WEBP or GIF, up to 8MB. Shown above this tutorial's text wherever it appears.
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
              <div className="mt-2" style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: "var(--radius-panel)", overflow: "hidden" }}>
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

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="btn btn-primary btn-action"
            >
              {saving ? "Saving..." : editingId ? "Save changes" : "Add tutorial"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="btn btn-outline btn-action btn-compact">
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-1">Tutorials on this page</h2>
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">No tutorials added yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <TutorialItemCard
                key={item.id}
                item={item}
                onModify={startEdit}
                onCopy={handleCopy}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
