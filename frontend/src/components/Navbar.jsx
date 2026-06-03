import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header>
      {/* Logo and Title */}
      <div className="header">
        <img
          src="/images/logo.png"
          alt="Marae Logo"
          className="logo"
        />

        <h3>Marae System</h3>

        {/* Hamburger button only appears on phone size */}
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>
      </div>

      {/* Navigation bar */}
      <nav className={`navbar ${menuOpen ? "show-menu" : ""}`}>
        <Link to="/" onClick={closeMenu}>
          Home
        </Link>

        <Link to="/arrival" onClick={closeMenu}>
          Arrival Info
        </Link>

        <Link to="/contacts" onClick={closeMenu}>
          Contacts
        </Link>

        <Link to="/health-and-safety" onClick={closeMenu}>
          Health & Safety
        </Link>

        <Link to="/map" onClick={closeMenu}>
          Map
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;