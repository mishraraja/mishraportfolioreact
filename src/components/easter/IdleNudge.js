import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIdle } from "../../hooks/useIdle";
import { useExperience } from "../../context/ExperienceContext";
import "./IdleNudge.css";

const MESSAGES = [
  "Still there? The terminal is behind the backtick key.",
  "While you think it over: this page has a REST API you can call.",
  "Idle hands. Try the Konami code.",
  "Press T. The whole site changes colour.",
  "There are twelve secrets here. Most people find two.",
];

/**
 * After a stretch of no input, the site leans over and whispers a hint.
 * It appears once per idle period and never blocks anything.
 */
export function IdleNudge() {
  const idle = useIdle(50000);
  const { unlock, setTerminalOpen } = useExperience();
  const [message, setMessage] = useState(MESSAGES[0]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (idle) {
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
      setDismissed(false);
      unlock("persistent");
    }
  }, [idle, unlock]);

  const show = idle && !dismissed;

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="nudge"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          role="status"
        >
          <span className="nudge__pulse" aria-hidden="true" />
          <p className="nudge__text">{message}</p>
          <div className="nudge__actions">
            <button
              type="button"
              className="nudge__btn"
              onClick={() => {
                setTerminalOpen(true);
                setDismissed(true);
              }}
            >
              Open shell
            </button>
            <button
              type="button"
              className="nudge__dismiss"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss hint"
            >
              &times;
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
