import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { skillGroups } from "../data/skills";
import { SectionHeading } from "../components/ui/SectionHeading";
import { RevealGroup, revealItemVariants } from "../components/ui/Reveal";
import { sfx } from "../lib/sound";
import "./Skills.css";

/** One honest line per technology — what he actually uses it for. */
const NOTES = {
  Java: "The core language. Eleven years of syntax muscle memory, five in production.",
  "Spring Framework": "Dependency injection, MVC, the plumbing under everything else.",
  "Spring Boot": "Where most of the working day happens. Services, starters, actuator.",
  "Spring Security": "Auth, roles and filter chains on citizen-facing systems.",
  "Hibernate / JPA": "Entity mapping and the query tuning that follows it.",
  "Node.js": "Tooling, and the occasional service that does not need a JVM.",
  "Express.js": "Small APIs and quick internal tools.",
  React: "This page, and the front ends that pair with his services.",
  Angular: "Production UI work alongside the Spring back end.",
  JavaScript: "The other language he thinks in.",
  "HTML / CSS": "Hand-written. No framework drew this page.",
  PostgreSQL: "Primary datastore. Schema design, indexes, explain plans.",
  MySQL: "Long-running systems that were already there and had to keep working.",
  "Apache Kafka": "Event streams between services that must not lose a message.",
  AWS: "Where the services actually run.",
  Microservices: "Boundaries drawn so they survive contact with a deadline.",
  "REST APIs": "The contract. Versioned, documented, predictable.",
  Git: "Small commits, readable history.",
  "Apache Tomcat": "Deployment target for the servlet-era estate.",
};

/* ---------- star chart geometry ---------- */
const VIEW_W = 1000;
const VIEW_H = 580;

/** Where each constellation sits on the chart. Hand-placed, not random. */
const ANCHORS = {
  backend: { x: 258, y: 210, spread: 132 },
  frontend: { x: 672, y: 128, spread: 126 },
  "data-cloud": { x: 812, y: 392, spread: 116 },
  concepts: { x: 468, y: 398, spread: 82 },
  tools: { x: 135, y: 452, spread: 76 },
};

/**
 * Deterministic jitter. Seeded by name so the chart is identical on every
 * render and every visit — a star map that moved would not be a star map.
 */
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function buildChart() {
  return skillGroups.map((group) => {
    const anchor = ANCHORS[group.id] || { x: 500, y: 290, spread: 100 };
    const n = group.skills.length;

    const stars = group.skills.map((skill, i) => {
      // Spread around the hub, with seeded wobble on both angle and radius.
      const wobble = seeded(skill.name);
      const angle = (i / n) * Math.PI * 2 + wobble * 0.9 - 0.45;
      const radius = anchor.spread * (0.55 + wobble * 0.5);
      return {
        name: skill.name,
        icon: skill.icon,
        group: group.label,
        x: anchor.x + Math.cos(angle) * radius,
        y: anchor.y + Math.sin(angle) * radius * 0.82,
        r: 3.2 + wobble * 2.6,
        twinkle: 2 + wobble * 3,
      };
    });

    return { ...group, anchor, stars };
  });
}

export function Skills() {
  const chart = useMemo(buildChart, []);
  const [active, setActive] = useState(null);

  const readout = active || {
    name: "Star chart",
    group: "Hover a star",
    note: "Nineteen technologies in five constellations. The brighter the star, the more of the working week it accounts for.",
  };

  return (
    <section id="skills" className="skills section">
      <div className="container">
        <SectionHeading
          index="05"
          eyebrow="Technology"
          title="The stack, mapped."
          description="Five constellations, nineteen stars. Everything here is used deliberately, not collected."
        />

        {/* ---------- the chart (wide screens) ---------- */}
        <div className="skills__chart-wrap">
          <svg
            className="skills__chart"
            viewBox={"0 0 " + VIEW_W + " " + VIEW_H}
            role="group"
            aria-label="Technology skills drawn as a star chart"
          >
            <defs>
              <radialGradient id="skillStar">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="var(--color-accent-strong, #ab9dff)" />
                <stop offset="100%" stopColor="var(--color-accent, #8b7bff)" stopOpacity="0.4" />
              </radialGradient>
              <filter id="starBloom" x="-140%" y="-140%" width="380%" height="380%">
                <feGaussianBlur stdDeviation="3.4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Faint lines between constellation hubs — the chart's backbone */}
            <g className="skills__links">
              {chart.map((g, i) => {
                const next = chart[(i + 1) % chart.length];
                return (
                  <line
                    key={"hub-" + g.id}
                    x1={g.anchor.x}
                    y1={g.anchor.y}
                    x2={next.anchor.x}
                    y2={next.anchor.y}
                    className="skills__hub-link"
                  />
                );
              })}
            </g>

            {chart.map((group) => (
              <g
                key={group.id}
                className={
                  "skills__constellation " +
                  (active && active.group === group.label ? "skills__constellation--on" : "")
                }
              >
                {/* Spokes from the hub to each star */}
                {group.stars.map((s) => (
                  <line
                    key={"l-" + s.name}
                    x1={group.anchor.x}
                    y1={group.anchor.y}
                    x2={s.x}
                    y2={s.y}
                    className="skills__spoke"
                  />
                ))}

                {/* The hub itself carries the group name */}
                <circle cx={group.anchor.x} cy={group.anchor.y} r={3} className="skills__hub" />
                <text x={group.anchor.x} y={group.anchor.y - 14} className="skills__group-name">
                  {group.label}
                </text>

                {group.stars.map((s) => (
                  <g
                    key={s.name}
                    className={
                      "skills__star " + (active && active.name === s.name ? "skills__star--on" : "")
                    }
                    tabIndex={0}
                    role="button"
                    aria-label={s.name + " — " + (NOTES[s.name] || "Part of the toolkit.")}
                    onPointerEnter={() => {
                      setActive({ name: s.name, group: s.group, note: NOTES[s.name] });
                      sfx.hover();
                    }}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive({ name: s.name, group: s.group, note: NOTES[s.name] })}
                    onBlur={() => setActive(null)}
                    onClick={() => sfx.click()}
                  >
                    <circle cx={s.x} cy={s.y} r={16} className="skills__star-hit" />
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={s.r}
                      fill="url(#skillStar)"
                      filter="url(#starBloom)"
                      style={{ animationDuration: s.twinkle + "s" }}
                      className="skills__star-core"
                    />
                    <text x={s.x} y={s.y + s.r + 15} className="skills__star-label">
                      {s.name}
                    </text>
                  </g>
                ))}
              </g>
            ))}
          </svg>

          <div className="skills__readout" aria-live="polite">
            <span className="skills__readout-group">{readout.group}</span>
            <strong className="skills__readout-name">{readout.name}</strong>
            <p className="skills__readout-note">{readout.note || "Part of the toolkit."}</p>
          </div>
        </div>

        {/* ---------- grouped list (narrow screens) ---------- */}
        <div className="skills__groups">
          {skillGroups.map((group) => (
            <div key={group.id} className="skills__group">
              <h3 className="skills__group-label">
                {group.label}
                <span className="skills__group-count">{group.skills.length}</span>
              </h3>
              <RevealGroup className="skills__grid" stagger={0.04}>
                {group.skills.map(({ name, icon: Icon }) => (
                  <motion.span key={name} className="skill-chip" variants={revealItemVariants}>
                    <Icon className="skill-chip__icon" aria-hidden="true" />
                    <span>{name}</span>
                  </motion.span>
                ))}
              </RevealGroup>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
