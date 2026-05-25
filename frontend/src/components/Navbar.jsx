import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
      {/*Logo */}
      <div 
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
      <img src="/images/logo.png"
      alt="Marae Logo"
      style={{
        width: "45px",
        height: "45px",
        objectFit: "contain",
      }}/>
      <h3>Marae System</h3>
      </div>

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