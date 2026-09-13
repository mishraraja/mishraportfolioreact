import { Link, NavLink, Route, Routes } from "react-router-dom";
import { DsaProgressProvider, useProgress } from "./progress";
import { Hub } from "./pages/Hub";
import { ProblemPage } from "./pages/ProblemPage";
import { Patterns } from "./pages/Patterns";
import { PatternRadar } from "./pages/PatternRadar";
import { Roadmap } from "./pages/Roadmap";
import { BigO } from "./pages/BigO";
import { Playbook } from "./pages/Playbook";
import "./DsaArcade.css";

const LINKS = [
  { to: "/dsa", label: "Problems", icon: "🧭", end: true },
  { to: "/dsa/learn/patterns", label: "Patterns", icon: "🧠" },
  { to: "/dsa/radar", label: "Pattern Radar", icon: "📡" },
  { to: "/dsa/learn/roadmap", label: "8-Week Plan", icon: "🗺️" },
  { to: "/dsa/learn/big-o", label: "Big-O Lab", icon: "⚡" },
  { to: "/dsa/learn/interview", label: "Interview Playbook", icon: "🎤" },
];

function XpPill() {
  const { xp, level, streak } = useProgress();
  return (
    <Link to="/dsa/learn/roadmap" className="arcade-xp" aria-label={`Level: ${level.name}, ${xp} XP${streak ? `, ${streak}-day streak` : ""}`}>
      <span aria-hidden="true">{level.emoji}</span>
      <span className="arcade-xp__name">{level.name}</span>
      <span className="arcade-xp__num">{xp} XP</span>
      {streak ? <span className="arcade-xp__streak">🔥 {streak}</span> : null}
    </Link>
  );
}

/**
 * The DSA Arcade: a separate, lazily loaded part of the site. It owns its own
 * routes and progress, and borrows the site's sky, themes and sound.
 */
export default function DsaArcade() {
  return (
    <DsaProgressProvider>
      <div className="arcade">
        <div className="container">
          <nav className="arcade-nav" aria-label="DSA Arcade">
            <Link to="/dsa" className="arcade-nav__brand">
              <span aria-hidden="true">🕹️</span> DSA Arcade
            </Link>
            <div className="arcade-nav__links">
              {LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => "arcade-nav__link" + (isActive ? " is-active" : "")}>
                  <span aria-hidden="true">{link.icon}</span> {link.label}
                </NavLink>
              ))}
            </div>
            <XpPill />
          </nav>

          <Routes>
            <Route index element={<Hub />} />
            <Route path="learn/patterns" element={<Patterns />} />
            <Route path="learn/roadmap" element={<Roadmap />} />
            <Route path="learn/big-o" element={<BigO />} />
            <Route path="learn/interview" element={<Playbook />} />
            <Route path="radar" element={<PatternRadar />} />
            <Route path=":slug" element={<ProblemPage />} />
          </Routes>
        </div>
      </div>
    </DsaProgressProvider>
  );
}
