import { profile, focusAreas } from "../data/profile";
import { Reveal, RevealGroup, revealItemVariants } from "../components/ui/Reveal";
import { motion } from "framer-motion";
import "./About.css";

export function About() {
  return (
    <section id="about" className="about section">
      <div className="container about__grid">
        <Reveal as="div" className="about__label-col">
          <span className="eyebrow">
            <span className="section-heading__index">01</span>About
          </span>
        </Reveal>

        <div className="about__content-col">
          <Reveal>
            <h2 className="about__statement">
              {profile.bio[0]}
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="about__body text-muted">{profile.bio[1]}</p>
          </Reveal>

          <RevealGroup className="about__focus" stagger={0.08}>
            {focusAreas.map((area) => (
              <motion.div key={area.label} className="about__focus-card" variants={revealItemVariants}>
                <h3>{area.label}</h3>
                <p className="text-muted">{area.detail}</p>
              </motion.div>
            ))}
          </RevealGroup>

          <Reveal delay={0.15} className="about__hobbies">
            <span className="about__hobbies-label text-muted">Outside of engineering</span>
            <div className="about__hobbies-list">
              {profile.hobbies.map((hobby) => (
                <span key={hobby} className="tag">
                  {hobby}
                </span>
              ))}
            </div>
          </Reveal>

          {profile.education ? (
            <Reveal delay={0.2} className="about__hobbies">
              <span className="about__hobbies-label text-muted">Education</span>
              <p>
                {profile.education.degree} <span className="text-muted">· {profile.education.period}</span>
              </p>
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
