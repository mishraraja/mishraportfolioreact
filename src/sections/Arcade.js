import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SectionHeading } from "../components/ui/SectionHeading";
import { Button } from "../components/ui/Button";
import { Reveal } from "../components/ui/Reveal";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { sfx } from "../lib/sound";
import "./Arcade.css";

/* A hand-written four-frame taste of the arcade. It deliberately imports
   nothing from the arcade itself, so the home page stays light. */
const NUMS = [2, 7, 11, 15];
const FRAMES = [
  { i: 0, seen: [], say: "2 walks in. Its partner would be 9 − 2 = 7. Not here yet." },
  { i: 0, seen: [[2, 0]], say: "Write 2 → 0 on the guest list and move on." },
  { i: 1, seen: [[2, 0]], say: "7 walks in. It needs 9 − 7 = 2…" },
  { i: 1, seen: [[2, 0]], say: "2 is on the list! Pair found: [0, 1].", found: true },
];

const FEATURES = [
  ["🎮", "Every problem animated", "Step through the algorithm frame by frame — forwards, backwards, on your own inputs."],
  ["🎯", "Predict mode", "The animation pauses before each key decision and asks what happens next."],
  ["🧠", "Patterns, not answers", "24 patterns with the signals that give them away, and a quick-fire game to drill them."],
  ["🗺️", "A plan that sticks", "An 8-week roadmap with spaced reviews, XP and streaks. No sign-up, ever."],
];

export function ArcadeTeaser() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(reduced ? FRAMES.length - 1 : 0);

  useEffect(() => {
    if (reduced) return undefined;
    const timer = setInterval(() => setStep((s) => (s + 1) % FRAMES.length), 2000);
    return () => clearInterval(timer);
  }, [reduced]);

  const frame = FRAMES[step];

  return (
    <section id="arcade" className="arcade-teaser section">
      <div className="container">
        <SectionHeading
          index="04"
          eyebrow="Free for everyone"
          title="Practise DSA like it's a game."
          description="The 75 problems product companies keep asking in interviews, each one a playable animation with a story that makes it stick, working Java and Python, and a check that tells you when you've really got it."
        />

        <div className="arcade-teaser__grid">
          <Reveal className="arcade-teaser__demo">
            <div className="teaser-demo" aria-hidden="true">
              <div className="teaser-demo__bar">
                <span>💃 Two Sum</span>
                <span className="teaser-demo__target">target = 9</span>
              </div>
              <div className="teaser-demo__cells">
                {NUMS.map((n, idx) => (
                  <span
                    key={n}
                    className={
                      "teaser-demo__cell" +
                      (idx === frame.i ? " is-active" : "") +
                      (frame.found && idx <= 1 ? " is-found" : "")
                    }
                  >
                    {n}
                  </span>
                ))}
              </div>
              <div className="teaser-demo__map">
                <span className="teaser-demo__label">seen</span>
                <AnimatePresence>
                  {frame.seen.map(([k, v]) => (
                    <motion.span
                      key={k}
                      className={"teaser-demo__chip" + (frame.found ? " is-found" : "")}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                    >
                      {k} → {v}
                    </motion.span>
                  ))}
                </AnimatePresence>
                {frame.seen.length ? null : <span className="teaser-demo__empty">empty</span>}
              </div>
              <motion.p
                key={step}
                className="teaser-demo__say"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span>🧑‍🚀</span> {frame.say}
              </motion.p>
              <div className="teaser-demo__dots">
                {FRAMES.map((_, i) => (
                  <span key={i} className={i === step ? "is-on" : ""} />
                ))}
              </div>
            </div>
          </Reveal>

          <div className="arcade-teaser__copy">
            <ul className="arcade-teaser__features">
              {FEATURES.map(([icon, title, text]) => (
                <li key={title}>
                  <span className="arcade-teaser__icon" aria-hidden="true">
                    {icon}
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="arcade-teaser__cta">
              <Button as={Link} to="/dsa" variant="primary" onClick={sfx.click}>
                Enter the arcade
              </Button>
              <Button as={Link} to="/dsa/radar" variant="secondary" onClick={sfx.click}>
                Play Pattern Radar
              </Button>
            </div>

            <dl className="arcade-teaser__stats">
              <div>
                <dt>Problems</dt>
                <dd>75</dd>
              </div>
              <div>
                <dt>Patterns</dt>
                <dd>24</dd>
              </div>
              <div>
                <dt>Sign-ups</dt>
                <dd>0</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
