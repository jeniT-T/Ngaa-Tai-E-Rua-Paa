import usePageContent from "../hooks/usePageContent.js";

function HealthAndSafetyPage() {
  const { heading, sections } = usePageContent("health-and-safety");
  const info = sections.length > 0 ? sections : [{ title: "Evacuation Information", body: "Placeholder text..." }];

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto", textAlign: "left" }}>
      <h1>{heading ? heading.title : "Health & Safety"}</h1>
      <p style={{ marginBottom: "24px", color: "#555", whiteSpace: "pre-line" }}>
        {heading ? heading.body : "Emergency evacuation points for arriving marae users:"}
      </p>

      <div style={{ borderRadius: "16px", overflow: "hidden", marginBottom: "24px", border: "1px solid #e1e1e1" }}>
        <img
          src="/images/evacuation-plan.png"
          alt="Ngaa Tai E Rua Paa fire evacuation plan, showing exits and the front carpark assembly area"
          style={{ width: "100%", display: "block" }}
        />
      </div>

      {info.map((section) => (
        <div key={section.title} style={{ padding: "24px", background: "#f9f9f9", borderRadius: "12px", border: "1px solid #e1e1e1", marginBottom: "16px" }}>
          <h2 style={{ marginTop: 0 }}>{section.title}</h2>
          <p style={{ color: "#555", lineHeight: 1.7, whiteSpace: "pre-line" }}>{section.body}</p>
        </div>
      ))}
    </div>
  );
}

export default HealthAndSafetyPage;
