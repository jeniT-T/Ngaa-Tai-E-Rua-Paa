// frontend/src/pages/admin/ContentManagementPage.jsx
import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const ALL_ROLES = ["member", "caretaker", "admin"];
const SUGGESTED_CATEGORIES = [
  "recipe",
  "onboarding",
  "equipment",
  "cleaning",
  "maintenance",
  "rules",
  "health_safety",
  "general",
];

// Where an item can be shown. Empty string = internal content library only
// (existing behaviour, gated by "Visible to" below). Anything else = it shows
// up on that public/marae-info page instead, with no login required.
// For the arrival guide specifically, "Category" doubles as which
// collapsible group the item appears under — use "equipment", "cleaning"
// or "facilities" (anything else falls under "Facilities & General").
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
];

const EMPTY_FORM = {
  title: "",
  body: "",
  category: "general",
  visibleToRoles: ["member"],
  placement: "",
  blockType: "section",
};

export default function ContentManagementPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(SUGGESTED_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [moveTarget, setMoveTarget] = useState({}); // { [itemId]: newCategory }

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
    setForm({
      title: item.title,
      body: item.body,
      category: item.category,
      visibleToRoles: item.visible_to_roles,
      placement: item.placement || "",
      blockType: item.block_type || "section",
    });
  }

  function cancelEdit() {
    setEditingId(null);
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

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Content Manager</h1>
      <p className="text-sm text-gray-500 mb-6">
        Add, edit, move, copy, or delete content — and choose which user types can see it.
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
            <input
              type="text"
              list="category-suggestions"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
            <datalist id="category-suggestions">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
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
              disabled={saving}
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

      <section>
        <h2 className="text-lg font-medium mb-4">Existing content</h2>
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">No content yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{item.title}</h3>
                  <div className="flex gap-1">
                    {item.placement && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                        {item.placement} page · {item.block_type}
                      </span>
                    )}
                    <span className="text-xs px-2 py-1 rounded bg-gray-100">
                      {item.category}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line mb-2">{item.body}</p>
                <p className="text-xs text-gray-500 mb-3">
                  {item.placement
                    ? `Public on the ${item.placement} page`
                    : `Visible to: ${item.visible_to_roles.join(', ')}`}
                </p>

                <div className="flex flex-wrap gap-2 items-center">
                  <button onClick={() => startEdit(item)} className="text-sm border rounded px-3 py-1">
                    Modify
                  </button>
                  <button onClick={() => handleCopy(item)} className="text-sm border rounded px-3 py-1">
                    Copy
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-sm text-red-600 border border-red-200 rounded px-3 py-1"
                  >
                    Delete
                  </button>

                  <input
                    type="text"
                    list="category-suggestions"
                    value={moveTarget[item.id] ?? item.category}
                    onChange={(e) => setMoveTarget((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    className="text-sm border rounded px-2 py-1 w-36"
                  />
                  <button onClick={() => handleMove(item)} className="text-sm border rounded px-3 py-1">
                    Move
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
