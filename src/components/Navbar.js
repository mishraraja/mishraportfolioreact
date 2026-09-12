import { useEffect, useState } from "react";
import { navItems } from "../data/nav";
import { profile } from "../data/profile";
import { useScrollSpy } from "../hooks/useScrollSpy";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";
import "./Navbar.css";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeId = useScrollSpy(["home", ...navItems.map((item) => item.id)]);

  useLockBodyScroll(mobileOpen);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function go(id) {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <header className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
      <a href="#home" className="nav__brand" onClick={(e) => { e.preventDefault(); go("home"); }}>
        {profile.initials}
      </a>

      <nav className="nav__links" aria-label="Primary">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`nav__link ${activeId === item.id ? "nav__link--active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              go(item.id);
            }}
          >
            {item.label}
          </a>
        ))}
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
              href={`#${item.id}`}
              className={`nav__mobile-link ${activeId === item.id ? "nav__mobile-link--active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                go(item.id);
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
