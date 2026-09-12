import { experience } from "../data/experience";
import { profile } from "../data/profile";
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

function ExperienceSnapshot() {
  return (
    <div className="snapshot">
      <Reveal className="snapshot__stat">
        <span className="snapshot__number">{profile.yearsExperience}+</span>
        <span className="text-muted">Years building production software</span>
      </Reveal>
      <Reveal delay={0.08} className="snapshot__note">
        <p>
          {profile.name} has spent that time going deep on the Java ecosystem — Spring Boot, Spring Security
          and Hibernate/JPA — while shipping full-stack work end to end with React, Angular and Node.js.
        </p>
        <p className="text-muted snapshot__pending">
          A detailed role-by-role timeline will appear here once employer and project history is added.
        </p>
      </Reveal>
    </div>
  );
}

export function Experience() {
  return (
    <section id="experience" className="experience section">
      <div className="container">
        <SectionHeading index="02" eyebrow="Experience" title="Where the time went." />
        {experience.length > 0 ? (
          <RevealGroup>
            <Timeline />
          </RevealGroup>
        ) : (
          <ExperienceSnapshot />
        )}
      </div>
    </section>
  );
}
