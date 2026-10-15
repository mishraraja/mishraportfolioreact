import { useState } from "react";
import { Btn, Panel, Say, Segmented } from "./kit";
import { sfx } from "../../lib/sound";
import "./CircuitBreakerLab.css";

const WINDOW = 5;
const MIN_CALLS = 4;
const THRESHOLD = 0.5;
const WAIT = 10;
const TRIALS = 2;

const INTRO =
  "Order service calls payment service through a circuit breaker: a sliding window of the last " + WINDOW + " calls, opening at a **50% failure rate** once it has seen " + MIN_CALLS + " calls. Start healthy, then take payments down.";

const NODES = {
  CLOSED: { x: 70, y: 52 },
  OPEN: { x: 290, y: 52 },
  HALF_OPEN: { x: 180, y: 168 },
};

const EDGES = [
  { from: "CLOSED", to: "OPEN", label: "failure rate ≥ 50%", lx: 180, ly: 26 },
  { from: "OPEN", to: "HALF_OPEN", label: "after " + WAIT + "s", lx: 272, ly: 124 },
  { from: "HALF_OPEN", to: "CLOSED", label: "trials pass", lx: 88, ly: 124 },
  { from: "HALF_OPEN", to: "OPEN", label: "a trial fails", lx: 226, ly: 96 },
];

function fresh() {
  return { state: "CLOSED", window: [], trials: [], clock: 0, openedAt: null, log: [], nextCall: 1 };
}

function percent(results) {
  if (!results.length) return 0;
  return results.filter((ok) => !ok).length / results.length;
}

/** One call through the breaker. Pure: returns the new state, a message and what happened. */
function callOnce(sim, healthy) {
  let { state, window, trials, openedAt } = sim;
  const n = sim.nextCall;
  const events = [];
  let outcome;
  let text;
  let tone;

  if (state === "OPEN") {
    outcome = "short";
    text = "Call #" + n + " never left the building: the breaker is **OPEN**, so it failed fast with the fallback. " + (WAIT - (sim.clock - openedAt)) + "s until it half-opens.";
    tone = "bad";
    events.push("short-circuit");
  } else if (state === "CLOSED") {
    outcome = healthy ? "ok" : "fail";
    window = [...window, healthy].slice(-WINDOW);
    const rate = percent(window);
    if (window.length >= MIN_CALLS && rate >= THRESHOLD) {
      text =
        "Call #" + n + (healthy ? " succeeded" : " failed") + ". The failure rate is " + Math.round(rate * 100) + "% over the last " + window.length +
        " calls, so the breaker **trips OPEN**. For the next " + WAIT + "s every call fails fast — payments gets room to recover.";
      tone = "bad";
      state = "OPEN";
      openedAt = sim.clock;
      window = [];
      events.push("tripped");
    } else {
      text =
        (healthy ? "Call #" + n + " succeeded." : "Call #" + n + " failed after a timeout, and the customer got the fallback.") +
        " Failure rate: " + Math.round(rate * 100) + "% of " + window.length + " call" + (window.length === 1 ? "" : "s") +
        (window.length < MIN_CALLS ? " — too few calls to judge yet." : ".");
    }
  } else {
    outcome = healthy ? "ok" : "fail";
    trials = [...trials, healthy];
    if (trials.length < TRIALS) {
      text = "HALF_OPEN lets " + TRIALS + " trial calls through. Trial " + trials.length + (healthy ? " succeeded." : " failed.");
    } else if (trials.every(Boolean)) {
      text = "Both trial calls succeeded, so the breaker **closes** again. Normal service resumes.";
      tone = "good";
      state = "CLOSED";
      window = [];
      trials = [];
      events.push("recovered");
    } else {
      text = "A trial call failed, so the breaker goes straight back to **OPEN** for another " + WAIT + "s.";
      tone = "bad";
      state = "OPEN";
      openedAt = sim.clock;
      trials = [];
    }
  }

  return {
    sim: { ...sim, state, window, trials, openedAt, nextCall: n + 1, log: [...sim.log, { n, outcome }].slice(-12) },
    text,
    tone,
    events,
  };
}

export function CircuitBreakerLab({ complete }) {
  const [healthy, setHealthy] = useState(true);
  const [sim, setSim] = useState(fresh);
  const [say, setSay] = useState({ text: INTRO });

  function apply(result) {
    result.events.forEach((e) => complete(e));
    setSay({ text: result.text, tone: result.tone });
    if (result.tone === "good") sfx.success();
    else if (result.tone === "bad") sfx.error();
    else sfx.click();
  }

  function send(times) {
    let current = sim;
    let result = null;
    const events = [];
    for (let i = 0; i < times; i += 1) {
      result = callOnce(current, healthy);
      current = result.sim;
      events.push(...result.events);
    }
    setSim(current);
    apply({ ...result, events });
  }

  function wait() {
    const clock = sim.clock + 5;
    if (sim.state === "OPEN" && clock - sim.openedAt >= WAIT) {
      setSim({ ...sim, clock, state: "HALF_OPEN", trials: [] });
      setSay({ text: WAIT + "s have passed, so the breaker moves to **HALF_OPEN**: the next " + TRIALS + " calls are trials that decide what happens next." });
    } else {
      setSim({ ...sim, clock });
      setSay({
        text: sim.state === "OPEN" ? "5 seconds pass. Still OPEN — " + (WAIT - (clock - sim.openedAt)) + "s to go." : "5 seconds pass. Time only matters while the breaker is OPEN.",
      });
    }
    sfx.click();
  }

  function reset() {
    setSim(fresh());
    setHealthy(true);
    setSay({ text: INTRO });
    sfx.close();
  }

  const rate = percent(sim.window);
  const center = (key) => NODES[key];

  return (
    <div className="lab cbreak">
      <div className="lab-row">
        <span className="lab-label">payment service</span>
        <Segmented
          label="Payment service health"
          options={[
            { id: "up", label: "✅ healthy" },
            { id: "down", label: "🔥 down" },
          ]}
          value={healthy ? "up" : "down"}
          onChange={(v) => setHealthy(v === "up")}
        />
      </div>

      <div className="lab-row">
        <Btn variant="primary" onClick={() => send(1)}>
          paymentClient.charge(order)
        </Btn>
        <Btn onClick={() => send(5)}>send 5 calls</Btn>
        <Btn onClick={wait}>⏱ wait 5s</Btn>
        <Btn variant="ghost" onClick={reset}>
          ↺ Reset
        </Btn>
      </div>

      <Say tone={say.tone}>{say.text}</Say>

      <div className="lab-grid">
        <Panel title={"Breaker state · t = " + sim.clock + "s"}>
          <svg className="cbreak__svg" viewBox="0 0 360 210" role="img" aria-label={"Circuit breaker state: " + sim.state}>
            <defs>
              <marker id="cb-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" className="cbreak__head" />
              </marker>
            </defs>
            {EDGES.map((e) => {
              const a = center(e.from);
              const b = center(e.to);
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const len = Math.hypot(dx, dy);
              return (
                <g key={e.from + e.to}>
                  <line
                    x1={a.x + (dx / len) * 50}
                    y1={a.y + (dy / len) * 26}
                    x2={b.x - (dx / len) * 54}
                    y2={b.y - (dy / len) * 28}
                    className="cbreak__edge"
                    markerEnd="url(#cb-arrow)"
                  />
                  <text x={e.lx} y={e.ly} className="cbreak__edge-label">
                    {e.label}
                  </text>
                </g>
              );
            })}
            {Object.entries(NODES).map(([key, n]) => (
              <g key={key} className={"cbreak__node cbreak__node--" + key + (sim.state === key ? " is-on" : "")}>
                <rect x={n.x - 52} y={n.y - 20} width="104" height="40" rx="20" />
                <text x={n.x} y={n.y + 5}>
                  {key}
                </text>
              </g>
            ))}
          </svg>
        </Panel>

        <Panel title="Sliding window · last 5 calls">
          <div className="cbreak__window">
            {Array.from({ length: WINDOW }, (_, i) => {
              const r = sim.window[i];
              return (
                <span key={i} className={"cbreak__slot" + (r === true ? " is-ok" : r === false ? " is-fail" : "")}>
                  {r === true ? "✓" : r === false ? "✗" : ""}
                </span>
              );
            })}
          </div>
          <div className="cbreak__rate">
            <span className="lab-label">failure rate {Math.round(rate * 100)}%</span>
            <span className="cbreak__bar" aria-hidden="true">
              <span className="cbreak__fill" style={{ width: rate * 100 + "%" }} />
              <span className="cbreak__limit" />
            </span>
          </div>
          {sim.state === "HALF_OPEN" ? <p className="lab-note">Trial calls so far: {sim.trials.map((ok) => (ok ? "✓" : "✗")).join(" ") || "none"}</p> : null}
          <span className="lab-label">calls</span>
          <div className="cbreak__log">
            {sim.log.length ? (
              sim.log.map((c) => (
                <span key={c.n} className={"lab-chip" + (c.outcome === "ok" ? " is-good" : c.outcome === "fail" ? " is-bad" : " is-warn")}>
                  #{c.n} {c.outcome === "ok" ? "✓" : c.outcome === "fail" ? "✗ fallback" : "⚡ short-circuit"}
                </span>
              ))
            ) : (
              <span className="lab-note">no calls yet</span>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
