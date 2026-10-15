import { useState } from "react";
import { motion } from "framer-motion";
import { Btn, Panel, Say, Segmented, Toggle } from "./kit";
import { CodeBlock } from "../../dsa/components/CodeBlock";
import { sfx } from "../../lib/sound";
import "./JoinLab.css";

const EMPLOYEES = [
  { id: 1, name: "Asha", dept: 10 },
  { id: 2, name: "Ravi", dept: 20 },
  { id: 3, name: "Meera", dept: 10 },
  { id: 4, name: "John", dept: null },
  { id: 5, name: "Li", dept: 40 },
];

const DEPARTMENTS = [
  { id: 10, name: "Engineering" },
  { id: 20, name: "Sales" },
  { id: 30, name: "Marketing" },
];

const DEPT_BY_ID = new Map(DEPARTMENTS.map((d) => [d.id, d]));

const JOINS = [
  { id: "INNER", label: "INNER" },
  { id: "LEFT", label: "LEFT" },
  { id: "RIGHT", label: "RIGHT" },
  { id: "FULL", label: "FULL OUTER" },
];

function runJoin(type, anti) {
  const rows = [];
  const matched = new Set();
  for (const e of EMPLOYEES) {
    const d = DEPT_BY_ID.get(e.dept) || null;
    if (d) {
      matched.add(d.id);
      rows.push({ e, d });
    } else if (type === "LEFT" || type === "FULL") {
      rows.push({ e, d: null });
    }
  }
  if (type === "RIGHT" || type === "FULL") {
    for (const d of DEPARTMENTS) {
      if (!matched.has(d.id)) rows.push({ e: null, d });
    }
  }
  return anti ? rows.filter((r) => r.d === null) : rows;
}

function sqlFor(type, anti) {
  const join = type === "FULL" ? "FULL OUTER JOIN" : type + " JOIN";
  return (
    "SELECT e.name, d.name AS department\n" +
    "FROM employee e\n" +
    join + " department d ON d.id = e.dept_id" +
    (anti ? "\nWHERE d.id IS NULL;" : ";")
  );
}

function explain(type, anti, count) {
  if (anti) return "Keep only the rows where the department side is NULL, and you get the employees with no valid department: **" + count + " rows**. That's the anti-join.";
  if (type === "INNER") return "INNER JOIN keeps only pairs that match: **" + count + " rows**. John (no department), Li (department 40 doesn't exist) and Marketing (nobody in it) all disappear.";
  if (type === "LEFT") return "LEFT JOIN keeps **every employee**: " + count + " rows. Where no department matches, the department column is NULL.";
  if (type === "RIGHT") return "RIGHT JOIN is the mirror image: **every department** stays, so " + count + " rows, and Marketing gets a NULL employee.";
  return "FULL OUTER JOIN keeps everyone from both sides: **" + count + " rows**. MySQL has no FULL JOIN, so there you'd UNION a LEFT and a RIGHT join.";
}

export function JoinLab({ complete }) {
  const [type, setType] = useState("INNER");
  const [anti, setAnti] = useState(false);
  const [seen, setSeen] = useState(() => new Set(["INNER"]));

  const rows = runJoin(type, anti);
  const matchedDepts = new Set(EMPLOYEES.map((e) => e.dept).filter((id) => DEPT_BY_ID.has(id)));

  function record(nextType, nextAnti) {
    const nextSeen = new Set(seen).add(nextType);
    setSeen(nextSeen);
    if (nextSeen.has("INNER") && nextSeen.has("LEFT")) complete("inner-left");
    if (nextType === "FULL") complete("full");
    if (nextAnti) complete("anti");
  }

  function chooseType(next) {
    setType(next);
    const nextAnti = next === "LEFT" ? anti : false;
    setAnti(nextAnti);
    record(next, nextAnti);
  }

  // The anti-join only makes sense on a LEFT JOIN, so switching it on switches to LEFT.
  function toggleAnti(value) {
    const nextType = value ? "LEFT" : type;
    setType(nextType);
    setAnti(value);
    record(nextType, value);
    sfx.click();
  }

  function employeeClass(e) {
    const matches = DEPT_BY_ID.has(e.dept);
    if (anti) return matches ? " is-dropped" : " is-kept";
    if (matches) return " is-match";
    return type === "LEFT" || type === "FULL" ? " is-kept" : " is-dropped";
  }

  function deptClass(d) {
    if (anti) return " is-dropped";
    if (matchedDepts.has(d.id)) return " is-match";
    return type === "RIGHT" || type === "FULL" ? " is-kept" : " is-dropped";
  }

  return (
    <div className="lab join">
      <div className="lab-row">
        <Segmented label="Join type" options={JOINS} value={type} onChange={chooseType} />
        <Toggle checked={anti} onChange={toggleAnti}>
          {type === "LEFT" ? "add WHERE d.id IS NULL" : "WHERE d.id IS NULL (LEFT only)"}
        </Toggle>
      </div>

      <CodeBlock code={sqlFor(type, anti)} lang="sql" />

      <Say tone={anti ? "good" : undefined}>{explain(type, anti, rows.length)}</Say>

      <div className="join__tables">
        <Panel title="employee">
          <table className="join__table">
            <thead>
              <tr>
                <th>id</th>
                <th>name</th>
                <th>dept_id</th>
              </tr>
            </thead>
            <tbody>
              {EMPLOYEES.map((e) => (
                <tr key={e.id} className={employeeClass(e).trim()}>
                  <td>{e.id}</td>
                  <td>{e.name}</td>
                  <td className={e.dept === null ? "join__null" : ""}>{e.dept === null ? "NULL" : e.dept}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="department">
          <table className="join__table">
            <thead>
              <tr>
                <th>id</th>
                <th>name</th>
              </tr>
            </thead>
            <tbody>
              {DEPARTMENTS.map((d) => (
                <tr key={d.id} className={deptClass(d).trim()}>
                  <td>{d.id}</td>
                  <td>{d.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title={"Result · " + rows.length + " rows"} className="join__result">
          <table className="join__table">
            <thead>
              <tr>
                <th>e.name</th>
                <th>department</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <motion.tr key={(r.e ? "e" + r.e.id : "") + (r.d ? "d" + r.d.id : "")} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td className={r.e ? "" : "join__null"}>{r.e ? r.e.name : "NULL"}</td>
                  <td className={r.d ? "" : "join__null"}>{r.d ? r.d.name : "NULL"}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <p className="lab-note">
        <span className="join__key is-match" /> matched · <span className="join__key is-kept" /> kept without a match · <span className="join__key is-dropped" /> dropped
      </p>

      <div className="lab-row">
        <Btn
          variant="ghost"
          onClick={() => {
            setType("INNER");
            setAnti(false);
            sfx.close();
          }}
        >
          ↺ Back to INNER
        </Btn>
      </div>
    </div>
  );
}
