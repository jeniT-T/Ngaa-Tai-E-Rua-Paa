import { Link } from "react-router-dom";
import usePageContent from "../../hooks/usePageContent.js";

const DEFAULT_SECTIONS = [
  { title: "Primary Exit Point", body: "Follow marked signage to the main exit." },
  { title: "Secondary Exit Point", body: "Located at the rear near the kitchen area." },
  { title: "Assembly Area", body: "Open field located away from the main buildings." },
  { title: "Important", body: "Do not re-enter buildings until instructed by marae staff or emergency services." },
];

export default function EmergencyPage() {
  const { heading, sections } = usePageContent("arrival-emergency");
  const items = sections.length > 0 ? sections : DEFAULT_SECTIONS;

  return (
    <main style={{ minHeight: "100vh", padding: "40px 20px", background: "var(--bg-secondary)" }}>
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        background: "var(--bg-primary)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-lg)",
        padding: "40px",
        borderTop: "4px solid #DC2626",
      }}>
        <h1 style={{
          fontSize: "2.5rem",
          fontWeight: "700",
          marginBottom: "16px",
          color: "#DC2626",
        }}>
          🚨 {heading ? heading.title : "Emergency Evacuation Information"}
        </h1>

        <p style={{
          fontSize: "1.05rem",
          color: "var(--text-secondary)",
          marginBottom: "32px",
          lineHeight: "1.6",
          whiteSpace: "pre-line",
          paddingBottom: "20px",
          borderBottom: "2px solid #FEE2E2",
        }}>
          {heading ? heading.body : "In case of emergency, follow these evacuation points and procedures."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {items.map((item) => (
            <div
              key={item.title}
              style={{
                padding: "20px",
                borderRadius: "var(--radius-lg)",
                border: item.title === "Important" ? "2px solid #DC2626" : "1px solid var(--border-light)",
                background: item.title === "Important" ? "rgba(220, 38, 38, 0.05)" : "var(--bg-secondary)",
              }}
            >
              <h2 style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                marginBottom: "8px",
                color: item.title === "Important" ? "#DC2626" : "var(--text-primary)",
              }}>
                {item.title === "Important" ? "⚠️ " : "📍 "}{item.title}
              </h2>
              <p style={{
                color: "var(--text-secondary)",
                margin: 0,
                lineHeight: "1.6",
                whiteSpace: "pre-line",
              }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <Link to="/arrival" style={{
          display: "inline-block",
          marginTop: "32px",
          padding: "12px 24px",
          backgroundColor: "#DC2626",
          color: "white",
          textDecoration: "none",
          borderRadius: "var(--radius-lg)",
          fontWeight: "600",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#991B1B";
          e.target.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#DC2626";
          e.target.style.transform = "translateY(0)";
        }}>
          ← Back to Arrival Information
        </Link>
      </div>
    </main>
  );
}
