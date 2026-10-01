import { useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import useArrivalAccess from "../hooks/useArrivalAccess.js";

// Where each role's "dashboard" link should point — kept in sync with
// ROLE_HOME in HomeRoute.jsx, which sends a logged-in user here from "/".
const DASHBOARD_LINKS = {
  admin: { to: "/admin", label: "Admin Dashboard" },
  manager: { to: "/manager", label: "Manager Dashboard" },
  caretaker: { to: "/caretaker", label: "Caretaker Dashboard" },
  // Members have no separate dashboard — "Home" (above) already shows them
  // their booking status alongside the normal public homepage.
};

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const containerRef = useRef(null);
  const brandRef = useRef(null);
  const navRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const arrivalAccess = useArrivalAccess();

  useLayoutEffect(() => {
    const container = containerRef.current;
    let active = true;
    function measure() {
      if (!active) return;
      const copy = navRef.current.cloneNode(true);
      copy.removeAttribute("id");
      copy.className = "navbar navbar-measure";
      copy.setAttribute("aria-hidden", "true");
      copy.inert = true;
      container.appendChild(copy);
      const style = getComputedStyle(container);
      const available = container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const brand = brandRef.current;
      const brandWidth = [...brand.children].reduce((total, child) => total + Math.max(child.scrollWidth, child.getBoundingClientRect().width), 0)
        + parseFloat(getComputedStyle(brand).columnGap);
      const required = brandWidth + copy.getBoundingClientRect().width + parseFloat(style.columnGap);
      const needsMenu = required > available || window.innerWidth <= 768;
      copy.remove();
      setCompact(needsMenu);
      if (!needsMenu) setMenuOpen(false);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    window.addEventListener("resize", measure);
    document.fonts.ready.then(measure);
    return () => {
      active = false;
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [user, arrivalAccess, location.pathname]);

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleLogout() {
    await logout();
    closeMenu();
    navigate("/");
  }

  const dashboard = user ? DASHBOARD_LINKS[user.role] : null;
  const isCaretakerStaff = user && (user.role === "caretaker" || user.role === "admin");

  // Check if a route is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // "Events" used to live here too — it's now one of the three "Explore"
  // boxes on the homepage instead (see HomePage.jsx), so it's been dropped
  // from the navbar to avoid listing it twice. "Contact Us" is dropped too,
  // but only for the caretaker role — they work inside the product all day
  // and don't need it, whereas members/admin/logged-out visitors still do.
  const navLinks = [
    { to: "/", label: "Home" },
    ...(user?.role === "caretaker" ? [] : [{ to: "/contacts", label: "Contact Us" }]),
  ];

  return (
    <header className={compact ? "header-compact" : undefined}>
      <div className="header-container" ref={containerRef}>
        {/* Left: Logo + Title */}
        <div className="header-left" ref={brandRef}>
          <img src="/images/logo.png" alt="Marae Logo" className="logo" />
          <h3 className="header-title">Marae System</h3>
        </div>

        {/* Right: Navigation */}
        <nav id="main-navigation" ref={navRef} aria-label="Main navigation" className={`navbar ${menuOpen ? "show-menu" : ""}`}>
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
              {/* Caretakers don't need the Marae Guide link — that's for the
                  people hiring the marae, not the staff running it. Still
                  shown to admin/member as before. */}
              {arrivalAccess === "allowed" && user?.role !== "caretaker" && (
                <Link
                  to="/arrival"
                  onClick={closeMenu}
                  className={isActive("/arrival") ? "active" : ""}
                >
                  Marae Guide
                </Link>
              )}
              {/* Caretaker's own task calendar/schedule — only shown (and only
                  reachable, see App.jsx's RoleRoute) to caretaker/admin. */}
              {isCaretakerStaff && (
                <>
                  <Link
                    to="/caretaker/calendar"
                    onClick={closeMenu}
                    className={isActive("/caretaker/calendar") ? "active" : ""}
                  >
                    Calendar
                  </Link>
                  <Link
                    to="/caretaker/schedule"
                    onClick={closeMenu}
                    className={isActive("/caretaker/schedule") ? "active" : ""}
                  >
                    Schedule
                  </Link>
                  <Link
                    to="/caretaker/manage-content"
                    onClick={closeMenu}
                    className={isActive("/caretaker/manage-content") ? "active" : ""}
                  >
                    Manage Content
                  </Link>
                </>
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
          aria-expanded={compact && menuOpen}
          aria-controls="main-navigation"
        >
          ☰
        </button>
      </div>
    </header>
  );
}

export default Navbar;
