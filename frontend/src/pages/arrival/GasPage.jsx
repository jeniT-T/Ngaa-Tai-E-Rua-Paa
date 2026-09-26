import { Link } from "react-router-dom";
import usePageContent from "../../hooks/usePageContent.js";

const DEFAULT_SECTIONS = [
  { title: "Step 1: Locate the Gas Valve", body: "The gas valve is located outside near the kitchen area." },
  { title: "Step 2: Turn the Valve Slowly", body: "Slowly turn the valve until fully open." },
  { title: "Step 3: Test the Stove", body: "Check that burners are working correctly." },
  { title: "Safety Notice", body: "If you smell gas, turn it off immediately and notify staff." },
];

export default function GasPage() {
  const { heading, sections } = usePageContent("arrival-gas");
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
          {heading ? heading.title : "How to Turn On the Gas"}
        </h1>

        <p style={{
          fontSize: "1.05rem",
          color: "var(--text-secondary)",
          marginBottom: "32px",
          lineHeight: "1.6",
          whiteSpace: "pre-line",
        }}>
          {heading ? heading.body : "Please follow these steps carefully to safely turn on the gas supply."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {items.map((item, idx) => (
            <section key={item.title} style={{
              paddingBottom: "20px",
              borderBottom: idx < items.length - 1 ? "1px solid var(--border-light)" : "none",
            }}>
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                marginBottom: "12px",
              }}>
                <div style={{
                  minWidth: "32px",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--primary)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                }}>
                  {idx + 1}
                </div>
                <h2 style={{
                  fontSize: "1.3rem",
                  fontWeight: "600",
                  margin: "0",
                  color: "var(--text-primary)",
                  marginTop: "2px",
                }}>
                  {item.title}
                </h2>
              </div>
              <p style={{
                color: "var(--text-secondary)",
                lineHeight: "1.6",
                margin: "8px 0 0 48px",
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
          ← Back to Marae Guide
        </Link>
      </div>
    </main>
  );
}
