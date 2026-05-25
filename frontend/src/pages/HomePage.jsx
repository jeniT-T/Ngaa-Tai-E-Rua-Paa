import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div style={{ padding: "40px" }}>
      
      {/* HERO SECTION */}
      <section style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2.5rem" }}>
          Welcome to the Marae
        </h1>

        <p style={{ fontSize: "1.2rem", color: "#555" }}>
          A place of connection, culture, and community.
        </p>
      </section>

      {/* ACTION BUTTONS */}
      <section className="actionButton">
        <Link to="/arrival">
          <button className="glButton">Visitor Information</button>
        </Link>

        <button className="glButton">Make a Booking</button>

        <button className="glButton">About</button>
      </section>

    </div>
  );
}

export default HomePage;