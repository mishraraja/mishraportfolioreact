import { useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { Btn, Panel, Say, Segmented } from "./kit";
import { sfx } from "../../lib/sound";
import "./StringPoolLab.css";

const TEXTS = ["java", "spring"];
const NAMES = ["a", "b", "c", "d", "e", "f"];
const START = { objects: [], vars: [], nextId: 1 };
const INTRO = { text: 'Write your first line. Try `String a = "java"`, then the same text again as `b` — and watch where each one lands.' };

/**
 * The String pool, as a hotel: literals share rooms in the pool, `new`
 * always books a fresh room on the heap, intern() walks you back to the pool.
 */
export function StringPoolLab({ complete }) {
  const [lab, setLab] = useState(START);
  const [text, setText] = useState("java");
  const [sourceName, setSourceName] = useState("");
  const [pair, setPair] = useState({ left: "", right: "" });
  const [say, setSay] = useState(INTRO);
  const [result, setResult] = useState(null);

  const { objects, vars } = lab;
  const nextName = NAMES[vars.length];
  const byName = (name) => vars.find((v) => v.name === name);
  const source = byName(sourceName) || vars[vars.length - 1] || null;
  const left = byName(pair.left) || vars[vars.length - 2] || null;
  const right = byName(pair.right) || vars[vars.length - 1] || null;

  function run(kind) {
    if (!nextName) return;
    const objs = objects.map((o) => ({ ...o }));
    let nextId = lab.nextId;
    const pooled = (t) => objs.find((o) => o.pool && o.text === t);
    const make = (t, pool) => {
      const o = { id: nextId, text: t, pool };
      nextId += 1;
      objs.push(o);
      return o;
    };

    let target;
    let line;
    let message;
    let tone;

    if (kind === "literal") {
      line = "String " + nextName + ' = "' + text + '";';
      const hit = pooled(text);
      if (hit) {
        target = hit;
        message = '"' + text + '" is already in the pool, so **' + nextName + "** just points at #" + hit.id + ". No new object was created.";
      } else {
        target = make(text, true);
        message = 'The first time the JVM meets the literal "' + text + '", it goes into the pool as #' + target.id + ".";
      }
    } else if (kind === "new") {
      line = "String " + nextName + ' = new String("' + text + '");';
      const hadLiteral = Boolean(pooled(text));
      if (!hadLiteral) make(text, true);
      target = make(text, false);
      message =
        "`new` always builds a fresh object: #" + target.id + " sits on the heap, outside the pool." +
        (hadLiteral ? "" : ' The literal "' + text + '" was added to the pool on the way.');
    } else {
      const from = objs.find((o) => o.id === source.ref);
      if (kind === "intern") {
        line = "String " + nextName + " = " + source.name + ".intern();";
        const hit = pooled(from.text);
        if (hit && hit.id !== from.id) {
          target = hit;
          tone = "good";
          message = "intern() looked up \"" + from.text + "\" in the pool and returned its pooled twin **#" + hit.id + "** — not #" + from.id + ".";
          complete("intern");
        } else if (hit) {
          target = hit;
          message = "**" + source.name + "** already points into the pool, so intern() hands back the very same #" + hit.id + ".";
        } else {
          from.pool = true;
          target = from;
          message = 'Nothing in the pool said "' + from.text + '" yet, so the JVM registers #' + from.id + " itself and returns it.";
        }
      } else {
        line = "String " + nextName + " = " + source.name + ' + "!";';
        target = make(from.text + "!", false);
        tone = "good";
        message = "**" + source.name + '** still says "' + from.text + '". Strings are immutable, so `+` built a brand-new object #' + target.id + ".";
        complete("immutable");
      }
    }

    setLab({ objects: objs, vars: [...vars, { name: nextName, ref: target.id, line }], nextId });
    setSourceName("");
    setPair({ left: "", right: "" });
    setResult(null);
    setSay({ text: message, tone });
    sfx.click();
  }

  function compare() {
    if (!left || !right || left.name === right.name) {
      setSay({ text: "Pick two different variables to compare.", tone: "bad" });
      sfx.error();
      return;
    }
    const lo = objects.find((o) => o.id === left.ref);
    const ro = objects.find((o) => o.id === right.ref);
    const same = left.ref === right.ref;
    const equal = lo.text === ro.text;
    setResult({ left: left.name, right: right.name, same, equal, refs: [left.ref, right.ref] });

    if (same) {
      setSay({ text: "Both point at #" + left.ref + ". `==` compares references, so it's true — and `equals()` agrees.", tone: "good" });
      complete("same-object");
    } else if (equal) {
      setSay({
        text: "Two different objects (#" + left.ref + " and #" + right.ref + ") with the same characters: `==` is false, `equals()` is true. That's why Strings are compared with equals().",
        tone: "good",
      });
      complete("equal-not-same");
    } else {
      setSay({ text: "Different objects with different text, so both checks are false." });
    }
    sfx.success();
  }

  function reset() {
    setLab(START);
    setResult(null);
    setSourceName("");
    setPair({ left: "", right: "" });
    setSay(INTRO);
    sfx.close();
  }

  function renderObject(o) {
    const names = vars.filter((v) => v.ref === o.id).map((v) => v.name);
    const picked = result && result.refs.includes(o.id);
    return (
      <motion.div
        key={o.id}
        layoutId={"spool-" + o.id}
        layout
        className={"sobj" + (picked ? " is-picked" : "")}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="sobj__id">#{o.id}</span>
        <strong className="sobj__text">"{o.text}"</strong>
        <span className="sobj__refs">{names.length ? "← " + names.join(", ") : "nobody points here"}</span>
      </motion.div>
    );
  }

  const pool = objects.filter((o) => o.pool);
  const loose = objects.filter((o) => !o.pool);

  return (
    <div className="lab spool">
      <div className="lab-grid">
        <Panel title="1 · Write a line of Java">
          <div className="lab-row">
            <span className="lab-label">Text</span>
            <Segmented label="Text" options={TEXTS.map((t) => ({ id: t, label: '"' + t + '"' }))} value={text} onChange={setText} />
          </div>
          <div className="lab-row">
            <Btn onClick={() => run("literal")} disabled={!nextName}>
              String {nextName || "x"} = "{text}"
            </Btn>
            <Btn onClick={() => run("new")} disabled={!nextName}>
              String {nextName || "x"} = new String("{text}")
            </Btn>
          </div>
          {source ? (
            <div className="lab-row">
              <label className="lab-label" htmlFor="spool-source">
                using
              </label>
              <select id="spool-source" className="lab-select" value={source.name} onChange={(e) => setSourceName(e.target.value)}>
                {vars.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
              <Btn onClick={() => run("intern")} disabled={!nextName}>
                {source.name}.intern()
              </Btn>
              <Btn onClick={() => run("concat")} disabled={!nextName}>
                {source.name} + "!"
              </Btn>
            </div>
          ) : null}
          {!nextName ? <p className="lab-note">Six variables is plenty — reset to start again.</p> : null}
        </Panel>

        <Panel title="2 · Compare two variables">
          {vars.length >= 2 ? (
            <>
              <div className="lab-row">
                <select aria-label="Left variable" className="lab-select" value={left ? left.name : ""} onChange={(e) => setPair((p) => ({ ...p, left: e.target.value }))}>
                  {vars.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <span className="lab-label">vs</span>
                <select aria-label="Right variable" className="lab-select" value={right ? right.name : ""} onChange={(e) => setPair((p) => ({ ...p, right: e.target.value }))}>
                  {vars.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <Btn variant="primary" onClick={compare}>
                  Compare
                </Btn>
              </div>
              {result ? (
                <dl className="lab-kv">
                  <div>
                    <dt>
                      {result.left} == {result.right}
                    </dt>
                    <dd className={result.same ? "t-good" : "t-bad"}>{String(result.same)}</dd>
                  </div>
                  <div>
                    <dt>
                      {result.left}.equals({result.right})
                    </dt>
                    <dd className={result.equal ? "t-good" : "t-bad"}>{String(result.equal)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="lab-note">== asks “same object?” — equals() asks “same characters?”</p>
              )}
            </>
          ) : (
            <p className="lab-note">Create at least two variables, then compare them here.</p>
          )}
        </Panel>
      </div>

      <Say tone={say.tone}>{say.text}</Say>

      <LayoutGroup>
        <div className="spool__memory">
          <Panel title="Stack · variables" className="spool__stack">
            {vars.length ? (
              <ul className="spool__vars">
                {vars.map((v) => (
                  <li key={v.name}>
                    <code>{v.line}</code>
                    <span className="spool__ref">
                      {v.name} → #{v.ref}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="lab-note">No variables yet.</p>
            )}
          </Panel>

          <Panel title="Heap" className="spool__heap">
            <div className="spool__pool">
              <span className="lab-label">String pool</span>
              <div className="spool__objs">{pool.length ? pool.map(renderObject) : <span className="lab-note">empty</span>}</div>
            </div>
            <div className="spool__objs">{loose.map(renderObject)}</div>
          </Panel>
        </div>
      </LayoutGroup>

      <div className="lab-row">
        <Btn variant="ghost" onClick={reset}>
          ↺ Reset
        </Btn>
      </div>
    </div>
  );
}
