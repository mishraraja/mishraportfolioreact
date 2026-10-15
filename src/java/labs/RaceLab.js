import { useState } from "react";
import { motion } from "framer-motion";
import { Btn, Panel, Say, Segmented } from "./kit";
import { sfx } from "../../lib/sound";
import "./RaceLab.css";

const MODES = [
  { id: "plain", label: "count++" },
  { id: "sync", label: "synchronized" },
  { id: "atomic", label: "AtomicInteger" },
];

const PROGRAMS = {
  plain: [
    { op: "read", code: "int tmp = count;" },
    { op: "add", code: "tmp = tmp + 1;" },
    { op: "write", code: "count = tmp;" },
  ],
  sync: [
    { op: "lock", code: "synchronized (lock) {" },
    { op: "read", code: "    int tmp = count;" },
    { op: "add", code: "    tmp = tmp + 1;" },
    { op: "write", code: "    count = tmp;" },
    { op: "unlock", code: "}" },
  ],
  atomic: [
    { op: "read", code: "int expected = count.get();" },
    { op: "cas", code: "count.compareAndSet(expected, expected + 1)" },
  ],
};

const LOCAL = { plain: "tmp", sync: "tmp", atomic: "expected" };

const HINT = {
  plain:
    "You're the thread scheduler. Both threads run `count++` once, so count should end at 2. Step them in any order — can you make one increment vanish? (Let both read before either writes.)",
  sync: "Same trick again, but now read-add-write sits inside `synchronized`. Try to get both threads inside at once.",
  atomic: "AtomicInteger reads, then writes only if nobody changed the value in between. Try the same interleaving and watch what happens.",
};

const THREADS = ["T1", "T2"];

function freshThread() {
  return { pc: 0, local: null, status: "ready", retries: 0 };
}

function freshSim() {
  return { count: 0, owner: null, threads: { T1: freshThread(), T2: freshThread() }, log: [] };
}

/** Runs one instruction of one thread. Pure: returns the next state and what happened. */
function advance(sim, name, mode) {
  const program = PROGRAMS[mode];
  const t = { ...sim.threads[name] };
  if (t.status === "done") return { sim, line: null, event: null };

  const ins = program[t.pc];
  let { count, owner } = sim;
  let line;
  let event = null;

  if (ins.op === "lock") {
    if (owner && owner !== name) {
      t.status = "blocked";
      line = name + " is BLOCKED — " + owner + " holds the lock.";
      event = "blocked";
    } else {
      owner = name;
      t.status = "ready";
      t.pc += 1;
      line = name + " acquires the lock.";
    }
  } else if (ins.op === "read") {
    t.local = count;
    t.pc += 1;
    line = name + " reads count = " + count + ".";
  } else if (ins.op === "add") {
    t.local += 1;
    t.pc += 1;
    line = name + " computes " + t.local + " in its own memory.";
  } else if (ins.op === "write") {
    count = t.local;
    t.pc += 1;
    line = name + " writes count = " + count + ".";
  } else if (ins.op === "unlock") {
    owner = null;
    t.pc += 1;
    line = name + " releases the lock.";
  } else if (count === t.local) {
    count = t.local + 1;
    t.pc += 1;
    line = name + ": compareAndSet(" + t.local + ", " + (t.local + 1) + ") succeeds → count = " + count + ".";
  } else {
    line = name + ": compareAndSet(" + t.local + ", " + (t.local + 1) + ") fails — count is already " + count + ". Retry from the top.";
    t.pc = 0;
    t.retries += 1;
    event = "retry";
  }

  if (t.pc >= program.length) t.status = "done";
  return { sim: { count, owner, threads: { ...sim.threads, [name]: t }, log: [...sim.log, line] }, line, event };
}

function verdict(sim, mode) {
  if (!THREADS.every((n) => sim.threads[n].status === "done")) return null;
  if (sim.count !== 2) {
    return {
      tone: "bad",
      lost: true,
      text: "Both threads finished, yet count is **" + sim.count + "**. One thread wrote a stale value over the other's work: a **lost update**.",
    };
  }
  const why = {
    plain: "No overlap this time, so no harm done — but the bug is still there, waiting for unluckier timing. Let both threads read before either writes.",
    sync: "The lock made read-add-write one indivisible step, so the other thread had to wait its turn.",
    atomic: "Compare-and-swap only writes if nothing changed since the read. A stale write is rejected and retried — never lost.",
  };
  return { tone: "good", text: "count is **2**. " + why[mode] };
}

export function RaceLab({ complete }) {
  const [mode, setMode] = useState("plain");
  const [sim, setSim] = useState(freshSim);
  const [say, setSay] = useState({ text: HINT.plain });

  function report(events, next) {
    events.forEach(({ event }) => {
      if (event === "blocked") complete("blocked");
      if (event === "retry") complete("cas-retry");
    });

    const result = verdict(next, mode);
    if (result) {
      if (result.lost) complete("lost-update");
      setSay({ text: result.text, tone: result.tone });
      if (result.tone === "good") sfx.success();
      else sfx.error();
      return;
    }

    const last = events[events.length - 1];
    const trouble = last.event === "blocked" || last.event === "retry";
    setSay({ text: last.line, tone: trouble ? "bad" : undefined });
    if (trouble) sfx.error();
    else sfx.click();
  }

  function step(name) {
    const { sim: next, line, event } = advance(sim, name, mode);
    if (!line) return;
    setSim(next);
    report([{ line, event }], next);
  }

  function schedule() {
    let current = sim;
    const events = [];
    for (let i = 0; i < 60; i += 1) {
      const live = [];
      for (const n of THREADS) {
        if (current.threads[n].status !== "done") live.push(n);
      }
      if (!live.length) break;
      const r = advance(current, live[Math.floor(Math.random() * live.length)], mode);
      current = r.sim;
      events.push({ line: r.line, event: r.event });
    }
    if (!events.length) return;
    setSim(current);
    report(events, current);
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

  const program = PROGRAMS[mode];

  function renderThread(name) {
    const t = sim.threads[name];
    const label = t.status === "done" ? "TERMINATED" : t.status === "blocked" ? "BLOCKED" : "RUNNABLE";
    const chip = t.status === "done" ? " is-good" : t.status === "blocked" ? " is-bad" : " is-active";
    return (
      <Panel key={name} title={"Thread " + name} className="race__thread">
        <span className={"lab-chip" + chip}>{label}</span>
        <pre className="lab-code">
          {program.map((ins, i) => {
            let cls = "";
            if (t.status === "done") cls = " is-done";
            else if (i === t.pc) cls = t.status === "blocked" ? " is-blocked" : " is-on";
            return (
              <span key={i} className={"lab-code__line" + cls}>
                {ins.code}
              </span>
            );
          })}
        </pre>
        <dl className="lab-kv">
          <div>
            <dt>{LOCAL[mode]}</dt>
            <dd>{t.local === null ? "—" : t.local}</dd>
          </div>
          {mode === "atomic" ? (
            <div>
              <dt>retries</dt>
              <dd>{t.retries}</dd>
            </div>
          ) : null}
        </dl>
        <Btn variant="primary" onClick={() => step(name)} disabled={t.status === "done"}>
          Step {name} ▸
        </Btn>
      </Panel>
    );
  }

  return (
    <div className="lab race">
      <div className="lab-row">
        <Segmented label="Protection" options={MODES} value={mode} onChange={changeMode} />
        <Btn onClick={schedule}>🎲 Let the OS schedule it</Btn>
        <Btn variant="ghost" onClick={reset}>
          ↺ Reset
        </Btn>
      </div>

      <div className="race__stage">
        {renderThread("T1")}
        <Panel title="Shared memory" className="race__memory">
          <span className="lab-label">{mode === "atomic" ? "AtomicInteger count" : "int count"}</span>
          <motion.span key={sim.count} className="race__count" initial={{ scale: 1.35 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
            {sim.count}
          </motion.span>
          <span className="lab-note">should be 2 when both finish</span>
          {mode === "sync" ? <span className={"lab-chip" + (sim.owner ? " is-warn" : "")}>{sim.owner ? "🔒 held by " + sim.owner : "🔓 lock is free"}</span> : null}
        </Panel>
        {renderThread("T2")}
      </div>

      <Say tone={say.tone}>{say.text}</Say>

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
