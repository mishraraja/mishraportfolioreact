import { useState } from "react";
import { Btn, Panel, Say } from "./kit";
import { sfx } from "../../lib/sound";
import "./ThreadStatesLab.css";

const NODES = {
  NEW: { x: 92, y: 52 },
  RUNNABLE: { x: 312, y: 150 },
  TERMINATED: { x: 92, y: 248 },
  BLOCKED: { x: 540, y: 52 },
  WAITING: { x: 540, y: 150 },
  TIMED_WAITING: { x: 540, y: 248 },
};
const ALL = Object.keys(NODES);
const HALF = { w: 78, h: 19 };

const EDGES = [
  ["NEW", "RUNNABLE"],
  ["RUNNABLE", "TERMINATED"],
  ["RUNNABLE", "BLOCKED"],
  ["BLOCKED", "RUNNABLE"],
  ["RUNNABLE", "WAITING"],
  ["WAITING", "RUNNABLE"],
  ["WAITING", "BLOCKED"],
  ["RUNNABLE", "TIMED_WAITING"],
  ["TIMED_WAITING", "RUNNABLE"],
];

const ACTIONS = [
  { id: "start", code: "t.start()" },
  { id: "sync", code: "enter synchronized (monitor busy)" },
  { id: "release", code: "the monitor comes free" },
  { id: "sleep", code: "Thread.sleep(500)" },
  { id: "timeup", code: "500 ms pass" },
  { id: "wait", code: "lock.wait()" },
  { id: "notify", code: "another thread calls lock.notify()" },
  { id: "join", code: "other.join()" },
  { id: "otherEnds", code: "the other thread finishes" },
  { id: "finish", code: "run() returns" },
];

const INTRO = "This is `new Thread(task)`. Nothing runs yet — it's **NEW**. Push it through every state. Getting something wrong is allowed; the error teaches you something too.";

function transition(state, reason, action) {
  if (action === "start") {
    return state === "NEW"
      ? { to: "RUNNABLE", text: "`start()` hands the thread to the scheduler. **RUNNABLE** means running or ready to run — Java doesn't tell the two apart." }
      : { error: "**IllegalThreadStateException** — a thread can only be started once. Create a new Thread instead.", event: "double-start" };
  }
  if (state === "TERMINATED") return { error: "It's **TERMINATED**. Nothing brings a thread back — you'd create a new one." };
  if (state === "NEW") return { error: "It's still **NEW**. Nothing happens until you call `start()`." };

  const needsRunnable = { error: "Only a **RUNNABLE** thread can do that — right now it's " + state + "." };

  switch (action) {
    case "sync":
      return state === "RUNNABLE"
        ? { to: "BLOCKED", reason: "monitor", text: "It reached a `synchronized` block whose monitor another thread holds: **BLOCKED** until the monitor is free." }
        : needsRunnable;
    case "release":
      return state === "BLOCKED"
        ? { to: "RUNNABLE", text: "The monitor came free and this thread won it: back to **RUNNABLE**." }
        : { error: "Nothing is blocked on a monitor right now." };
    case "sleep":
      return state === "RUNNABLE"
        ? { to: "TIMED_WAITING", reason: "sleep", text: "`sleep(500)` parks it on a timer: **TIMED_WAITING**. It keeps every lock it holds while it sleeps." }
        : needsRunnable;
    case "timeup":
      return state === "TIMED_WAITING" ? { to: "RUNNABLE", text: "The timer fired: back to **RUNNABLE**." } : { error: "No timer is running." };
    case "wait":
      return state === "RUNNABLE"
        ? { to: "WAITING", reason: "notify", text: "`wait()` releases the monitor and waits with no timeout: **WAITING**, until another thread calls `notify()`." }
        : needsRunnable;
    case "notify":
      if (state === "WAITING" && reason === "notify") {
        return {
          to: "BLOCKED",
          reason: "monitor",
          event: "notify-blocked",
          text: "`notify()` wakes it, but it has to win the monitor back first — so it moves to **BLOCKED**, not straight to RUNNABLE.",
        };
      }
      if (state === "WAITING") return { error: "It's waiting inside `join()`, not on a monitor, so `notify()` doesn't wake it." };
      return { error: "Nobody is waiting on this monitor, so `notify()` does nothing." };
    case "join":
      return state === "RUNNABLE"
        ? { to: "WAITING", reason: "join", text: "`join()` waits, with no timeout, for the other thread to finish: **WAITING**." }
        : needsRunnable;
    case "otherEnds":
      return state === "WAITING" && reason === "join"
        ? { to: "RUNNABLE", text: "The thread it joined has finished, so this one carries on: **RUNNABLE**." }
        : { error: "Nothing is waiting for the other thread." };
    default:
      return state === "RUNNABLE"
        ? { to: "TERMINATED", text: "`run()` returned. The thread is **TERMINATED** and can never be started again." }
        : needsRunnable;
  }
}

function boundary(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const scale = Math.min(dx ? HALF.w / Math.abs(dx) : Infinity, dy ? HALF.h / Math.abs(dy) : Infinity);
  return { x: from.x + dx * scale, y: from.y + dy * scale };
}

/** A gentle curve, so the two directions of a round trip don't overlap. */
function edgePath(a, b) {
  const start = boundary(NODES[a], NODES[b]);
  const end = boundary(NODES[b], NODES[a]);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (start.x + end.x) / 2 - (dy / len) * 16;
  const cy = (start.y + end.y) / 2 + (dx / len) * 16;
  return "M" + start.x + "," + start.y + " Q" + cx + "," + cy + " " + end.x + "," + end.y;
}

function fresh() {
  return { state: "NEW", reason: null, visited: ["NEW"], lastEdge: null, log: [] };
}

export function ThreadStatesLab({ complete }) {
  const [sim, setSim] = useState(fresh);
  const [say, setSay] = useState({ text: INTRO });

  function handle(action) {
    const r = transition(sim.state, sim.reason, action.id);
    if (r.event) complete(r.event);

    if (r.error) {
      setSay({ text: r.error, tone: "bad" });
      sfx.error();
      return;
    }

    const visited = sim.visited.includes(r.to) ? sim.visited : [...sim.visited, r.to];
    setSim({
      state: r.to,
      reason: r.reason || null,
      visited,
      lastEdge: sim.state + ">" + r.to,
      log: [...sim.log, action.code + ": " + sim.state + " → " + r.to],
    });

    if (visited.length === ALL.length && sim.visited.length < ALL.length) {
      complete("all-states");
      setSay({ text: r.text + " That's all six states — the whole life of a thread.", tone: "good" });
      sfx.success();
      return;
    }
    setSay({ text: r.text, tone: r.event ? "good" : undefined });
    sfx.click();
  }

  function reset() {
    setSim(fresh());
    setSay({ text: INTRO });
    sfx.close();
  }

  return (
    <div className="lab tstate">
      <Panel title={"getState() → " + sim.state} className="tstate__diagram">
        <svg viewBox="0 0 640 300" className="tstate__svg" role="img" aria-label={"Thread state diagram. Current state: " + sim.state}>
          <defs>
            <marker id="ts-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" className="tstate__head" />
            </marker>
            <marker id="ts-arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" className="tstate__head is-on" />
            </marker>
          </defs>
          {EDGES.map(([a, b]) => {
            const on = sim.lastEdge === a + ">" + b;
            return <path key={a + b} d={edgePath(a, b)} className={"tstate__edge" + (on ? " is-on" : "")} markerEnd={on ? "url(#ts-arrow-on)" : "url(#ts-arrow)"} />;
          })}
          {ALL.map((s) => {
            const n = NODES[s];
            const cls = s === sim.state ? " is-current" : sim.visited.includes(s) ? " is-visited" : "";
            return (
              <g key={s} className={"tstate__node" + cls}>
                <rect x={n.x - HALF.w} y={n.y - HALF.h} width={HALF.w * 2} height={HALF.h * 2} rx="10" />
                <text x={n.x} y={n.y + 4}>
                  {s}
                </text>
              </g>
            );
          })}
        </svg>
      </Panel>

      <Say tone={say.tone}>{say.text}</Say>

      <div className="lab-grid">
        <Panel title="Do something to the thread">
          <div className="tstate__actions">
            {ACTIONS.map((a) => (
              <Btn key={a.id} onClick={() => handle(a)}>
                {a.code}
              </Btn>
            ))}
          </div>
          <Btn variant="ghost" onClick={reset}>
            ↺ new Thread(task)
          </Btn>
        </Panel>

        <Panel title={"States visited · " + sim.visited.length + " / " + ALL.length}>
          <div className="lab-row">
            {ALL.map((s) => {
              const seen = sim.visited.includes(s);
              return (
                <span key={s} className={"lab-chip" + (seen ? " is-good" : "")}>
                  {seen ? "✓ " : ""}
                  {s}
                </span>
              );
            })}
          </div>
          {sim.log.length ? (
            <ol className="lab-log">
              {sim.log.slice(-6).map((line, i) => (
                <li key={sim.log.length - 6 + i}>{line}</li>
              ))}
            </ol>
          ) : (
            <p className="lab-note">sleep() keeps its locks · wait() gives the monitor up · notify() leads back through BLOCKED.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
