import { Link, NavLink, Route, Routes } from "react-router-dom";
import { JavaProgressProvider, useJavaProgress } from "./progress";
import { JavaHub } from "./pages/JavaHub";
import { WorldPage } from "./pages/WorldPage";
import { LabPage, LabsIndex } from "./pages/LabPage";
import { ThisOrThat } from "./pages/ThisOrThat";
import { GuessOutput } from "./pages/GuessOutput";
import { Revise } from "./pages/Revise";
import "../dsa/DsaArcade.css";
import "../dsa/pages/Hub.css";
import "../dsa/engine/Player.css";
import "./JavaArcade.css";

const LINKS = [
  { to: "/java", label: "Worlds", icon: "🧭", end: true },
  { to: "/java/labs", label: "Labs", icon: "🧪" },
  { to: "/java/play/this-or-that", label: "This or That", icon: "⚖️" },
  { to: "/java/play/guess-output", label: "Guess the Output", icon: "🖨️" },
  { to: "/java/revise", label: "Revision Sheet", icon: "📜" },
];

function XpPill() {
  const { xp, level, streak } = useJavaProgress();
  return (
    <Link to="/java" className="arcade-xp" aria-label={`Level: ${level.name}, ${xp} XP${streak ? `, ${streak}-day streak` : ""}`}>
      <span aria-hidden="true">{level.emoji}</span>
      <span className="arcade-xp__name">{level.name}</span>
      <span className="arcade-xp__num">{xp} XP</span>
      {streak ? <span className="arcade-xp__streak">🔥 {streak}</span> : null}
    </Link>
  );
}

/**
 * The Backend Arcade: Java backend interview topics as cards, labs and games.
 * Lazily loaded like the DSA Arcade, and shares its chrome.
 */
export default function JavaArcade() {
  return (
    <JavaProgressProvider>
      <div className="arcade jarcade">
        <div className="container">
          <nav className="arcade-nav" aria-label="Backend Arcade">
            <Link to="/java" className="arcade-nav__brand">
              <span aria-hidden="true">☕</span> Backend Arcade
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
            <Route index element={<JavaHub />} />
            <Route path="labs" element={<LabsIndex />} />
            <Route path="lab/:labId" element={<LabPage />} />
            <Route path="play/this-or-that" element={<ThisOrThat />} />
            <Route path="play/guess-output" element={<GuessOutput />} />
            <Route path="revise" element={<Revise />} />
            <Route path=":worldId" element={<WorldPage />} />
          </Routes>
        </div>
      </div>
    </JavaProgressProvider>
  );
}
