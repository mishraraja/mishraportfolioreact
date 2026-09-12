import { motion } from "framer-motion";
import { profile } from "../data/profile";
import { Button } from "../components/ui/Button";
import { useReducedMotion } from "../hooks/useReducedMotion";
import "./Hero.css";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const stack = ["React", "Spring Boot", "Java", "PostgreSQL"];

function ArchitectureVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-visual__glow" />
      {stack.map((layer, i) => (
        <motion.div
          key={layer}
          className="hero-visual__row"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="hero-visual__dot" />
          <span className="hero-visual__label">{layer}</span>
          <span className="hero-visual__bar" style={{ width: `${58 - i * 9}%` }} />
        </motion.div>
      ))}
      <div className="hero-visual__footer">
        <span>system_status</span>
        <span className="hero-visual__ok">nominal</span>
      </div>
    </div>
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const MotionDiv = reduced ? "div" : motion.div;

  return (
    <section id="home" className="hero section">
      <div className="container hero__grid">
        <MotionDiv
          className="hero__copy"
          variants={reduced ? undefined : containerVariants}
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "show"}
        >
          <motion.div variants={reduced ? undefined : itemVariants} className="eyebrow">
            {profile.openToWork ? "Open to new opportunities" : "Building with Java & Spring Boot"}
          </motion.div>

          <motion.h1 variants={reduced ? undefined : itemVariants} className="hero__headline">
            {profile.headline}
          </motion.h1>

          <motion.p variants={reduced ? undefined : itemVariants} className="hero__sub">
            I'm <strong>{profile.name}</strong> — {profile.positioning}
          </motion.p>

          <motion.div variants={reduced ? undefined : itemVariants} className="hero__cta">
            <Button
              as="a"
              href="#projects"
              variant="primary"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Work →
            </Button>
            <Button
              as="a"
              href="#contact"
              variant="secondary"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Start a Conversation
            </Button>
          </motion.div>

          <motion.div variants={reduced ? undefined : itemVariants} className="hero__meta">
            {profile.roles.map((role) => (
              <span key={role} className="hero__meta-item">
                {role}
              </span>
            ))}
          </motion.div>
        </MotionDiv>

        <motion.div
          className="hero__visual-wrap"
          initial={reduced ? undefined : { opacity: 0, scale: 0.94 }}
          animate={reduced ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <ArchitectureVisual />
        </motion.div>
      </div>
    </section>
  );
}
