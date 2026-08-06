// frontend/src/pages/ContentLibraryPage.jsx
import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Friendly labels for the categories Iteration 3 asks for.
// Admins can still add other categories through the CMS — anything not in
// this list just falls back to showing its raw category value as the heading.
const CATEGORY_LABELS = {
  recipe: "Cooking Recipes",
  onboarding: "Onboarding",
  equipment: "Using Equipment",
  maintenance: "Maintenance",
  rules: "Rules & Regulations",
  health_safety: "Health & Safety",
  general: "General",
};

export default function ContentLibraryPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadItems(), 250); // debounce search typing
    return () => clearTimeout(timer);
  }, [search, activeCategory]);

  async function loadCategories() {
    try {
      const res = await fetch(`${API_BASE}/content/categories`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setCategories(data.categories);
    } catch {
      // non-critical
    }
  }

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (activeCategory !== "all") params.set("category", activeCategory);

      const res = await fetch(`${API_BASE}/content/library?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load content");
      setItems(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Group results by category for display (server already filters if
  // activeCategory is set, so this groups whatever came back)
  const grouped = items.reduce((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Content Library</h1>
      <p className="text-gray-600 mb-6">
        Recipes, onboarding guides, equipment instructions, maintenance tasks, rules, and
        health &amp; safety information.
      </p>

      {/* Search bar */}
      <input
        type="text"
        placeholder="Search content..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategory("all")}
          className={`text-sm px-3 py-1 rounded border ${
            activeCategory === "all" ? "bg-black text-white" : ""
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-sm px-3 py-1 rounded border ${
              activeCategory === cat ? "bg-black text-white" : ""
            }`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No content found.</p>
      ) : (
        Object.entries(grouped).map(([category, categoryItems]) => (
          <section key={category} className="mb-8">
            <h2 className="text-lg font-medium mb-3">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <ul className="space-y-3">
              {categoryItems.map((item) => (
                <li key={item.id} className="border rounded p-4">
                  <h3 className="font-medium mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{item.body}</p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
