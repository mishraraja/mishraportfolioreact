import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { profile } from "../data/profile";
import { Button } from "../components/ui/Button";
import { OrbitalSystem } from "../components/orbital/OrbitalSystem";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useScramble } from "../hooks/useScramble";
import { useMagnetic } from "../hooks/useMagnetic";
import { useExperience } from "../context/ExperienceContext";
import { TOTAL_ACHIEVEMENTS } from "../lib/achievements";
import { sfx } from "../lib/sound";
import "./Hero.css";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } },
};

/** Live clock in his timezone. The page always knows what time it is for him. */
function LiveStatus() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(now)
  );
  const awake = hour >= 9 && hour < 24;

  return (
    <div className="hero__status">
      <span className={"hero__status-dot " + (awake ? "is-awake" : "is-asleep")} aria-hidden="true" />
      <span className="hero__status-text">
        {time} IST
        <span className="hero__status-sep">/</span>
        {awake ? "probably at a keyboard" : "asleep, and the commit graph shows it"}
      </span>
    </div>
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const { unlock } = useExperience();
  const MotionDiv = reduced ? "div" : motion.div;

  const headline = useScramble(profile.headline, { speed: 1.1 });
  const primaryRef = useMagnetic(0.3, 70);
  const secondaryRef = useMagnetic(0.3, 70);

  useEffect(() => {
    function onScroll() {
      if (window.scrollY > window.innerHeight * 0.5) {
        unlock("first-contact");
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [unlock]);

  function jump(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    sfx.click();
  }

  return (
    <section id="home" className="hero section">
      <div className="container hero__grid">
        <MotionDiv
          className="hero__copy"
          variants={reduced ? undefined : containerVariants}
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "show"}
        >
          <motion.div variants={reduced ? undefined : itemVariants} className="hero__badge">
            <span className="hero__badge-pulse" aria-hidden="true" />
            {profile.openToWork ? "Open to new opportunities" : "Building with Java & Spring Boot"}
          </motion.div>

          {/* A hidden copy of the finished headline holds the exact height while
              the visible one decrypts, so nothing below it moves. */}
          <motion.h1
            variants={reduced ? undefined : itemVariants}
            className="hero__headline"
            aria-label={profile.headline}
          >
            <span className="hero__headline-ghost" aria-hidden="true">
              {profile.headline}
            </span>
            <span className="hero__headline-live" aria-hidden="true">
              {headline}
            </span>
          </motion.h1>

          <motion.p variants={reduced ? undefined : itemVariants} className="hero__sub">
            I&apos;m <strong>{profile.name}</strong>. {profile.positioning}
          </motion.p>

          <motion.div variants={reduced ? undefined : itemVariants} className="hero__cta">
            <span ref={primaryRef} className="hero__magnet">
              <Button
                as="a"
                href="#projects"
                variant="primary"
                onClick={(e) => {
                  e.preventDefault();
                  jump("projects");
                }}
              >
                Explore the work
              </Button>
            </span>
            <span ref={secondaryRef} className="hero__magnet">
              <Button
                as="a"
                href="#api"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  jump("api");
                }}
              >
                Call the API
              </Button>
            </span>
          </motion.div>

          <motion.div variants={reduced ? undefined : itemVariants}>
            <LiveStatus />
          </motion.div>

          <motion.dl variants={reduced ? undefined : itemVariants} className="hero__stats">
            <div>
              <dt>Years shipping</dt>
              <dd>{profile.yearsExperience}+</dd>
            </div>
            <div>
              <dt>Core stack</dt>
              <dd>Java</dd>
            </div>
            <div>
              <dt>Hidden here</dt>
              <dd>{TOTAL_ACHIEVEMENTS}</dd>
            </div>
          </motion.dl>

          <motion.p variants={reduced ? undefined : itemVariants} className="hero__hint">
            <kbd>`</kbd> opens a shell &middot; <kbd>&#8984;K</kbd> jumps anywhere &middot;{" "}
            <kbd>T</kbd> repaints the sky
          </motion.p>
        </MotionDiv>

        <motion.div
          className="hero__visual"
          initial={reduced ? undefined : { opacity: 0, scale: 0.92 }}
          animate={reduced ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <OrbitalSystem />
        </motion.div>
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span className="hero__scroll-line" />
        <span className="hero__scroll-text">scroll</span>
      </div>
    </section>
  );
}
