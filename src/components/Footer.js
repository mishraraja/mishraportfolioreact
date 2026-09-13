import { Link, useLocation, useNavigate } from "react-router-dom";
import { profile } from "../data/profile";
import { navItems } from "../data/nav";
import { useExperience } from "../context/ExperienceContext";
import { sfx } from "../lib/sound";
import "./Footer.css";

export function Footer() {
  const year = new Date().getFullYear();
  const { unlockedCount, total, rank, setTrophyOpen } = useExperience();
  const found = unlockedCount > 0;
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function go(id) {
    if (pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__top">
          <a
            href="/"
            className="footer__brand"
            onClick={(e) => {
              e.preventDefault();
              go("home");
            }}
          >
            {profile.name}
          </a>

          <nav className="footer__nav" aria-label="Footer">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={"/#" + item.id}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.id);
                }}
                onPointerEnter={sfx.hover}
              >
                {item.label}
              </a>
            ))}
            <Link to="/dsa" onPointerEnter={sfx.hover}>
              DSA Arcade
            </Link>
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

        {/* The scoreboard, stated plainly, so nobody leaves without knowing
            there was something to find. */}
        <button
          type="button"
          className="footer__hunt"
          onClick={() => {
            setTrophyOpen(true);
            sfx.open();
          }}
          onPointerEnter={sfx.hover}
        >
          <span className="footer__hunt-bar" aria-hidden="true">
            <span
              className="footer__hunt-fill"
              style={{ width: (unlockedCount / total) * 100 + "%" }}
            />
          </span>
          <span className="footer__hunt-text">
            {found ? (
              <>
                <strong>{rank}</strong> — you have found {unlockedCount} of {total} hidden things
                on this site.
              </>
            ) : (
              <>
                There are <strong>{total} hidden things</strong> on this site. You have found none
                of them yet.
              </>
            )}
          </span>
          <span className="footer__hunt-cta">Open the list</span>
        </button>

        <div className="footer__bottom">
          <span>
            © {year} {profile.name}. All rights reserved.
          </span>
          <span className="footer__built">
            Hand-built with React. No UI kit, no confetti library, no audio files.
          </span>
        </div>
      </div>
    </footer>
  );
}
