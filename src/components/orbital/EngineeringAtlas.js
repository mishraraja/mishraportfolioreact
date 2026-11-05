import { useState } from "react";
import { motion } from "framer-motion";
import { focusAreas } from "../../data/profile";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./EngineeringAtlas.css";

const routes = ["M90 160H210Q250 160 270 120L310 50H590", "M90 160H590", "M90 160H210Q250 160 270 200L310 270H590"];
const levels = [50, 160, 270];

export function EngineeringAtlas() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  return <div className="engineering-atlas">
    <div className="engineering-atlas__label"><span>CONNECTED DISCIPLINES</span><span>SELECT A LAYER ↘</span></div>
    <svg viewBox="0 0 700 320" className="engineering-atlas__map" aria-hidden="true">
      <defs><radialGradient id="atlas-light"><stop stopColor="var(--color-accent)" stopOpacity=".15" /><stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" /></radialGradient></defs>
      <ellipse cx="350" cy="160" rx="320" ry="155" fill="url(#atlas-light)" />
      <g fill="none" stroke="var(--color-border-strong)" strokeWidth=".7"><circle cx="90" cy="160" r="45" /><circle cx="90" cy="160" r="60" strokeDasharray="2 7" /><path d="M0 160H700M350 0V320" strokeDasharray="2 12" /></g>
      <text x="90" y="164" textAnchor="middle" fill="var(--color-fg)" fontFamily="var(--font-mono)" fontSize="14">RM</text>
      {focusAreas.map((area, i) => <g key={area.label}>
        <path d={routes[i]} fill="none" stroke={active === i ? "var(--color-accent)" : "var(--color-border-strong)"} strokeWidth={active === i ? 1.7 : .8} />
        <circle cx="590" cy={levels[i]} r="5" fill={active === i ? "var(--color-accent)" : "var(--color-bg)"} stroke="var(--color-accent-border)" />
        <text x="340" y={levels[i] - 14} fill={active === i ? "var(--color-accent-strong)" : "var(--color-fg-muted)"} fontSize="12" fontFamily="var(--font-mono)">{area.label.toUpperCase()}</text>
        <text x="630" y={levels[i] + 4} fill="var(--color-fg-muted)" fontSize="10" fontFamily="var(--font-mono)">0{i + 1}</text>
      </g>)}
      <motion.circle cx="590" r="15" fill="none" stroke="var(--color-accent-3)" strokeWidth="1" initial={false} animate={{ cy: levels[active] }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 150, damping: 22 }} />
    </svg>
    <div className="engineering-atlas__layers" role="group" aria-label="Engineering disciplines">
      {focusAreas.map((area, i) => <button key={area.label} type="button" aria-pressed={active === i} onClick={() => setActive(i)}>
        <span>0{i + 1}</span><strong>{area.label}</strong><small>{area.detail}</small>
        {active === i && <motion.i layoutId={reduced ? undefined : "atlas-layer"} transition={{ type: "spring", stiffness: 300, damping: 30 }} aria-hidden="true" />}
      </button>)}
    </div>
  </div>;
}
