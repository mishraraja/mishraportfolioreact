import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { navItems } from "../data/nav";
import { profile } from "../data/profile";
import { useScrollSpy } from "../hooks/useScrollSpy";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";
import "./Navbar.css";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeId = useScrollSpy(["home", ...navItems.map((item) => item.id)]);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onHome = pathname === "/";
  const inArcade = pathname.startsWith("/dsa");

  useLockBodyScroll(mobileOpen);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Section links scroll on the home page; anywhere else they go home first.
  function go(id) {
    setMobileOpen(false);
    if (!onHome) {
      navigate("/", { state: { scrollTo: id } });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <header className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
      <a href="/" className="nav__brand" onClick={(e) => { e.preventDefault(); go("home"); }}>
        {profile.initials}
      </a>

      <nav className="nav__links" aria-label="Primary">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`/#${item.id}`}
            className={`nav__link ${onHome && activeId === item.id ? "nav__link--active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              go(item.id);
            }}
          >
            {item.label}
          </a>
        ))}
        <Link
          to="/dsa"
          className={`nav__link nav__link--arcade ${inArcade ? "nav__link--active" : ""}`}
          aria-current={inArcade ? "page" : undefined}
        >
          DSA Arcade
        </Link>
      </nav>

      <div className="nav__actions">
        {profile.resumeUrl ? (
          <a className="nav__resume" href={profile.resumeUrl} target="_blank" rel="noreferrer">
            Resume
          </a>
        ) : null}
        <button
          className={`nav__toggle ${mobileOpen ? "nav__toggle--open" : ""}`}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>

      {mobileOpen && (
        <div className="nav__mobile" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`/#${item.id}`}
              className={`nav__mobile-link ${onHome && activeId === item.id ? "nav__mobile-link--active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                go(item.id);
              }}
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/dsa"
            className={`nav__mobile-link nav__mobile-link--arcade ${inArcade ? "nav__mobile-link--active" : ""}`}
            onClick={() => setMobileOpen(false)}
          >
            🕹️ DSA Arcade
          </Link>
        </div>
      )}
    </header>
  );
}
