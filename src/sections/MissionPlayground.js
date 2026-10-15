import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { sfx } from "../lib/sound";

const STEPS = ["API", "Service", "Database", "Response"];
const NOTES = ["The API validates the request and passes it to the service.", "The service applies the business rules and asks for the project.", "The database returns the matching record.", "200 OK. A small request, a complete round trip."];
const QUESTIONS = [
  { title: "Same words. Same object?", code: 'String a = "hello";\nString b = new String("hello");\nSystem.out.println(a.equals(b));', options: ["true", "false", "Compilation error"], answer: 0, why: "equals() compares the characters. The objects have equal text, even though a == b would be false.", to: "/java/lab/string-pool", link: "Explore the String Pool lab" },
  { title: "One increment. How many steps?", code: "// Two threads share this field:\ncount++;", options: ["Always atomic", "Read, add, then write", "Automatically synchronized"], answer: 1, why: "count++ is a read-modify-write operation. Threads can interleave and lose an update without synchronization or an atomic operation.", to: "/java/lab/race", link: "Try the Lost Update lab" },
  { title: "Find the missing partner.", code: "nums = [2, 7, 11, 15]\ntarget = 9\n// Which pair of indices adds to target?", options: ["[1, 2]", "[0, 3]", "[0, 1]"], answer: 2, why: "nums[0] + nums[1] is 2 + 7 = 9. A hash map can find each number's missing partner in a single pass.", to: "/dsa/two-sum", link: "Play the Two Sum animation" },
];

function RequestJourney() {
  const [step, setStep] = useState(-1);
  const [active, setActive] = useState(true);
  const [visible, setVisible] = useState(!document.hidden);
  const card = useRef(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    observer?.observe(card.current);
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { observer?.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);
  useEffect(() => {
    if (step < 0 || step >= 3 || !active || !visible || reduced) return undefined;
    const timer = setTimeout(() => setStep((n) => n + 1), 950);
    return () => clearTimeout(timer);
  }, [step, active, visible, reduced]);
  return (
    <article ref={card} className="mission-card" aria-labelledby="request-title">
      <div className="mission-card__top"><span className="mission-label">01 / FOLLOW THE REQUEST</span><span className="mission-pill">Interactive demo</span></div>
      <h3 id="request-title">One request. Four stops.</h3>
      <p className="mission-muted">A tiny model of the backend systems I build. Follow the data from arrival to answer.</p>
      <code className="mission-endpoint"><span>GET</span> /demo/projects/01</code>
      <ol className="mission-pipeline" aria-label="Request stages">
        {STEPS.map((name, i) => <li key={name} className={i === step ? "is-current" : i < step ? "is-done" : ""} aria-current={i === step ? "step" : undefined}><span aria-hidden="true">{i < step ? "✓" : String(i + 1).padStart(2, "0")}</span>{name}</li>)}
      </ol>
      <p className="mission-narration" role="status">{step < 0 ? "Ready when you are. No server, no waiting room." : NOTES[step]}</p>
      <div className="mission-response"><span className="mission-label">RESPONSE PREVIEW</span><pre>{step === 3 ? '{\n  "status": 200,\n  "project": "Higher Education Portal"\n}' : '{\n  "status": "awaiting response"\n}'}</pre></div>
      <div className="mission-actions">
        <button className="mission-button" disabled={step >= 0 && step < 3} onClick={() => { sfx.request(); setStep(0); }}>{step === 3 ? "Send another request ↗" : step >= 0 ? "Request in flight…" : "Send a request ↗"}</button>
        {step >= 0 && step < 3 && <button className="mission-button mission-button--quiet" onClick={() => setStep((n) => n + 1)}>Next stage →</button>}
      </div>
      <p className="mission-footnote">Browser simulation · illustrative response · no network request</p>
    </article>
  );
}

function QuickChallenge() {
  const [index, setIndex] = useState(() => new Date().getDate() % QUESTIONS.length);
  const [answer, setAnswer] = useState(null);
  const question = QUESTIONS[index];
  const correct = answer === question.answer;
  return (
    <article className="mission-card" aria-labelledby="challenge-title">
      <div className="mission-card__top"><span className="mission-label">02 / THE 30-SECOND CHALLENGE</span><span className="mission-pill">Take your time</span></div>
      <h3 id="challenge-title">{question.title}</h3>
      <p className="mission-muted">A little curiosity goes a long way. Pick an answer to see what happens.</p>
      <pre className="mission-snippet"><code>{question.code}</code></pre>
      <div className="mission-answers" role="group" aria-label="Challenge answers">
        {question.options.map((option, i) => <button key={option} className={`mission-answer ${answer !== null && i === question.answer ? "is-correct" : ""}`} disabled={answer !== null} onClick={() => { setAnswer(i); if (i === question.answer) sfx.success(); else sfx.click(); }}><span aria-hidden="true">{String.fromCharCode(65 + i)}</span>{option}{answer !== null && i === question.answer ? " ✓" : answer === i ? " — your pick" : ""}</button>)}
      </div>
      <div className={`mission-feedback ${correct ? "is-success" : ""}`} role="status">
        {answer === null ? "No scoreboards. No pressure. Just one good idea." : <><strong>{correct ? "✦ Nice work, explorer. Mission complete!" : "Plot twist! Here's the idea."}</strong><p>{question.why}</p></>}
      </div>
      <div className="mission-actions">
        <button className="mission-button mission-button--quiet" onClick={() => { setIndex((n) => (n + 1) % QUESTIONS.length); setAnswer(null); }}>Next challenge →</button>
        <Link className="mission-text-link" to={question.to}>{question.link} ↗</Link>
      </div>
    </article>
  );
}

export default function MissionPlayground() {
  return <div className="mission-grid"><RequestJourney /><QuickChallenge /></div>;
}
