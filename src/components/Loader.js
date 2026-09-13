import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { profile } from "../data/profile";
import { useReducedMotion } from "../hooks/useReducedMotion";
import "./Loader.css";

/**
 * A Spring Boot startup log, because that is what this developer actually
 * stares at all day. It is the site's first joke and its first honest signal
 * about who built it.
 */
const LOG = [
  { t: 0, text: "Starting PortfolioApplication v2.0.0 using Java 21", level: "info" },
  { t: 180, text: "No active profile set, falling back to default: [production]", level: "warn" },
  { t: 340, text: "Bootstrapping Spring Data JPA repositories in DEFAULT mode", level: "info" },
  { t: 520, text: "Finished Spring Data repository scanning in 42 ms. Found 6 interfaces", level: "info" },
  { t: 690, text: "Tomcat initialized with port(s): 8080 (http)", level: "info" },
  { t: 860, text: "HikariPool-1 - Start completed", level: "info" },
  { t: 1020, text: "Kafka consumer group [portfolio-events] subscribed", level: "info" },
  { t: 1180, text: "Initialized JPA EntityManagerFactory for persistence unit 'default'", level: "info" },
  { t: 1340, text: "Started PortfolioApplication in 1.41 seconds (process running for 1.6)", level: "ok" },
];

const TOTAL = 1600;

export function Loader({ visible }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible || reduced) return undefined;

    const timers = LOG.map((line, i) =>
      setTimeout(() => setShown(i + 1), line.t)
    );

    let raf;
    const start = performance.now();
    function tick(now) {
      const pct = Math.min(((now - start) / TOTAL) * 100, 100);
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    };
  }, [visible, reduced]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="loader__inner">
            <motion.span
              className="loader__mark"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {profile.initials}
            </motion.span>

            {reduced ? (
              <p className="loader__reduced">Loading…</p>
            ) : (
              <div className="loader__log" aria-hidden="true">
                {LOG.slice(0, shown).map((line) => (
                  <motion.p
                    key={line.text}
                    className={"loader__line loader__line--" + line.level}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <span className="loader__stamp">
                      {line.level === "ok" ? "OK " : line.level === "warn" ? "WARN" : "INFO"}
                    </span>
                    {line.text}
                  </motion.p>
                ))}
              </div>
            )}

            <div className="loader__bar" aria-hidden="true">
              <span className="loader__bar-fill" style={{ width: progress + "%" }} />
            </div>
          </div>

          <p className="sr-only" role="status">
            Loading portfolio
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
