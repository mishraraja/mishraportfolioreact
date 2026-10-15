import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Btn, Panel, Say, Segmented } from "./kit";
import { sfx } from "../../lib/sound";
import "./ThreadPoolLab.css";

const PRESETS = {
  custom: {
    label: "Custom (2, 4, queue 2)",
    core: 2,
    max: 4,
    queue: 2,
    code: "new ThreadPoolExecutor(2, 4, 30, SECONDS, new ArrayBlockingQueue<>(2))",
  },
  fixed: {
    label: "newFixedThreadPool(2)",
    core: 2,
    max: 2,
    queue: Infinity,
    code: "new ThreadPoolExecutor(2, 2, 0L, MILLISECONDS, new LinkedBlockingQueue<>())",
  },
  cached: {
    label: "newCachedThreadPool()",
    core: 0,
    max: Infinity,
    queue: 0,
    code: "new ThreadPoolExecutor(0, Integer.MAX_VALUE, 60L, SECONDS, new SynchronousQueue<>())",
  },
};

const TASK_LIMIT = 16;

const RULES = [
  "Fewer than corePoolSize threads? Start a new thread for the task.",
  "Otherwise offer it to the queue: an idle thread takes it, or it waits there.",
  "Queue full? Add a thread, up to maximumPoolSize.",
  "Queue full and every thread busy? Reject it — RejectedExecutionException.",
];

const INTRO =
  "Think of a kitchen: threads are chefs, the queue is the ticket rail. Submit tasks one at a time and watch which rule decides where each one goes — the order of the rules surprises most people.";

function fresh() {
  return { workers: [], queue: [], rejected: [], done: 0, nextTask: 1, nextWorker: 1, rule: null };
}

const name = (id) => "pool-thread-" + id;

export function ThreadPoolLab({ complete }) {
  const [preset, setPreset] = useState("custom");
  const [sim, setSim] = useState(fresh);
  const [say, setSay] = useState({ text: INTRO });

  const p = PRESETS[preset];

  function submit() {
    if (sim.nextTask > TASK_LIMIT) {
      setSay({ text: TASK_LIMIT + " tasks is plenty for one kitchen. Reset to try another pool.", tone: "bad" });
      sfx.error();
      return;
    }

    const task = sim.nextTask;
    const idle = sim.workers.find((w) => w.task === null);
    const count = sim.workers.length;
    let { workers, queue, rejected, nextWorker } = sim;
    let rule;
    let text;
    let tone;

    if (count < p.core) {
      workers = [...workers, { id: nextWorker, task }];
      rule = 0;
      text =
        "Only " + count + " of " + p.core + " core threads exist, so the pool starts **" + name(nextWorker) + "** for task #" + task +
        (idle ? " — even though another thread is sitting idle." : ".");
      nextWorker += 1;
    } else if (idle) {
      workers = workers.map((w) => (w === idle ? { ...w, task } : w));
      rule = 1;
      text = "Task #" + task + " goes through the queue, and idle **" + name(idle.id) + "** picks it up straight away.";
    } else if (queue.length < p.queue) {
      queue = [...queue, task];
      rule = 1;
      text =
        "All " + count + " threads are busy, so task #" + task + " **waits in the queue**" +
        (p.queue === Infinity
          ? ". This queue is unbounded, so the pool will never add a thread — in production the queue just grows until memory runs out."
          : " (" + queue.length + "/" + p.queue + "). No new thread yet, even though the maximum is " + p.max + ".");
      complete("queued");
    } else if (count < p.max) {
      workers = [...workers, { id: nextWorker, task }];
      rule = 2;
      text =
        p.queue === 0
          ? "A SynchronousQueue holds nothing and no thread is idle, so the pool starts **" + name(nextWorker) + "** for task #" + task + "."
          : "The queue is full, so only now does the pool grow past its " + p.core + " core threads: **" + name(nextWorker) + "** takes task #" + task + ".";
      nextWorker += 1;
      tone = "good";
      complete("grow");
    } else {
      rejected = [...rejected, task];
      rule = 3;
      text =
        "Queue full and all " + count + " threads busy: task #" + task + " is **rejected** with RejectedExecutionException. (CallerRunsPolicy would run it on the caller instead — natural backpressure.)";
      tone = "bad";
      complete("rejected");
    }

    setSim({ ...sim, workers, queue, rejected, nextWorker, nextTask: task + 1, rule });
    setSay({ text, tone });
    if (tone === "bad") sfx.error();
    else sfx.click();
  }

  function finish() {
    const busy = sim.workers.filter((w) => w.task !== null).sort((a, b) => a.task - b.task)[0];
    if (!busy) {
      setSay({ text: "Nothing is running right now. Submit a task first." });
      sfx.error();
      return;
    }
    const [next, ...rest] = sim.queue;
    const workers = sim.workers.map((w) => (w === busy ? { ...w, task: next === undefined ? null : next } : w));
    setSim({ ...sim, workers, queue: next === undefined ? sim.queue : rest, done: sim.done + 1, rule: null });
    setSay({
      text:
        "Task #" + busy.task + " is done. " +
        (next !== undefined ? name(busy.id) + " immediately takes task #" + next + " from the queue." : name(busy.id) + " is idle now, waiting on the queue for work."),
    });
    sfx.success();
  }

  function keepAlive() {
    let extra = sim.workers.length - p.core;
    const survivors = [];
    const removed = [];
    for (const w of sim.workers) {
      if (extra > 0 && w.task === null) {
        removed.push(w);
        extra -= 1;
      } else {
        survivors.push(w);
      }
    }

    if (!removed.length) {
      setSay({
        text:
          sim.workers.length <= p.core
            ? "Nothing to trim: there are no threads beyond the " + p.core + " core ones, and core threads stay alive while idle."
            : "The extra threads are all busy, so none of them can time out yet. Finish some tasks first.",
      });
      sfx.click();
      return;
    }

    setSim({ ...sim, workers: survivors, rule: null });
    setSay({
      text: "keepAliveTime passed: idle " + removed.map((w) => name(w.id)).join(" and ") + " went beyond the core size, so " + (removed.length === 1 ? "it was" : "they were") + " stopped.",
      tone: "good",
    });
    complete("shrink");
    sfx.success();
  }

  function changePreset(next) {
    setPreset(next);
    setSim(fresh());
    setSay({ text: INTRO });
  }

  function reset() {
    setSim(fresh());
    setSay({ text: INTRO });
    sfx.close();
  }

  return (
    <div className="lab tpool">
      <Segmented label="Pool" options={Object.entries(PRESETS).map(([id, v]) => ({ id, label: v.label }))} value={preset} onChange={changePreset} />
      <pre className="lab-code">
        <span className="lab-code__line">{"ExecutorService pool ="}</span>
        <span className="lab-code__line">{"    " + p.code + ";"}</span>
      </pre>

      <div className="lab-row">
        <Btn variant="primary" onClick={submit}>
          pool.submit(task #{sim.nextTask})
        </Btn>
        <Btn onClick={finish}>✓ a task finishes</Btn>
        <Btn onClick={keepAlive}>⏱ keepAliveTime passes</Btn>
        <Btn variant="ghost" onClick={reset}>
          ↺ Reset
        </Btn>
      </div>

      <Say tone={say.tone}>{say.text}</Say>

      <div className="tpool__stage">
        <Panel title={"Threads · core " + p.core + " · max " + (p.max === Infinity ? "∞" : p.max)} className="tpool__threads">
          <div className="tpool__workers">
            <AnimatePresence initial={false}>
              {sim.workers.map((w, i) => (
                <motion.div
                  key={w.id}
                  layout
                  className={"tpool__worker" + (w.task !== null ? " is-busy" : "")}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                >
                  <span className="tpool__chef" aria-hidden="true">
                    {w.task !== null ? "🧑‍🍳" : "💤"}
                  </span>
                  <strong>{name(w.id)}</strong>
                  <span className="lab-label">{i < p.core ? "core" : "extra"}</span>
                  <span className="tpool__task">{w.task !== null ? "task #" + w.task : "idle"}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {!sim.workers.length ? <p className="lab-note">No threads yet — a pool starts them lazily.</p> : null}
          </div>
        </Panel>

        <Panel title={"Queue · capacity " + (p.queue === Infinity ? "∞" : p.queue)}>
          {p.queue === 0 ? (
            <p className="lab-note">A SynchronousQueue has no room at all. It only hands a task straight to a thread that's already waiting.</p>
          ) : (
            <div className="tpool__queue">
              {p.queue === Infinity
                ? sim.queue.map((t) => (
                    <span key={t} className="tpool__slot is-full">
                      #{t}
                    </span>
                  ))
                : Array.from({ length: p.queue }, (_, i) => (
                    <span key={i} className={"tpool__slot" + (sim.queue[i] ? " is-full" : "")}>
                      {sim.queue[i] ? "#" + sim.queue[i] : ""}
                    </span>
                  ))}
              {p.queue === Infinity ? <span className="tpool__slot tpool__slot--more">…∞</span> : null}
            </div>
          )}
        </Panel>

        <Panel title={"Rejected · " + sim.rejected.length}>
          <div className="lab-row">
            {sim.rejected.length ? (
              sim.rejected.map((t) => (
                <span key={t} className="lab-chip is-bad">
                  #{t}
                </span>
              ))
            ) : (
              <span className="lab-note">none yet</span>
            )}
          </div>
          <span className="lab-note">completed: {sim.done}</span>
        </Panel>
      </div>

      <Panel title="How submit() decides, in order">
        <ol className="tpool__rules">
          {RULES.map((rule, i) => (
            <li key={i} className={sim.rule === i ? "is-on" : ""}>
              <span className="tpool__num">{i + 1}</span>
              {rule}
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
