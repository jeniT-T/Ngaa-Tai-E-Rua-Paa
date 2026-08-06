import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Where each role's "dashboard" link should point
const DASHBOARD_LINKS = {
  admin: { to: "/admin", label: "Admin Dashboard" },
  caretaker: { to: "/caretaker/checklists", label: "Checklists" },
  member: { to: "/bookings", label: "Bookings" },
};

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleLogout() {
    await logout();
    closeMenu();
    navigate("/");
  }

  const dashboard = user ? DASHBOARD_LINKS[user.role] : null;

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

        <Link to="/events" onClick={closeMenu}>
          Events
        </Link>

        <Link to="/contacts" onClick={closeMenu}>
          Contact Us
        </Link>

        {/* Auth-aware section */}
        {user ? (
          <>
            {dashboard && (
              <Link to={dashboard.to} onClick={closeMenu}>
                {dashboard.label}
              </Link>
            )}
            <span className="navbar-user">Kia ora, {user.name}</span>
            <button className="navbar-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeMenu}>
              Login
            </Link>
            <Link to="/register" onClick={closeMenu}>
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;