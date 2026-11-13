import { experience } from "../data/experience";
import { SectionHeading } from "../components/ui/SectionHeading";
import { Reveal, RevealGroup, revealItemVariants } from "../components/ui/Reveal";
import { motion } from "framer-motion";
import "./Experience.css";

function Timeline() {
  return (
    <ol className="timeline">
      {experience.map((role, i) => (
        <motion.li key={role.role + role.period} className="timeline__item" variants={revealItemVariants}>
          <div className="timeline__marker">
            <span className="timeline__dot" />
            {i !== experience.length - 1 && <span className="timeline__line" />}
          </div>
          <div className="timeline__body">
            <span className="timeline__period text-muted">{role.period}</span>
            <h3 className="timeline__role">{role.role}</h3>
            {role.company ? <p className="timeline__company">{role.company}</p> : null}
            <p className="timeline__summary text-muted">{role.summary}</p>
            {role.highlights?.length ? (
              <ul className="timeline__highlights">
                {role.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            ) : null}
            {role.stack?.length ? (
              <div className="timeline__stack">
                {role.stack.map((s) => (
                  <span key={s} className="tag">
                    {s}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

export function Experience() {
  return (
    <section id="experience" className="experience section">
      <div className="container">
        <SectionHeading index="02" eyebrow="Experience" title="My work." />
        <RevealGroup>
          <Timeline />
        </RevealGroup>
      </div>
    </section>
  );
}
