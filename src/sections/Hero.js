import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { profile } from "../data/profile";
import { Button } from "../components/ui/Button";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useScramble } from "../hooks/useScramble";
import { useMagnetic } from "../hooks/useMagnetic";
import { useExperience } from "../context/ExperienceContext";
import { sfx } from "../lib/sound";
import "./Hero.css";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

/** The layers a request actually passes through in his day job. */
const PIPELINE = [
  { id: "client", label: "Client", detail: "React / Angular" },
  { id: "gateway", label: "API Gateway", detail: "Spring Cloud" },
  { id: "service", label: "Service", detail: "Spring Boot" },
  { id: "kafka", label: "Event Bus", detail: "Apache Kafka" },
  { id: "db", label: "Database", detail: "PostgreSQL" },
];

/**
 * Click anywhere on the stack and watch a request travel down it and a
 * response come back. The whole point of the hero: this is what he builds.
 */
function RequestPipeline() {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [phase, setPhase] = useState("idle");
  const [latency, setLatency] = useState(null);
  const [count, setCount] = useState(0);
  const timers = useRef([]);
  const reduced = useReducedMotion();

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const fire = useCallback(() => {
    if (phase === "running") return;
    clearTimers();
    setPhase("running");
    setLatency(null);
    sfx.request();

    const step = reduced ? 40 : 190;

    PIPELINE.forEach((_, i) => {
      timers.current.push(setTimeout(() => setActiveIndex(i), i * step));
    });

    timers.current.push(
      setTimeout(() => {
        setActiveIndex(-1);
        setPhase("done");
        setLatency(28 + Math.round(Math.random() * 90));
        setCount((c) => c + 1);
        sfx.success();
      }, PIPELINE.length * step + 260)
    );

    timers.current.push(
      setTimeout(() => setPhase("idle"), PIPELINE.length * step + 2600)
    );
  }, [phase, reduced, clearTimers]);

  // Fire once on mount so the visual is alive before anyone touches it.
  useEffect(() => {
    const t = setTimeout(fire, 1400);
    return () => {
      clearTimeout(t);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pipeline">
      <div className="pipeline__head">
        <span className="pipeline__title">request flow</span>
        <span className={"pipeline__badge pipeline__badge--" + phase}>
          {phase === "running" ? "in flight" : phase === "done" ? latency + " ms" : "idle"}
        </span>
      </div>

      <button
        type="button"
        className="pipeline__stack"
        onClick={fire}
        onPointerEnter={sfx.hover}
        aria-label="Send a request through the stack"
      >
        {PIPELINE.map((layer, i) => (
          <span
            key={layer.id}
            className={
              "pipeline__row " +
              (activeIndex === i ? "pipeline__row--on " : "") +
              (phase === "done" ? "pipeline__row--done" : "")
            }
            style={{ "--i": i }}
          >
            <span className="pipeline__dot" aria-hidden="true" />
            <span className="pipeline__label">{layer.label}</span>
            <span className="pipeline__detail">{layer.detail}</span>
            <span className="pipeline__track" aria-hidden="true">
              <span className="pipeline__pulse" />
            </span>
          </span>
        ))}
      </button>

      <div className="pipeline__foot">
        <span>
          {count === 0 ? "click the stack" : count + (count === 1 ? " request" : " requests")}
        </span>
        <span className="pipeline__ok">
          <span className="pipeline__ok-dot" aria-hidden="true" />
          200 OK
        </span>
      </div>
    </div>
  );
}

/** Live clock in his timezone, so the page always knows what time it is for him. */
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
        <span className="hero__status-sep">·</span>
        {awake ? "probably at a keyboard" : "asleep, and it shows in the commit graph"}
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

  // "First Contact" fires once the visitor scrolls past the fold.
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
          <motion.div variants={reduced ? undefined : itemVariants} className="eyebrow">
            {profile.openToWork ? "Open to new opportunities" : "Building with Java & Spring Boot"}
          </motion.div>

          {/* The scramble changes the string length every frame, so a hidden
              copy of the final headline holds the exact height and nothing
              below it moves. The h1 carries the real text for screen readers. */}
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
            I&apos;m <strong>{profile.name}</strong> — {profile.positioning}
          </motion.p>

          <motion.div variants={reduced ? undefined : itemVariants} className="hero__cta">
            <span ref={primaryRef} className="hero__magnet">
              <Button as="a" href="#projects" variant="primary" onClick={(e) => { e.preventDefault(); jump("projects"); }}>
                View Work →
              </Button>
            </span>
            <span ref={secondaryRef} className="hero__magnet">
              <Button as="a" href="#api" variant="secondary" onClick={(e) => { e.preventDefault(); jump("api"); }}>
                Call the API
              </Button>
            </span>
          </motion.div>

          <motion.div variants={reduced ? undefined : itemVariants}>
            <LiveStatus />
          </motion.div>

          <motion.div variants={reduced ? undefined : itemVariants} className="hero__meta">
            {profile.roles.map((role) => (
              <span key={role} className="hero__meta-item">
                {role}
              </span>
            ))}
          </motion.div>

          <motion.p variants={reduced ? undefined : itemVariants} className="hero__hint">
            Press <kbd>`</kbd> for a shell, <kbd>⌘K</kbd> to jump anywhere, <kbd>T</kbd> to repaint
            the site. There are {12} things hidden here.
          </motion.p>
        </MotionDiv>

        <motion.div
          className="hero__visual-wrap"
          initial={reduced ? undefined : { opacity: 0, scale: 0.94 }}
          animate={reduced ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <RequestPipeline />
        </motion.div>
      </div>
    </section>
  );
}
