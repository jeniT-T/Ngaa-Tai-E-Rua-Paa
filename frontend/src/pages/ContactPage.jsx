import { Link } from "react-router-dom";
import usePageContent from "../hooks/usePageContent.js";

const DEFAULT_CONTACTS = [
  { title: "Marae Host", body: "Name: Waren\nPhone: (placeholder)" },
  { title: "Marae Caretaker", body: "Name: (placeholder)\nPhone: (placeholder)" },
];

function ContactPage() {
  const { heading, sections } = usePageContent("contacts");
  const contacts = sections.length > 0 ? sections : DEFAULT_CONTACTS;

  return (
    <div style={{ padding: "40px", maxWidth: "700px", margin: "0 auto", textAlign: "left" }}>
      <h1>{heading ? heading.title : "Contact Information"}</h1>
      <p style={{ marginBottom: "24px", color: "#555", whiteSpace: "pre-line" }}>
        {heading
          ? heading.body
          : "If you have a question or problem while staying at the marae, contact one of the people below."}
      </p>

      <div style={{ display: "grid", gap: "20px", marginBottom: "24px" }}>
        {contacts.map((c) => (
          <div key={c.title} style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "12px" }}>
            <h2 style={{ margin: "0 0 8px" }}>{c.title}</h2>
            <p style={{ margin: 0, whiteSpace: "pre-line" }}>{c.body}</p>
          </div>
        ))}
      </div>

      <Link
        to="/report-issue"
        style={{
          display: "inline-block",
          padding: "12px 20px",
          borderRadius: "10px",
          border: "2px solid #0081bd",
          color: "#0081bd",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        🛠️ Report an Issue
      </Link>
    </div>
  );
}

export default ContactPage;
