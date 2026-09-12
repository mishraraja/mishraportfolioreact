import { profile } from "../data/profile";
import { navItems } from "../data/nav";
import "./Footer.css";

export function Footer() {
  const year = new Date().getFullYear();

  function go(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__top">
          <a href="#home" className="footer__brand" onClick={(e) => { e.preventDefault(); go("home"); }}>
            {profile.name}
          </a>

          <nav className="footer__nav" aria-label="Footer">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.id);
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="footer__socials">
            {profile.social.github ? (
              <a href={profile.social.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
            ) : null}
            <a href={profile.social.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href={profile.social.twitter} target="_blank" rel="noreferrer">
              Twitter
            </a>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {year} {profile.name}. All rights reserved.</span>
          <span>Designed &amp; engineered by {profile.name}.</span>
        </div>
      </div>
    </footer>
  );
}
