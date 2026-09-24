import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import useArrivalAccess from "../hooks/useArrivalAccess.js";

// Where each role's "dashboard" link should point
const DASHBOARD_LINKS = {
  admin: { to: "/admin", label: "Admin Dashboard" },
  caretaker: { to: "/caretaker", label: "Caretaker Dashboard" },
  member: { to: "/bookings", label: "Bookings" },
};

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const arrivalAccess = useArrivalAccess();

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleLogout() {
    await logout();
    closeMenu();
    navigate("/");
  }

  const dashboard = user ? DASHBOARD_LINKS[user.role] : null;

  // Check if a route is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/events", label: "Events" },
    { to: "/contacts", label: "Contact Us" },
  ];

  return (
    <header>
      <div className="header-container">
        {/* Left: Logo + Title */}
        <div className="header-left">
          <img src="/images/logo.png" alt="Marae Logo" className="logo" />
          <h3 className="header-title">Marae System</h3>
        </div>

        {/* Right: Navigation */}
        <nav className={`navbar ${menuOpen ? "show-menu" : ""}`}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className={isActive(link.to) ? "active" : ""}
            >
              {link.label}
            </Link>
          ))}

          {/* Auth-aware section */}
          {user ? (
            <>
              {dashboard && (
                <Link
                  to={dashboard.to}
                  onClick={closeMenu}
                  className={isActive(dashboard.to) ? "active" : ""}
                >
                  {dashboard.label}
                </Link>
              )}
              {arrivalAccess === "allowed" && (
                <Link
                  to="/arrival"
                  onClick={closeMenu}
                  className={isActive("/arrival") ? "active" : ""}
                >
                  Arrival Info
                </Link>
              )}
              <span className="navbar-user">Kia ora, {user.name}</span>
              <button className="navbar-logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={closeMenu}
                className={isActive("/login") ? "active" : ""}
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className={isActive("/register") ? "active" : ""}
              >
                Register
              </Link>
            </>
          )}
        </nav>

        {/* Hamburger menu toggle */}
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


        <Link to="/caretaker/calendar" onClick={closeMenu}>
          Calendar
        </Link>

        <Link to="/caretaker/schedule" onClick={closeMenu}>
          Schedule
        </Link>


        {/* Auth-aware section */}
        {user ? (
          <>
            {dashboard && (
              <Link to={dashboard.to} onClick={closeMenu}>
                {dashboard.label}
              </Link>
            )}
            {arrivalAccess === "allowed" && (
              <Link to="/arrival" onClick={closeMenu}>
                Arrival Info
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
