import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header>
      {/*Logo and Title*/}
      <div className="header">
      <img src="/images/logo.png"
      alt="Marae Logo"
      className="logo"
      />
      <h3>Marae System</h3>
      </div>
      {/*Navigation bar*/}
      <nav className="navbar">
        <Link to="/">Home</Link>
        <Link to="/arrival">Arrival Info</Link>
        <Link to="/contacts">Contacts</Link>
        <Link to="/health-and-safety">Health & Safety</Link>
    </nav>
    </header>
  );
}

export default Navbar;