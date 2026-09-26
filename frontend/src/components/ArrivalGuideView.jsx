
import { useState, useMemo, useEffect } from "react";
import usePageContent from "../hooks/usePageContent.js";
import { getYoutubeEmbedUrl } from "../utils/youtube.js";

const CATEGORY_GROUPS = {
  arrival: {
    label: "Arrival",
    description: "What to know before and when you arrive",
    color: "#DC2626",
    priority: 1,
  },
  general: {
    label: "General",
    description: "Equipment and facilities for use during your stay",
    color: "#0081BD",
    priority: 2,
  },
  leaving: {
    label: "Leaving",
    description: "Checkout and final cleaning tasks",
    color: "#EC4899",
    priority: 3,
  },
};

const FALLBACK_ITEMS = [
  {
    id: "emergency-contacts",
    title: "Emergency Contacts",
    category: "arrival",
    body: "Emergency contact information will be displayed here once added by an admin.",
  },
  {
    id: "wifi-essentials",
    title: "WiFi Information",
    category: "arrival",
    body: "WiFi network details will be available here once configured.",
  },
  {
    id: "kitchen-guide",
    title: "Kitchen Equipment",
    category: "general",
    body: "Kitchen equipment guides will appear here once added.",
  },
  {
    id: "facilities-general",
    title: "General Facilities",
    category: "general",
    body: "General facility information will be provided here.",
  },
  {
    id: "final-clean",
    title: "Final Clean",
    category: "leaving",
    body: "Checkout and final-clean instructions will be provided here.",
  },
];

export default function ArrivalGuideView() {
  const { heading, sections } = usePageContent("arrival");
  const usingCms = sections.length > 0;

  const items = useMemo(() => {
    if (!usingCms) return FALLBACK_ITEMS;
    return sections.map((item) => {
      const category = CATEGORY_GROUPS[item.category] ? item.category : "general";
      return {
        id: String(item.id),
        title: item.title,
        category,
        body: item.body,
        video_url: item.video_url || null,
      };
    });
  }, [usingCms, sections]);

  const [expandedSections, setExpandedSections] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const words = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((item) => {
      const haystack = `${item.title} ${item.body || ""}`.toLowerCase();
      return words.some((word) => haystack.includes(word));
    });
  }, [items, searchTerm]);

  // Group items by category and sort
  const itemsByCategory = useMemo(() => {
    const grouped = {};
    Object.keys(CATEGORY_GROUPS).forEach((cat) => {
      grouped[cat] = filteredItems.filter((item) => item.category === cat);
    });
    return grouped;
  }, [filteredItems]);

  const categoriesWithItems = useMemo(() => {
    return Object.keys(CATEGORY_GROUPS)
      .filter((cat) => itemsByCategory[cat].length > 0)
      .sort((a, b) => CATEGORY_GROUPS[a].priority - CATEGORY_GROUPS[b].priority);
  }, [itemsByCategory]);

  useEffect(() => {
    if (searchTerm.trim()) {
      // Auto-expand all categories when searching
      const expanded = {};
      categoriesWithItems.forEach((cat) => {
        expanded[cat] = true;
      });
      setExpandedCategories(expanded);
    } else {
      setExpandedCategories({});
    }
  }, [searchTerm, categoriesWithItems]);

  const handleExpandAll = () => {
    const allExpanded = {};
    filteredItems.forEach((item) => {
      allExpanded[item.id] = true;
    });
    setExpandedSections(allExpanded);

    const catExpanded = {};
    categoriesWithItems.forEach((cat) => {
      catExpanded[cat] = true;
    });
    setExpandedCategories(catExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedSections({});
    setExpandedCategories({});
  };

  const CollapsibleSection = ({ id, title, item }) => {
    const isExpanded = expandedSections[id];
    const embedUrl = getYoutubeEmbedUrl(item.video_url);
    const categoryInfo = CATEGORY_GROUPS[item.category];

    return (
      <div style={{
        marginBottom: "12px",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${categoryInfo.color}30`,
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
        transition: "all 0.2s ease",
      }}>
        <button
          onClick={() => toggleSection(id)}
          style={{
            width: "100%",
            padding: "14px 16px",
            background: `${categoryInfo.color}10`,
            borderLeft: `4px solid ${categoryInfo.color}`,
            border: "none",
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "1rem",
            fontWeight: "600",
            color: "var(--text-primary)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = `${categoryInfo.color}18`;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = `${categoryInfo.color}10`;
          }}
        >
          <span>{title}</span>
          <span style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            fontSize: "1.2rem",
          }}>
            ▼
          </span>
        </button>

        {isExpanded && (
          <div style={{
            padding: "16px",
            background: "var(--bg-primary)",
            borderTop: `1px solid ${categoryInfo.color}20`,
          }}>
            {(item.body || "").split("\n\n").map((paragraph, pIdx) => (
              <p key={pIdx} style={{
                color: "var(--text-secondary)",
                lineHeight: "1.6",
                margin: 0,
                marginBottom: "12px",
                whiteSpace: "pre-line",
              }}>
                {paragraph}
              </p>
            ))}
            {embedUrl && (
              <div style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
                marginTop: "16px",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}>
                <iframe
                  src={embedUrl}
                  title={`${title} video`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const CollapsibleCategory = ({ categoryId, title, items: categoryItems, color }) => {
    const isExpanded = expandedCategories[categoryId];

    return (
      <div style={{
        marginBottom: "32px",
        borderRadius: "var(--radius-lg)",
        border: `2px solid ${color}`,
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}>
        <button
          onClick={() => toggleCategory(categoryId)}
          style={{
            width: "100%",
            padding: "18px 20px",
            background: `${color}12`,
            border: "none",
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "1.2rem",
            fontWeight: "700",
            color: color,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = `${color}1A`;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = `${color}12`;
          }}
        >
          <div>
            <div>{title}</div>
            <div style={{
              fontSize: "0.85rem",
              fontWeight: "400",
              color: "var(--text-secondary)",
              marginTop: "4px",
            }}>
              {categoryItems.length} {categoryItems.length === 1 ? "item" : "items"}
            </div>
          </div>
          <span style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            fontSize: "1.4rem",
            lineHeight: "1",
          }}>
            ▼
          </span>
        </button>

        {isExpanded && (
          <div style={{
            padding: "20px",
            background: "var(--bg-primary)",
            borderTop: `1px solid ${color}30`,
          }}>
            {categoryItems.map((item) => (
              <CollapsibleSection key={item.id} id={item.id} title={item.title} item={item} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      padding: "40px 20px",
      maxWidth: "1200px",
      margin: "0 auto",
      fontFamily: "var(--sans)",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{
          fontSize: "2.5rem",
          fontWeight: "700",
          color: "var(--text-primary)",
          marginBottom: "8px",
          borderBottom: "3px solid var(--primary)",
          paddingBottom: "12px",
        }}>
          {heading ? heading.title : "Marae Guide"}
        </h1>
        <p style={{
          fontSize: "1rem",
          color: "var(--text-secondary)",
          marginBottom: "0",
          lineHeight: "1.6",
          whiteSpace: "pre-line",
        }}>
          {heading?.body || "Welcome! Here's everything you need to know for your stay — organized by arrival, general use, and leaving."}
        </p>
      </div>

      {/* Search Bar */}
      <div style={{
        marginBottom: "32px",
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        alignItems: "center",
      }}>
        <div style={{
          position: "relative",
          flex: "1",
          minWidth: "280px",
        }}>
          <input
            type="search"
            aria-label="Search arrival information"
            placeholder="Search for WiFi, kitchen, emergency, parking..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 44px 12px 20px",
              fontSize: "1rem",
              border: "2px solid var(--primary)",
              borderRadius: "var(--radius-full)",
              fontFamily: "var(--sans)",
              outline: "none",
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = "0 0 0 3px rgba(0, 129, 189, 0.15)";
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = "var(--shadow-sm)";
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "var(--bg-secondary)",
                border: "none",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: "1.2rem",
                padding: 0,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => e.target.style.background = "var(--border-light)"}
              onMouseLeave={(e) => e.target.style.background = "var(--bg-secondary)"}
            >
              ×
            </button>
          )}
        </div>

        <button
          onClick={handleExpandAll}
          className="btn btn-primary"
          style={{ padding: "10px 16px", fontSize: "0.9rem" }}
        >
          Expand All
        </button>
        <button
          onClick={handleCollapseAll}
          className="btn btn-outline"
          style={{ padding: "10px 16px", fontSize: "0.9rem" }}
        >
          Collapse All
        </button>
      </div>

      {/* Content */}
      {filteredItems.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "var(--text-secondary)",
          fontSize: "1.1rem",
        }}>
          <p>No information found matching "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm("")}
            style={{
              marginTop: "16px",
              padding: "10px 20px",
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-lg)",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => e.target.style.background = "var(--primary-dark)"}
            onMouseLeave={(e) => e.target.style.background = "var(--primary)"}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div>
          {categoriesWithItems.map((categoryId) => {
            const category = CATEGORY_GROUPS[categoryId];
            const categoryItems = itemsByCategory[categoryId];
            return (
              <CollapsibleCategory
                key={categoryId}
                categoryId={categoryId}
                title={category.label}
                items={categoryItems}
                color={category.color}
              />
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: "48px",
        padding: "20px",
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-light)",
        textAlign: "center",
      }}>
        <p style={{
          color: "var(--text-secondary)",
          margin: 0,
          fontSize: "0.95rem",
          lineHeight: "1.6",
        }}>
          Can't find what you're looking for? Contact the marae staff for assistance.
        </p>
      </div>
    </div>
  );
}
