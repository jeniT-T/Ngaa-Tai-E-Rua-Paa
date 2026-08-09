import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { getArrivalItems, getYoutubeEmbedUrl } from "../api/arrivalItems";

const GROUP_LABELS = {
  equipment: "Equipment & Appliances",
  cleaning: "Cleaning Instructions",
  facilities: "Facilities & General Information",
};

function ArrivalPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedGroupHeaders, setExpandedGroupHeaders] = useState({ equipment: false, cleaning: false, facilities: false });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isMounted = true;
    getArrivalItems()
      .then((data) => {
        if (isMounted) setItems(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleGroupHeader = (groupId) => {
    setExpandedGroupHeaders((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    // Split on whitespace so a search like "gas oven" matches items
    // containing EITHER "gas" OR "oven", not just the exact phrase.
    const words = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((item) => {
      const haystack = `${item.title} ${item.body || ""}`.toLowerCase();
      return words.some((word) => haystack.includes(word));
    });
  }, [items, searchTerm]);

  // Auto-expand group headers when searching, keep items collapsed
  useEffect(() => {
    if (searchTerm.trim()) {
      setExpandedGroupHeaders({ equipment: true, cleaning: true, facilities: true });
      setExpandedSections({});
    } else {
      setExpandedGroupHeaders({ equipment: false, cleaning: false, facilities: false });
      setExpandedSections({});
    }
  }, [searchTerm]);

  const handleExpandAll = () => {
    const allExpanded = {};
    filteredItems.forEach((item) => {
      allExpanded[item.item_key] = true;
    });
    setExpandedSections(allExpanded);
    setExpandedGroupHeaders({ equipment: true, cleaning: true, facilities: true });
  };

  const handleCollapseAll = () => {
    setExpandedSections({});
    setExpandedGroupHeaders({ equipment: false, cleaning: false, facilities: false });
  };

  const CollapsibleSection = ({ id, title, color, item }) => {
    const isExpanded = expandedSections[id];
    const embedUrl = getYoutubeEmbedUrl(item.youtube_url);
    return (
      <section style={{ marginBottom: "16px", borderRadius: "6px", border: `1px solid ${color}20`, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <button
          onClick={() => toggleSection(id)}
          style={{
            width: "100%",
            padding: "16px 20px",
            background: `${color}15`,
            borderLeft: `4px solid ${color}`,
            border: "none",
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "1.1rem",
            fontWeight: "600",
            color: "#2c3e50",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = `${color}25`;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = `${color}15`;
          }}
        >
          <span>{title}</span>
          <span
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
              fontSize: "1.3rem",
              lineHeight: "1",
            }}
          >
            ▼
          </span>
        </button>
        {isExpanded && (
          <div style={{ padding: "20px", background: "#fff", borderTop: `1px solid ${color}20` }}>
            {(item.body || "").split("\n\n").map((paragraph, pIdx) => (
              <p key={pIdx} style={{ color: "#555", lineHeight: 1.7, margin: 0, marginBottom: "16px", whiteSpace: "pre-line" }}>
                {paragraph}
              </p>
            ))}
            {embedUrl && (
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, marginTop: "12px", borderRadius: "6px", overflow: "hidden" }}>
                <iframe
                  src={embedUrl}
                  title={`${title} video`}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  const CollapsibleGroupHeader = ({ groupId, title, children }) => {
    const isExpanded = expandedGroupHeaders[groupId];
    return (
      <div style={{ marginBottom: "28px" }}>
        <button
          onClick={() => toggleGroupHeader(groupId)}
          style={{
            width: "100%",
            padding: "16px 20px",
            background: "#f5f5f5",
            border: "2px solid #d4af37",
            borderRadius: "6px",
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "1.3rem",
            fontWeight: "600",
            color: "#2c3e50",
            transition: "all 0.2s ease",
            marginBottom: "16px",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#efefef";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "#f5f5f5";
          }}
        >
          <span>{title}</span>
          <span
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
              fontSize: "1.5rem",
              lineHeight: "1",
            }}
          >
            ▼
          </span>
        </button>
        {isExpanded && <div>{children}</div>}
      </div>
    );
  };

  const equipmentItems = filteredItems.filter((item) => item.group_key === "equipment");
  const cleaningItems = filteredItems.filter((item) => item.group_key === "cleaning");
  const facilitiesItems = filteredItems.filter((item) => item.group_key === "facilities");

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", textAlign: "left", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ color: "#2c3e50", borderBottom: "3px solid #d4af37", paddingBottom: "16px", marginBottom: "8px" }}>Marae Facilities & Operations Guide</h1>
        <Link
          to="/arrival/edit"
          style={{
            display: "inline-block",
            padding: "10px 16px",
            background: "#2c3e50",
            color: "#fff",
            borderRadius: "4px",
            textDecoration: "none",
            fontWeight: "500",
            fontSize: "0.95rem",
            whiteSpace: "nowrap",
          }}
        >
          Edit Arrival Info
        </Link>
      </div>
      <p style={{ fontSize: "1rem", color: "#777", marginBottom: "24px", fontStyle: "italic" }}>Please follow these guidelines to ensure proper use of all marae facilities. Click on any section to expand.</p>

      <div style={{ marginBottom: "32px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1", minWidth: "250px" }}>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "1.15rem",
              color: "#999",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="search"
            aria-label="Search sections and content"
            placeholder="Search for an item, e.g. Airconditioning, WiFi, Rubbish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 44px",
              fontSize: "1.05rem",
              border: "2px solid #d4af37",
              borderRadius: "999px",
              fontFamily: "sans-serif",
              outline: "none",
              background: "#fff",
              color: "#2c3e50",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              transition: "box-shadow 0.2s, border-color 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#2c3e50";
              e.target.style.boxShadow = "0 0 0 3px rgba(212,175,55,0.35)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#d4af37";
              e.target.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)";
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
                background: "#e0e0e0",
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                lineHeight: "24px",
                textAlign: "center",
                cursor: "pointer",
                color: "#555",
                fontSize: "0.9rem",
                padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>
        <button
          onClick={handleExpandAll}
          style={{
            padding: "10px 16px",
            background: "#2c3e50",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "0.95rem",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.target.style.background = "#1a252f"}
          onMouseLeave={(e) => e.target.style.background = "#2c3e50"}
        >
          Expand All
        </button>
        <button
          onClick={handleCollapseAll}
          style={{
            padding: "10px 16px",
            background: "#d4af37",
            color: "#2c3e50",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "0.95rem",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.target.style.background = "#c9a426"}
          onMouseLeave={(e) => e.target.style.background = "#d4af37"}
        >
          Collapse All
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#777", fontSize: "1.1rem" }}>Loading...</div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#d32f2f", fontSize: "1.1rem" }}>Failed to load arrival info: {error}</div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#777", fontSize: "1.1rem" }}>
          No sections found matching "{searchTerm}"
        </div>
      ) : (
        <div>
          {equipmentItems.length > 0 && (
            <CollapsibleGroupHeader groupId="equipment" title={GROUP_LABELS.equipment}>
              {equipmentItems.map((item) => (
                <CollapsibleSection key={item.item_key} id={item.item_key} title={item.title} color={item.color} item={item} />
              ))}
            </CollapsibleGroupHeader>
          )}

          {cleaningItems.length > 0 && (
            <CollapsibleGroupHeader groupId="cleaning" title={GROUP_LABELS.cleaning}>
              {cleaningItems.map((item) => (
                <CollapsibleSection key={item.item_key} id={item.item_key} title={item.title} color={item.color} item={item} />
              ))}
            </CollapsibleGroupHeader>
          )}

          {facilitiesItems.length > 0 && (
            <CollapsibleGroupHeader groupId="facilities" title={GROUP_LABELS.facilities}>
              {facilitiesItems.map((item) => (
                <CollapsibleSection key={item.item_key} id={item.item_key} title={item.title} color={item.color} item={item} />
              ))}
            </CollapsibleGroupHeader>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "20px", background: "#fafafa", borderRadius: "6px", border: "1px solid #ddd", textAlign: "center" }}>
        <p style={{ color: "#555", margin: 0, fontSize: "0.95rem" }}>
          For questions or issues, please contact the Paa Committee Chairperson at 0212749600
        </p>
      </div>
    </div>
  );
}

export default ArrivalPage;
