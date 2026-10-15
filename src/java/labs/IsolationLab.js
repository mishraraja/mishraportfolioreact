import { useState } from "react";
import { Btn, Panel, Say, Segmented } from "./kit";
import { sfx } from "../../lib/sound";
import "./IsolationLab.css";

const LEVELS = [
  { id: "RU", label: "READ UNCOMMITTED" },
  { id: "RC", label: "READ COMMITTED" },
  { id: "RR", label: "REPEATABLE READ" },
  { id: "SER", label: "SERIALIZABLE" },
];
const RANK = { RU: 0, RC: 1, RR: 2, SER: 3 };

// preventedAt: the lowest isolation level (by rank) that stops the anomaly, per the SQL standard.
const SCENARIOS = {
  dirty: {
    label: "Dirty read",
    mission: "dirty",
    preventedAt: 1,
    subject: "account #1 balance",
    start: { committed: 1000, pending: null },
    steps: [
      { tx: "T1", sql: "BEGIN;" },
      { tx: "T2", sql: "BEGIN;" },
      { tx: "T2", sql: "UPDATE account SET balance = 500 WHERE id = 1;", after: { pending: 500 } },
      { tx: "T1", sql: "SELECT balance FROM account WHERE id = 1;", read: (rank) => (rank < 1 ? 500 : 1000), key: true },
      { tx: "T2", sql: "ROLLBACK;", after: { pending: null } },
      { tx: "T1", sql: "COMMIT;" },
    ],
    happened: "T1 read **500** — a balance that was rolled back and never really existed. That's a **dirty read**.",
    prevented: "T1 read **1000**, the last committed value. From READ COMMITTED upwards, uncommitted changes stay invisible.",
  },
  nonRepeatable: {
    label: "Non-repeatable read",
    mission: "non-repeatable",
    preventedAt: 2,
    subject: "account #1 balance",
    start: { committed: 1000, pending: null },
    steps: [
      { tx: "T1", sql: "BEGIN;" },
      { tx: "T1", sql: "SELECT balance FROM account WHERE id = 1;", read: () => 1000 },
      { tx: "T2", sql: "BEGIN;" },
      { tx: "T2", sql: "UPDATE account SET balance = 500 WHERE id = 1;", after: { pending: 500 } },
      { tx: "T2", sql: "COMMIT;", after: { committed: 500, pending: null } },
      { tx: "T1", sql: "SELECT balance FROM account WHERE id = 1;", read: (rank) => (rank < 2 ? 500 : 1000), key: true },
      { tx: "T1", sql: "COMMIT;" },
    ],
    happened: "The same query in the same transaction returned **1000**, then **500**. That's a **non-repeatable read**.",
    prevented: "T1 read **1000** both times. From REPEATABLE READ upwards, a row you've read keeps its value until you commit.",
  },
  phantom: {
    label: "Phantom read",
    mission: "phantom",
    preventedAt: 3,
    subject: "employees earning over 50,000",
    start: { committed: "3 rows", pending: null },
    steps: [
      { tx: "T1", sql: "BEGIN;" },
      { tx: "T1", sql: "SELECT COUNT(*) FROM employee WHERE salary > 50000;", read: () => 3 },
      { tx: "T2", sql: "BEGIN;" },
      { tx: "T2", sql: "INSERT INTO employee (name, salary) VALUES ('Zoya', 90000);", after: { pending: "+1 row" } },
      { tx: "T2", sql: "COMMIT;", after: { committed: "4 rows", pending: null } },
      { tx: "T1", sql: "SELECT COUNT(*) FROM employee WHERE salary > 50000;", read: (rank) => (rank < 3 ? 4 : 3), key: true },
      { tx: "T1", sql: "COMMIT;" },
    ],
    happened: "The count went from **3** to **4**: a new matching row appeared mid-transaction. That's a **phantom read**.",
    prevented: "T1 counted **3** both times. SERIALIZABLE behaves as if the two transactions ran one after the other.",
    footnote: "This follows the SQL standard's table. In practice PostgreSQL and MySQL InnoDB read from a snapshot at REPEATABLE READ, so they'd show 3 there too.",
  },
};

const COLUMNS = [
  ["dirty", "Dirty read"],
  ["nonRepeatable", "Non-repeatable read"],
  ["phantom", "Phantom read"],
];

const INTRO = "Two browser tabs, one database. Pick an anomaly and an isolation level, then step through the two transactions and see what T1 reads.";

export function IsolationLab({ complete }) {
  const [scenario, setScenario] = useState("dirty");
  const [level, setLevel] = useState("RU");
  const [step, setStep] = useState(0);
  const [say, setSay] = useState({ text: INTRO });

  const s = SCENARIOS[scenario];
  const rank = RANK[level];
  const anomaly = rank < s.preventedAt;
  const finished = step === s.steps.length;

  const data = s.steps.slice(0, step).reduce((acc, st) => (st.after ? { ...acc, ...st.after } : acc), s.start);

  function next() {
    if (finished) return;
    const st = s.steps[step];
    const done = step + 1;
    setStep(done);

    if (done === s.steps.length) {
      if (anomaly) {
        setSay({ text: s.happened, tone: "bad" });
        complete(s.mission);
        sfx.error();
      } else {
        setSay({ text: s.prevented, tone: "good" });
        complete("prevented");
        sfx.success();
      }
      return;
    }

    if (st.read) {
      const value = st.read(rank);
      setSay({ text: st.tx + " runs the query and gets **" + value + "**." + (st.key ? " Remember the earlier value?" : "") });
    } else if (st.after && st.after.pending !== undefined && st.after.pending !== null) {
      setSay({ text: st.tx + " has changed the data but **hasn't committed**. Can T1 see it?" });
    } else {
      setSay({ text: st.tx + ": `" + st.sql + "`" });
    }
    sfx.click();
  }

  function restart(nextScenario = scenario, nextLevel = level) {
    setScenario(nextScenario);
    setLevel(nextLevel);
    setStep(0);
    setSay({ text: INTRO });
  }

  return (
    <div className="lab iso">
      <div className="lab-grid">
        <Panel title="1 · Pick the anomaly">
          <Segmented
            label="Anomaly"
            options={Object.entries(SCENARIOS).map(([id, v]) => ({ id, label: v.label }))}
            value={scenario}
            onChange={(id) => restart(id, level)}
          />
        </Panel>
        <Panel title="2 · Pick T1's isolation level">
          <Segmented label="Isolation level" options={LEVELS} value={level} onChange={(id) => restart(scenario, id)} />
        </Panel>
      </div>

      <div className="iso__stage">
        <Panel title="Two transactions" className="iso__txs">
          <div className="iso__timeline" role="table" aria-label="Two transactions, step by step">
            <div className="iso__row iso__row--head" role="row">
              <span role="columnheader">T1 · {LEVELS[rank].label}</span>
              <span role="columnheader">T2</span>
            </div>
            {s.steps.map((st, i) => {
              const done = i < step;
              const value = st.read && done ? st.read(rank) : null;
              return (
                <div key={i} className={"iso__row" + (done ? " is-done" : i === step ? " is-next" : "")} role="row">
                  {["T1", "T2"].map((tx) => (
                    <span key={tx} className="iso__cell" role="cell">
                      {st.tx === tx ? (
                        <>
                          <code>{st.sql}</code>
                          {value !== null ? <span className={"lab-chip" + (st.key ? (anomaly ? " is-bad" : " is-good") : " is-active")}>→ {value}</span> : null}
                        </>
                      ) : null}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="lab-row">
            <Btn variant="primary" onClick={next} disabled={finished}>
              Next statement ▸
            </Btn>
            <Btn variant="ghost" onClick={() => restart()}>
              ↺ Replay
            </Btn>
          </div>
        </Panel>

        <Panel title="The data" className="iso__data">
          <span className="lab-label">{s.subject}</span>
          <dl className="lab-kv">
            <div>
              <dt>committed</dt>
              <dd>{data.committed}</dd>
            </div>
            <div>
              <dt>uncommitted (T2)</dt>
              <dd className={data.pending !== null ? "t-warn" : "t-muted"}>{data.pending !== null ? data.pending : "—"}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Say tone={say.tone}>{say.text}</Say>
      {finished && s.footnote ? <p className="lab-note">{s.footnote}</p> : null}

      <Panel title="What each level allows (SQL standard)">
        <div className="iso__matrix-wrap">
          <table className="iso__matrix">
            <thead>
              <tr>
                <th scope="col">Isolation level</th>
                {COLUMNS.map(([id, label]) => (
                  <th key={id} scope="col" className={id === scenario ? "is-col" : ""}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((lv) => (
                <tr key={lv.id} className={lv.id === level ? "is-row" : ""}>
                  <th scope="row">{lv.label}</th>
                  {COLUMNS.map(([id]) => {
                    const possible = RANK[lv.id] < SCENARIOS[id].preventedAt;
                    return (
                      <td key={id} className={(possible ? "t-bad" : "t-good") + (id === scenario ? " is-col" : "")}>
                        {possible ? "possible" : "prevented"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
