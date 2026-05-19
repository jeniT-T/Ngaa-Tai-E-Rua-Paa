import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
      <h3>Marae System</h3>

      <div style={{ display: "flex", gap: "15px" }}>
        <Link to="/">Home</Link>
        <Link to="/arrival">Arrival Info</Link>
        <Link to="/contacts">Contacts</Link>
        <Link to="/health-and-safety">Health & Safety</Link>
      </div>
    </nav>
  );
}

export default Navbar;