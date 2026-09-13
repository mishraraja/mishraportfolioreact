import { profile, focusAreas } from "../data/profile";
import { Reveal, RevealGroup, revealItemVariants } from "../components/ui/Reveal";
import { motion } from "framer-motion";
import { useSpotlight } from "../hooks/useMagnetic";
import { useExperience } from "../context/ExperienceContext";
import { sfx } from "../lib/sound";
import "./About.css";

/** A focus card that lights up under the cursor and flips to show the stack. */
function FocusCard({ area }) {
  const ref = useSpotlight();

  return (
    <motion.div
      ref={ref}
      className="about__focus-card"
      variants={revealItemVariants}
      onPointerEnter={sfx.hover}
    >
      <span className="about__focus-glow" aria-hidden="true" />
      <h3>{area.label}</h3>
      <p className="text-muted">{area.detail}</p>
    </motion.div>
  );
}

/**
 * Hobbies are not decoration here. Each one does something: chess opens a real
 * puzzle, and the others respond rather than sitting there as static text.
 */
function HobbyChip({ hobby }) {
  const { setChessOpen } = useExperience();
  const isChess = hobby.toLowerCase().includes("chess");

  const reactions = {
    Reading: "Currently: anything on distributed systems.",
    Traveling: "Window seat, every time.",
  };

  if (isChess) {
    return (
      <button
        type="button"
        className="tag tag--interactive tag--chess"
        onClick={() => {
          setChessOpen(true);
          sfx.open();
        }}
        onPointerEnter={sfx.hover}
        title="Play a mate in one"
      >
        <span aria-hidden="true" className="tag__glyph">
          {"♞"}
        </span>
        {hobby}
        <span className="tag__cta">play</span>
      </button>
    );
  }

  return (
    <span className="tag tag--interactive" title={reactions[hobby] || ""}>
      {hobby}
    </span>
  );
}

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
            <h2 className="about__statement">{profile.bio[0]}</h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="about__body text-muted">{profile.bio[1]}</p>
          </Reveal>

          <RevealGroup className="about__focus" stagger={0.08}>
            {focusAreas.map((area) => (
              <FocusCard key={area.label} area={area} />
            ))}
          </RevealGroup>

          <Reveal delay={0.15} className="about__hobbies">
            <span className="about__hobbies-label text-muted">Outside of engineering</span>
            <div className="about__hobbies-list">
              {profile.hobbies.map((hobby) => (
                <HobbyChip key={hobby} hobby={hobby} />
              ))}
            </div>
          </Reveal>

          {profile.education ? (
            <Reveal delay={0.2} className="about__hobbies">
              <span className="about__hobbies-label text-muted">Education</span>
              <p>
                {profile.education.degree}{" "}
                <span className="text-muted">· {profile.education.period}</span>
              </p>
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
