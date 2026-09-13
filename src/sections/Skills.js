import { useState } from "react";
import { motion } from "framer-motion";
import { skillGroups } from "../data/skills";
import { SectionHeading } from "../components/ui/SectionHeading";
import { RevealGroup, revealItemVariants } from "../components/ui/Reveal";
import { sfx } from "../lib/sound";
import "./Skills.css";

/**
 * One honest line per technology - what he actually uses it for. Hovering a
 * chip swaps the shared readout, so the section teaches instead of listing.
 */
const NOTES = {
  Java: "The core language. Eleven years of syntax muscle memory and five in production.",
  "Spring Framework": "Dependency injection, MVC, the plumbing under everything else.",
  "Spring Boot": "Where most of the working day happens. Services, starters, actuator.",
  "Spring Security": "Auth, roles and filter chains on citizen-facing systems.",
  "Hibernate / JPA": "Entity mapping and the query tuning that follows it.",
  "Node.js": "For tooling and the occasional service that does not need a JVM.",
  "Express.js": "Small APIs, quick internal tools.",
  React: "This site, and the front ends that pair with his services.",
  Angular: "Production UI work alongside the Spring back end.",
  JavaScript: "The other language he thinks in.",
  "HTML / CSS": "Hand-written. No framework did this page.",
  PostgreSQL: "Primary datastore. Schema design, indexes, explain plans.",
  MySQL: "Long-running systems that were already there and had to keep working.",
  "Apache Kafka": "Event streams between services that must not lose messages.",
  AWS: "Where the services run.",
  Microservices: "Service boundaries drawn so they survive contact with a deadline.",
  "REST APIs": "The contract. Versioned, documented, predictable.",
  Git: "Small commits, readable history.",
  "Apache Tomcat": "Deployment target for the servlet-era estate.",
};

export function Skills() {
  const [active, setActive] = useState(null);

  return (
    <section id="skills" className="skills section">
      <div className="container">
        <SectionHeading
          index="04"
          eyebrow="Technology"
          title="The stack, end to end."
          description="Tools used deliberately, not collected for their own sake. Hover anything to see what it is actually for."
        />

        {/* Shared readout — one line, always in the same place */}
        <div className="skills__readout" aria-live="polite">
          <motion.p
            key={active || "idle"}
            className={"skills__readout-text " + (active ? "" : "skills__readout-text--idle")}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {active ? (
              <>
                <strong>{active}</strong>
                <span className="skills__readout-sep">—</span>
                {NOTES[active] || "Part of the toolkit."}
              </>
            ) : (
              "Point at a technology to hear why it is on this list."
            )}
          </motion.p>
        </div>

        <div className="skills__groups">
          {skillGroups.map((group) => (
            <div key={group.id} className="skills__group">
              <h3 className="skills__group-label">
                {group.label}
                <span className="skills__group-count">{group.skills.length}</span>
              </h3>
              <RevealGroup className="skills__grid" stagger={0.05}>
                {group.skills.map(({ name, icon: Icon }) => (
                  <motion.button
                    key={name}
                    type="button"
                    className={"skill-chip " + (active === name ? "skill-chip--on" : "")}
                    variants={revealItemVariants}
                    onPointerEnter={() => {
                      setActive(name);
                      sfx.hover();
                    }}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(name)}
                    onBlur={() => setActive(null)}
                    onClick={() => sfx.click()}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Icon className="skill-chip__icon" aria-hidden="true" />
                    <span>{name}</span>
                  </motion.button>
                ))}
              </RevealGroup>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
