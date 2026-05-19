function ContactPage() {
  return (
    <div style={{ padding: "40px", maxWidth: "700px", margin: "0 auto", textAlign: "left" }}>
      <h1>Contact Information</h1>
      <p style={{ marginBottom: "24px", color: "#555" }}>
        If you have a question or problem while staying at the marae, contact one of the people below.
      </p>

      <div style={{ display: "grid", gap: "20px" }}>
        <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "12px" }}>
          <h2 style={{ margin: "0 0 8px" }}>Marae Host</h2>
          <p style={{ margin: 0 }}>Name: Waren</p>
          <p style={{ margin: 0 }}>Phone: {"("}placeholder{")"}</p>
        </div>

        <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "12px" }}>
          <h2 style={{ margin: "0 0 8px" }}>Mare Caretaker</h2>
          <p style={{ margin: 0 }}>Name: {"("}placeholder{")"}</p>
          <p style={{ margin: 0 }}>Phone: {"("}placeholder{")"}</p>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
