import { useState } from "react";
import { Btn, Panel, Say, Segmented } from "./kit";
import { sfx } from "../../lib/sound";
import "./DeadlockLab.css";

const TIMEOUT = 2;
const THREADS = ["T1", "T2"];

const MODES = [
  { id: "naive", label: "Naive" },
  { id: "ordered", label: "Lock ordering" },
  { id: "trylock", label: "tryLock(timeout)" },
];

const HINT = {
  naive:
    "T1 moves money from account A to B, so it locks A, then B. T2 moves money from B to A, so it locks B, then A. Step **T1 once, then T2 once** and see what happens…",
  ordered: "The fix: every thread locks accounts in one global order — A before B — whichever way the money moves. Try the same moves again.",
  trylock:
    "Another fix: `tryLock` with a timeout. A thread that can't get its second lock gives up the first and retries. Recreate the deadlock pattern, then keep stepping.",
};

const COFFMAN = [
  { name: "Mutual exclusion", text: "Only one thread can hold an account's lock.", broken: null },
  { name: "Hold and wait", text: "Each thread holds one lock while it waits for the other.", broken: "trylock" },
  { name: "No preemption", text: "Nobody can take a lock away from the thread holding it.", broken: "trylock" },
  { name: "Circular wait", text: "T1 waits on T2, and T2 waits on T1.", broken: "ordered" },
];

// Wait-for graph layout, in SVG units.
const NODES = { T1: { x: 62, y: 100 }, T2: { x: 258, y: 100 }, A: { x: 160, y: 30 }, B: { x: 160, y: 170 } };

function programFor(mode, name) {
  const first = name === "T1" || mode === "ordered" ? "A" : "B";
  const second = first === "A" ? "B" : "A";
  const verb = mode === "trylock" ? "tryLock" : "lock";
  return [
    { op: "lock", lock: first, code: verb + "(account" + first + ")" },
    { op: "lock", lock: second, code: verb + "(account" + second + ")" },
    { op: "work", code: "transfer ₹500" },
    { op: "unlock", lock: second, code: "unlock(account" + second + ")" },
    { op: "unlock", lock: first, code: "unlock(account" + first + ")" },
  ];
}

function freshThread() {
  return { pc: 0, held: [], status: "ready", waitingFor: null, waited: 0 };
}

function freshSim() {
  return { locks: { A: null, B: null }, threads: { T1: freshThread(), T2: freshThread() }, backoffs: 0, log: [] };
}

function advance(sim, name, mode) {
  const program = programFor(mode, name);
  const t = { ...sim.threads[name], held: [...sim.threads[name].held] };
  if (t.status === "done") return null;

  const locks = { ...sim.locks };
  const ins = program[t.pc];
  let backoffs = sim.backoffs;
  let line;
  let event = null;

  if (ins.op === "lock") {
    const holder = locks[ins.lock];
    if (!holder) {
      locks[ins.lock] = name;
      t.held.push(ins.lock);
      t.pc += 1;
      t.status = "ready";
      t.waitingFor = null;
      t.waited = 0;
      line = name + " locks account" + ins.lock + ".";
    } else if (mode === "trylock") {
      t.waited += 1;
      if (t.waited >= TIMEOUT) {
        t.held.forEach((l) => {
          locks[l] = null;
        });
        line = name + ": tryLock(account" + ins.lock + ") timed out, so it releases " + t.held.map((l) => "account" + l).join(" and ") + " and backs off to retry.";
        t.held = [];
        t.pc = 0;
        t.waited = 0;
        t.waitingFor = null;
        t.status = "ready";
        backoffs += 1;
        event = "backoff";
      } else {
        t.status = "waiting";
        t.waitingFor = ins.lock;
        line = name + ": tryLock(account" + ins.lock + ") — " + holder + " holds it. Waiting (" + t.waited + "/" + TIMEOUT + ")…";
      }
    } else {
      t.status = "waiting";
      t.waitingFor = ins.lock;
      line = name + " wants account" + ins.lock + ", but " + holder + " holds it. " + name + " blocks.";
    }
  } else if (ins.op === "work") {
    t.pc += 1;
    line = name + " moves the money.";
  } else {
    locks[ins.lock] = null;
    t.held = t.held.filter((l) => l !== ins.lock);
    t.pc += 1;
    line = name + " unlocks account" + ins.lock + ".";
  }

  if (t.pc >= program.length) t.status = "done";
  return {
    sim: { locks, threads: { ...sim.threads, [name]: t }, backoffs, log: [...sim.log, line] },
    line,
    event,
  };
}

function isDeadlocked(sim, mode) {
  if (mode === "trylock") return false;
  const { T1, T2 } = sim.threads;
  return T1.status === "waiting" && T2.status === "waiting" && sim.locks[T1.waitingFor] === "T2" && sim.locks[T2.waitingFor] === "T1";
}

function segment(from, to, gapFrom, gapTo) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x1: from.x + (dx / len) * gapFrom,
    y1: from.y + (dy / len) * gapFrom,
    x2: to.x - (dx / len) * gapTo,
    y2: to.y - (dy / len) * gapTo,
  };
}

export function DeadlockLab({ complete }) {
  const [mode, setMode] = useState("naive");
  const [sim, setSim] = useState(freshSim);
  const [say, setSay] = useState({ text: HINT.naive });

  const dead = isDeadlocked(sim, mode);
  const allDone = THREADS.every((n) => sim.threads[n].status === "done");

  function step(name) {
    if (dead) return;
    const result = advance(sim, name, mode);
    if (!result) return;
    const next = result.sim;
    setSim(next);

    if (isDeadlocked(next, mode)) {
      setSay({
        text: "**Deadlock.** T1 holds accountA and waits for accountB; T2 holds accountB and waits for accountA. Neither will ever let go — in production this is a hung request and a thread dump saying “Found one Java-level deadlock”.",
        tone: "bad",
      });
      complete("deadlock");
      sfx.error();
      return;
    }

    if (THREADS.every((n) => next.threads[n].status === "done")) {
      if (mode === "ordered") {
        setSay({ text: "Both transfers finished. With one global order — A before B — a cycle can't form: whoever gets A first also gets B.", tone: "good" });
        complete("ordered");
      } else if (mode === "trylock" && next.backoffs > 0) {
        setSay({ text: "Both transfers finished. The timeout broke **hold and wait**: a thread that couldn't get its second lock let go of its first.", tone: "good" });
        complete("escape");
      } else {
        setSay({ text: "Both transfers finished — this time. Timing saved you, not the code. Reset and step T1 once, then T2 once.", tone: "good" });
      }
      sfx.success();
      return;
    }

    setSay({ text: result.line, tone: result.event === "backoff" ? "good" : next.threads[name].status === "waiting" ? "bad" : undefined });
    sfx.click();
  }

  function changeMode(next) {
    setMode(next);
    setSim(freshSim());
    setSay({ text: HINT[next] });
  }

  function reset() {
    setSim(freshSim());
    setSay({ text: HINT[mode] });
    sfx.close();
  }

  const edges = [];
  THREADS.forEach((t) => {
    const th = sim.threads[t];
    th.held.forEach((l) => edges.push({ key: "h" + t + l, from: NODES[l], to: NODES[t], kind: "hold", gaps: [18, 30] }));
    if (th.status === "waiting") edges.push({ key: "w" + t, from: NODES[t], to: NODES[th.waitingFor], kind: "wait", gaps: [28, 20] });
  });

  function statusLabel(t) {
    if (t.status === "done") return ["TERMINATED", " is-good"];
    if (t.status === "waiting") return [mode === "trylock" ? "TIMED_WAITING" : "BLOCKED", " is-bad"];
    return ["RUNNABLE", " is-active"];
  }

  function renderThread(name) {
    const t = sim.threads[name];
    const program = programFor(mode, name);
    const [label, chip] = statusLabel(t);
    return (
      <Panel key={name} title={"Thread " + name} className="dlock__thread">
        <div className="lab-row">
          <span className={"lab-chip" + chip}>{label}</span>
          {t.held.map((l) => (
            <span key={l} className="lab-chip is-warn">
              holds {l}
            </span>
          ))}
        </div>
        <pre className="lab-code">
          {program.map((ins, i) => {
            let cls = "";
            if (t.status === "done") cls = " is-done";
            else if (i === t.pc) cls = t.status === "waiting" ? " is-blocked" : " is-on";
            return (
              <span key={i} className={"lab-code__line" + cls}>
                {ins.code}
              </span>
            );
          })}
        </pre>
        <Btn variant="primary" onClick={() => step(name)} disabled={dead || t.status === "done"}>
          Step {name} ▸
        </Btn>
      </Panel>
    );
  }

  return (
    <div className="lab dlock">
      <div className="lab-row">
        <Segmented label="Strategy" options={MODES} value={mode} onChange={changeMode} />
        <Btn variant={dead || allDone ? "primary" : "ghost"} onClick={reset}>
          ↺ Reset
        </Btn>
      </div>

      <div className="dlock__stage">
        {renderThread("T1")}
        <Panel title="Who holds, who waits" className={"dlock__graph-panel" + (dead ? " is-dead" : "")}>
          <svg className="dlock__graph" viewBox="0 0 320 200" role="img" aria-label={dead ? "Wait-for graph showing a deadlock cycle" : "Wait-for graph"}>
            <defs>
              <marker id="dl-hold" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" className="dlock__head dlock__head--hold" />
              </marker>
              <marker id="dl-wait" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" className="dlock__head dlock__head--wait" />
              </marker>
            </defs>
            {edges.map((e) => (
              <line key={e.key} {...segment(e.from, e.to, e.gaps[0], e.gaps[1])} className={"dlock__edge dlock__edge--" + e.kind} markerEnd={"url(#dl-" + e.kind + ")"} />
            ))}
            {["A", "B"].map((l) => (
              <g key={l} className={"dlock__lock" + (sim.locks[l] ? " is-held" : "")}>
                <rect x={NODES[l].x - 50} y={NODES[l].y - 15} width="100" height="30" rx="8" />
                <text x={NODES[l].x} y={NODES[l].y + 4}>
                  account{l}
                </text>
              </g>
            ))}
            {THREADS.map((t) => (
              <g key={t} className={"dlock__node is-" + sim.threads[t].status}>
                <circle cx={NODES[t].x} cy={NODES[t].y} r="24" />
                <text x={NODES[t].x} y={NODES[t].y + 4}>
                  {t}
                </text>
              </g>
            ))}
          </svg>
          <p className="lab-note">
            <span className="dlock__key dlock__key--hold" /> holds · <span className="dlock__key dlock__key--wait" /> waits for
          </p>
        </Panel>
        {renderThread("T2")}
      </div>

      <Say tone={say.tone}>{say.text}</Say>

      <Panel title="The four Coffman conditions — a deadlock needs all of them">
        <ul className="dlock__coffman">
          {COFFMAN.map((c) => {
            const broken = c.broken === mode;
            return (
              <li key={c.name} className={dead ? "is-met" : broken ? "is-broken" : ""}>
                <strong>
                  {dead ? "✓ " : broken ? "✂ " : ""}
                  {c.name}
                </strong>
                <span>{c.text}</span>
                {broken ? <span className="lab-chip is-good">broken by this fix</span> : null}
              </li>
            );
          })}
        </ul>
      </Panel>

      {sim.log.length ? (
        <Panel title="Timeline">
          <ol className="lab-log">
            {sim.log.map((line, i) => (
              <li key={i}>
                {i + 1}. {line}
              </li>
            ))}
          </ol>
        </Panel>
      ) : null}
    </div>
  );
}
