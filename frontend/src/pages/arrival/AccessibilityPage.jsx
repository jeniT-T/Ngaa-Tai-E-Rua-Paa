import { Link } from "react-router-dom";
import usePageContent from "../../hooks/usePageContent.js";

const DEFAULT_SECTIONS = [
  { title: "Disabled Bathrooms", body: "Accessible bathrooms are located at the designated accessible facilities area." },
  { title: "Wheelchair Access Points", body: "Wheelchair ramps are available at main entrances and key buildings." },
  { title: "Need Assistance?", body: "Please contact the marae caretaker if assistance is required during your stay." },
];

export default function AccessibilityPage() {
  const { heading, sections } = usePageContent("arrival-accessibility");
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
      }}>
        <h1 style={{
          fontSize: "2.5rem",
          fontWeight: "700",
          marginBottom: "16px",
          color: "var(--primary)",
        }}>
          ♿ {heading ? heading.title : "Accessibility Information"}
        </h1>

        <p style={{
          fontSize: "1.05rem",
          color: "var(--text-secondary)",
          marginBottom: "32px",
          lineHeight: "1.6",
          whiteSpace: "pre-line",
        }}>
          {heading?.body || "This information is provided to help disabled guests navigate the marae comfortably and safely."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {items.map((item) => (
            <section key={item.title} style={{
              padding: "20px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-light)",
              background: "var(--bg-secondary)",
            }}>
              <h2 style={{
                fontSize: "1.3rem",
                fontWeight: "600",
                marginBottom: "12px",
                color: "var(--text-primary)",
              }}>
                {item.title}
              </h2>
              <p style={{
                color: "var(--text-secondary)",
                margin: 0,
                lineHeight: "1.6",
                whiteSpace: "pre-line",
              }}>
                {item.body}
              </p>
            </section>
          ))}
        </div>

        <Link to="/arrival" style={{
          display: "inline-block",
          marginTop: "32px",
          padding: "12px 24px",
          backgroundColor: "var(--primary)",
          color: "white",
          textDecoration: "none",
          borderRadius: "var(--radius-lg)",
          fontWeight: "600",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "var(--primary-dark)";
          e.target.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "var(--primary)";
          e.target.style.transform = "translateY(0)";
        }}>
          ← Back to Arrival Information
        </Link>
      </div>
    </main>
  );
}
