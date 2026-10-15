import { useState } from "react";
import { motion } from "framer-motion";
import { Btn, Panel, Say, Toggle } from "./kit";
import { javaHash, spread } from "./hash";
import { sfx } from "../../lib/sound";
import "./EqualsHashCodeLab.css";

const BUCKETS = 8;
const PEOPLE = {
  asha: { id: 7, name: "Asha" },
  ravi: { id: 9, name: "Ravi" },
};

// Without hashCode(), every object gets its own identity hash — effectively random.
const IDENTITY = [
  0x1b6d3586, 0x4554617c, 0x74a14482, 0x1540e19d, 0x677327b6, 0x14ae5a5, 0x7f31245a, 0x6d6f6e28, 0x135fbaa4, 0x45ee12a7, 0x330bedb4,
  0x2503dbd3,
];

/** Objects.hash(id, name) is Arrays.hashCode: 31 * (31 * 1 + id) + name.hashCode(). */
function objectsHash(person) {
  return (Math.imul(31, 31 + person.id) + javaHash(person.name)) | 0;
}

function emptyTable() {
  return Array.from({ length: BUCKETS }, () => []);
}

const INTRO = "Both methods start switched off, like a class that forgot them. Add Asha twice and see what the HashSet does.";

/** The equals/hashCode contract, felt: hashCode picks the drawer, equals checks inside it. */
export function EqualsHashCodeLab({ complete }) {
  const [eq, setEq] = useState(false);
  const [hc, setHc] = useState(false);
  const [table, setTable] = useState(emptyTable);
  const [nextObj, setNextObj] = useState(1);
  const [probe, setProbe] = useState(null);
  const [say, setSay] = useState({ text: INTRO });

  function hashFor(person, objId) {
    return hc ? objectsHash(person) : IDENTITY[(objId - 1) % IDENTITY.length];
  }

  function look(person, objId) {
    const hash = hashFor(person, objId);
    const index = spread(hash) & (BUCKETS - 1);
    const steps = [];
    let match = null;
    for (const entry of table[index]) {
      const sameHash = entry.hash === hash;
      // HashMap: p.hash == hash && (k == key || key.equals(k))
      const equal = sameHash && (entry.objId === objId || (eq && entry.id === person.id && entry.name === person.name));
      steps.push({ objId: entry.objId, sameHash, equal });
      if (equal) {
        match = entry;
        break;
      }
    }
    return { hash, index, steps, match };
  }

  function changeClass(which, value) {
    if (which === "eq") setEq(value);
    else setHc(value);
    setTable(emptyTable());
    setProbe(null);
    setNextObj(1);
    setSay({ text: "You recompiled Employee, so the set starts empty. Add Asha twice again." });
  }

  function add(key) {
    const person = PEOPLE[key];
    const objId = nextObj;
    const res = look(person, objId);
    setNextObj(objId + 1);
    setProbe({ ...res, objId, kind: "add", person });

    if (res.match) {
      setSay({ text: "`add()` returned **false**. Bucket " + res.index + " already holds an Employee with the same hash that `equals()` this one. No duplicate.", tone: "good" });
      sfx.success();
      return;
    }

    const twins = table.flat().filter((e) => e.id === person.id);
    const sameBucket = twins.some((t) => table[res.index].includes(t));
    setTable(table.map((b, i) => (i === res.index ? [...b, { objId, hash: res.hash, ...person }] : b)));

    if (!twins.length) {
      setSay({ text: "Stored in bucket " + res.index + ". `add()` returned true." });
      sfx.click();
      return;
    }

    if (sameBucket) {
      setSay({
        text: "Same bucket " + res.index + ", same hash — but without `equals()` Java uses Object's identity check, so a second " + person.name + " got in. **Duplicate!**",
        tone: "bad",
      });
      if (hc && !eq) complete("hash-only");
    } else {
      setSay({
        text: "The new " + person.name + " hashed to bucket " + res.index + ", a different drawer from the first one, so `equals()` was never even asked. **Duplicate!**",
        tone: "bad",
      });
    }
    complete("duplicate");
    sfx.error();
  }

  function contains() {
    const person = PEOPLE.asha;
    const objId = nextObj;
    const res = look(person, objId);
    setNextObj(objId + 1);
    setProbe({ ...res, objId, kind: "contains", person });

    if (res.match) {
      setSay({ text: "`contains()` is **true**: bucket " + res.index + ", same hash, and `equals()` said yes. That's the contract working.", tone: "good" });
      complete("found");
      sfx.success();
      return;
    }

    let why;
    if (!res.steps.length) {
      why = "Bucket " + res.index + " is empty." + (hc ? "" : " Without `hashCode()`, this brand-new object got its own random-looking hash, so Java searched the wrong drawer.");
    } else if (res.steps.some((s) => s.sameHash)) {
      why = "Bucket " + res.index + " had a match on hash, but `equals()` is Object's identity check, so it said no.";
    } else {
      why = "Bucket " + res.index + " held entries with different hash codes, so `equals()` was never called.";
    }
    setSay({ text: "`contains()` is **false**. " + why, tone: "bad" });
    sfx.error();
  }

  function clear() {
    setTable(emptyTable());
    setProbe(null);
    setNextObj(1);
    setSay({ text: INTRO });
    sfx.close();
  }

  const size = table.flat().length;

  return (
    <div className="lab ehc">
      <div className="lab-grid">
        <Panel title="1 · Write the class">
          <div className="lab-row">
            <Toggle checked={eq} onChange={(v) => changeClass("eq", v)}>
              override equals()
            </Toggle>
            <Toggle checked={hc} onChange={(v) => changeClass("hc", v)}>
              override hashCode()
            </Toggle>
          </div>
          <pre className="lab-code" aria-label="The Employee class">
            <span className="lab-code__line">{"class Employee {"}</span>
            <span className="lab-code__line">{"    final int id;  final String name;"}</span>
            <span className="lab-code__line"> </span>
            {eq ? (
              <>
                <span className="lab-code__line is-on">{"    @Override public boolean equals(Object o) {"}</span>
                <span className="lab-code__line is-on">{"        return o instanceof Employee e"}</span>
                <span className="lab-code__line is-on">{"            && id == e.id && name.equals(e.name);"}</span>
                <span className="lab-code__line is-on">{"    }"}</span>
              </>
            ) : (
              <span className="lab-code__line is-off">{"    // equals(): inherited from Object (this == o)"}</span>
            )}
            {hc ? (
              <>
                <span className="lab-code__line is-on">{"    @Override public int hashCode() {"}</span>
                <span className="lab-code__line is-on">{"        return Objects.hash(id, name);"}</span>
                <span className="lab-code__line is-on">{"    }"}</span>
              </>
            ) : (
              <span className="lab-code__line is-off">{"    // hashCode(): inherited identity hash"}</span>
            )}
            <span className="lab-code__line">{"}"}</span>
          </pre>
        </Panel>

        <Panel title="2 · Use it in a HashSet">
          <div className="ehc__actions">
            <Btn onClick={() => add("asha")}>set.add(new Employee(7, "Asha"))</Btn>
            <Btn onClick={() => add("ravi")}>set.add(new Employee(9, "Ravi"))</Btn>
            <Btn variant="primary" onClick={contains}>
              set.contains(new Employee(7, "Asha"))
            </Btn>
          </div>
          <dl className="lab-kv">
            <div>
              <dt>set.size()</dt>
              <dd>{size}</dd>
            </div>
            {probe ? (
              <div>
                <dt>
                  hashCode() of {probe.person.name} #{probe.objId}
                </dt>
                <dd>
                  {probe.hash} → bucket {probe.index}
                </dd>
              </div>
            ) : null}
          </dl>
          <Btn variant="ghost" onClick={clear}>
            ↺ Clear the set
          </Btn>
        </Panel>
      </div>

      <Say tone={say.tone}>{say.text}</Say>

      <Panel title="Inside the HashSet · 8 buckets">
        <div className="ehc__buckets">
          {table.map((bucket, i) => {
            const probed = probe && probe.index === i;
            return (
              <div key={i} className={"ehc__bucket" + (probed ? " is-probed" : "")}>
                <span className="ehc__index">{i}</span>
                {bucket.map((entry) => {
                  const step = probed ? probe.steps.find((s) => s.objId === entry.objId) : null;
                  let cls = "";
                  if (step) cls = step.equal ? " is-good" : step.sameHash ? " is-warn" : " is-bad";
                  return (
                    <motion.span key={entry.objId} className={"lab-chip ehc__entry" + cls} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                      {entry.name} #{entry.objId}
                    </motion.span>
                  );
                })}
              </div>
            );
          })}
        </div>
        <p className="lab-note">
          Green: hash matched and equals() said yes. Amber: same hash, equals() said no. Red: different hash, skipped.
        </p>
      </Panel>
    </div>
  );
}
