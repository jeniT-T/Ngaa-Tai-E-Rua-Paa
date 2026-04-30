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
      <section style={{ 
        display: "flex", 
        justifyContent: "center", 
        gap: "20px",
        marginBottom: "50px"
      }}>
        <Link to="/arrival">
          <button>Visitor Information</button>
        </Link>

        <button>Make a Booking</button>

        <button>About</button>
      </section>

    </div>
  );
}

export default HomePage;