import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "../../data/profile";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./RequestFlow.css";

const STEPS = [
  { label: "API", title: "A request arrives.", detail: "The controller checks the route and validates the request.", code: "GET /api/v1/profile\nAccept: application/json" },
  { label: "Service", title: "Give the request a purpose.", detail: "The service coordinates the work and keeps business rules in one place.", code: "profileService.findPublicProfile()\n→ apply public-field rules" },
  { label: "Data", title: "Find only what is needed.", detail: "Fetch the profile and map the data into a predictable response.", code: "profileRepository.findByHandle(\"rajamishra\")\n→ map to ProfileResponse" },
  { label: "Response", title: "A useful answer, delivered.", detail: "Return structured data that the interface can use.", code: JSON.stringify({ name: profile.name, role: profile.roles[0] }, null, 2) },
];

/** A finite, visitor-triggered demo. No background playback or network calls. */
export function RequestFlow() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing || reduced) return undefined;
    const timer = setTimeout(() => {
      if (step === STEPS.length - 1) setPlaying(false);
      else setStep((value) => value + 1);
    }, 1050);
    return () => clearTimeout(timer);
  }, [playing, step, reduced]);

  function run() {
    if (reduced) { setPlaying(false); setStep((value) => (value + 1) % STEPS.length); }
    else { setStep(0); setPlaying(true); }
  }

  return (
    <div className="request-flow">
      <div className="request-flow__meta"><span>GET /api/v1/profile</span><span>IN-BROWSER SIMULATION</span></div>
      <div className="request-flow__track">
        <svg viewBox="0 0 440 70" preserveAspectRatio="none" aria-hidden="true">
          <path d="M55 35H385" stroke="var(--color-border-strong)" strokeWidth="2" />
          <motion.path d="M55 35H385" stroke="var(--color-accent)" strokeWidth="2" initial={false}
            animate={{ pathLength: step / 3 }} transition={{ duration: reduced ? 0 : .55 }} />
        </svg>
        <div className="request-flow__steps" role="group" aria-label="Request stages">
          {STEPS.map((item, index) => (
            <button type="button" key={item.label} aria-pressed={step === index}
              onClick={() => { setPlaying(false); setStep(index); }}>
              <span className="request-flow__node">
                {step === index && <motion.span className="request-flow__active" layoutId={reduced ? undefined : "request-node"} transition={{ type: "spring", stiffness: 350, damping: 30 }} />}
                <b>{index < step ? "✓" : String(index + 1).padStart(2, "0")}</b>
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="request-flow__readout">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? { opacity: 1 } : { opacity: 0, y: -6 }} transition={{ duration: reduced ? 0 : .16 }}>
            <span className="request-flow__stage">STEP {String(step + 1).padStart(2, "0")} / 04</span>
            <h3>{STEPS[step].title}</h3><p>{STEPS[step].detail}</p>
            <pre><code>{STEPS[step].code}</code></pre>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="request-flow__actions">
        <motion.button type="button" onClick={run} disabled={playing && !reduced} whileTap={reduced ? undefined : { scale: .97 }}>
          {reduced ? "Next step" : playing ? "Tracing request…" : step === 3 ? "Replay request" : "Trace a request"}<span aria-hidden="true">↗</span>
        </motion.button>
        <span role="status">{playing ? "Following the request" : step === 3 ? "200 OK · simulation complete" : "Click any stage to explore"}</span>
      </div>
    </div>
  );
}
