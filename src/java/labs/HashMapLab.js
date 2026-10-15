import { useState } from "react";
import { motion } from "framer-motion";
import { Btn, Panel, Say } from "./kit";
import { bucketIndex, javaHash, spread } from "./hash";
import { sfx } from "../../lib/sound";
import "./HashMapLab.css";

const START_CAPACITY = 4;
const LOAD_FACTOR = 0.75;
const MAX_ENTRIES = 12;
const QUICK_KEYS = ["pen", "ink", "cup", "Aa", "BB", "java", "spring", "kafka"];
const INTRO =
  'Put a few keys in. This table starts with **4 buckets** (a real HashMap starts with 16) so you can watch it grow. Psst: "Aa" and "BB" share a hashCode.';

function freshMap() {
  return { capacity: START_CAPACITY, table: Array.from({ length: START_CAPACITY }, () => []), size: 0 };
}

/** Moves every entry to its bucket in a bigger table, keeping chain order — as Java 8 does. */
function rehash(table, capacity) {
  const next = Array.from({ length: capacity }, () => []);
  table.forEach((bucket) => bucket.forEach((entry) => next[bucketIndex(entry.hash, capacity)].push(entry)));
  return next;
}

/** The nodes a lookup touches: compare the hash first, then equals(). */
function walkOf(chain, hash, key) {
  const walk = [];
  for (const entry of chain) {
    const sameHash = entry.hash === hash;
    const equal = sameHash && entry.key === key;
    walk.push({ key: entry.key, sameHash, equal });
    if (equal) break;
  }
  return walk;
}

export function HashMapLab({ complete }) {
  const [map, setMap] = useState(freshMap);
  const [draft, setDraft] = useState("");
  const [counter, setCounter] = useState(1);
  const [focus, setFocus] = useState(null);
  const [calc, setCalc] = useState(null);
  const [say, setSay] = useState({ text: INTRO });

  const threshold = map.capacity * LOAD_FACTOR;

  function describe(key) {
    const hash = javaHash(key);
    return { key, hash, spread: spread(hash), mask: map.capacity - 1, index: bucketIndex(hash, map.capacity), movedTo: null };
  }

  function put(raw) {
    const key = raw.trim();
    if (!key) {
      setSay({ text: "Type a key first.", tone: "bad" });
      sfx.error();
      return;
    }
    const c = describe(key);
    const chain = map.table[c.index];
    const existing = chain.find((e) => e.hash === c.hash && e.key === key);
    const value = counter;

    if (existing) {
      const table = map.table.map((b, i) => (i === c.index ? b.map((e) => (e === existing ? { ...e, value } : e)) : b));
      setCounter(counter + 1);
      setMap({ ...map, table });
      setCalc(c);
      setFocus({ key, index: c.index, walk: walkOf(chain, c.hash, key) });
      setSay({
        text: '"' + key + '" is already in bucket ' + c.index + ": the hash matched and equals() said yes, so the value was **replaced** (" + existing.value + " → " + value + "). size stays " + map.size + ".",
        tone: "good",
      });
      complete("overwrite");
      sfx.success();
      return;
    }

    if (map.size >= MAX_ENTRIES) {
      setSay({ text: "That's " + MAX_ENTRIES + " entries — plenty for this demo. Reset to start again.", tone: "bad" });
      sfx.error();
      return;
    }

    let table = map.table.map((b, i) => (i === c.index ? [...b, { key, value, hash: c.hash }] : b));
    let capacity = map.capacity;
    const size = map.size + 1;
    const parts = [];
    let tone;

    if (chain.length) {
      const twin = chain.find((e) => e.hash === c.hash);
      parts.push(
        twin
          ? '"' + key + '" and "' + twin.key + '" have the **same hashCode** (' + c.hash + ") — a true collision — so they share bucket " + c.index + " as a chain."
          : "Bucket " + c.index + ' already holds "' + chain[0].key + '". Different hash codes, same index after masking, so "' + key + '" joins the chain.'
      );
      complete("collision");
    } else {
      parts.push('"' + key + '" = ' + value + " goes into empty bucket " + c.index + ".");
    }

    if (size > threshold) {
      capacity *= 2;
      table = rehash(table, capacity);
      parts.push("size " + size + " passed the threshold " + threshold + " (" + map.capacity + " × 0.75), so the table **doubled to " + capacity + " buckets** and every entry moved to its new index.");
      complete("resize");
      tone = "good";
    }

    const index = bucketIndex(c.hash, capacity);
    setCounter(counter + 1);
    setMap({ capacity, table, size });
    setCalc(capacity !== map.capacity ? { ...c, movedTo: index, newCapacity: capacity } : c);
    setFocus({ key, index, walk: [] });
    setDraft("");
    setSay({ text: parts.join(" "), tone });
    sfx.click();
  }

  function get(raw) {
    const key = raw.trim();
    if (!key) {
      setSay({ text: "Type the key you want to look up.", tone: "bad" });
      sfx.error();
      return;
    }
    const c = describe(key);
    const chain = map.table[c.index];
    const walk = walkOf(chain, c.hash, key);
    const hit = walk.length && walk[walk.length - 1].equal ? chain[walk.length - 1] : null;
    setCalc(c);
    setFocus({ key, index: c.index, walk });

    if (hit) {
      setSay({
        text: 'get("' + key + '") → **' + hit.value + "**. Bucket " + c.index + ", " + walk.length + " node" + (walk.length === 1 ? "" : "s") + " checked — hash first, then equals().",
        tone: "good",
      });
      complete("get");
      sfx.success();
    } else {
      setSay({
        text:
          'get("' + key + '") → **null**. ' +
          (walk.length ? "Walked all " + walk.length + " node(s) in bucket " + c.index + " and none was equal." : "Bucket " + c.index + " is empty, so the answer comes straight back."),
      });
      sfx.click();
    }
  }

  function reset() {
    setMap(freshMap());
    setCounter(1);
    setFocus(null);
    setCalc(null);
    setDraft("");
    setSay({ text: INTRO });
    sfx.close();
  }

  const longest = Math.max(...map.table.map((b) => b.length));

  return (
    <div className="lab hmap">
      <div className="lab-grid">
        <Panel title="1 · put and get">
          <form
            className="lab-row"
            onSubmit={(e) => {
              e.preventDefault();
              put(draft);
            }}
          >
            <label className="lab-label" htmlFor="hmap-key">
              key
            </label>
            <input id="hmap-key" className="lab-input" value={draft} maxLength={12} autoComplete="off" placeholder="e.g. pen" onChange={(e) => setDraft(e.target.value)} />
            <Btn variant="primary" type="submit">
              put
            </Btn>
            <Btn onClick={() => get(draft)}>get</Btn>
          </form>
          <div className="lab-row">
            <span className="lab-label">quick put</span>
            {QUICK_KEYS.map((k) => (
              <Btn key={k} onClick={() => put(k)} aria-label={"put " + k}>
                {k}
              </Btn>
            ))}
          </div>
        </Panel>

        <Panel title="2 · How the bucket is chosen">
          {calc ? (
            <dl className="lab-kv">
              <div>
                <dt>"{calc.key}".hashCode()</dt>
                <dd>{calc.hash}</dd>
              </div>
              <div>
                <dt>h ^ (h &gt;&gt;&gt; 16)</dt>
                <dd>{calc.spread}</dd>
              </div>
              <div>
                <dt>&amp; (capacity − 1) = &amp; {calc.mask}</dt>
                <dd>bucket {calc.index}</dd>
              </div>
              {calc.movedTo !== null ? (
                <div>
                  <dt>after the resize</dt>
                  <dd>
                    bucket {calc.movedTo} of {calc.newCapacity}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="lab-note">Put or get a key to see the arithmetic.</p>
          )}
          <div className="hmap__load">
            <span className="lab-label">
              size {map.size} · resize when size &gt; {threshold}
            </span>
            <span className="meter" style={{ "--meter": map.size >= threshold ? "var(--color-accent-2)" : "var(--color-accent)" }} aria-hidden="true">
              <span className="meter__fill" style={{ width: Math.min(100, (map.size / threshold) * 100) + "%" }} />
            </span>
          </div>
        </Panel>
      </div>

      <Say tone={say.tone}>{say.text}</Say>

      <Panel title={"The table · " + map.capacity + " buckets"}>
        <div className="hmap__buckets">
          {map.table.map((bucket, i) => {
            const on = focus && focus.index === i;
            return (
              <div key={i} className={"hmap__bucket" + (on ? " is-focus" : "")}>
                <span className="hmap__index">[{i}]</span>
                <div className="hmap__chain">
                  {bucket.length === 0 ? (
                    <span className="hmap__null">null</span>
                  ) : (
                    bucket.map((e, n) => {
                      const step = on ? focus.walk[n] : null;
                      let cls = on && e.key === focus.key ? " is-active" : "";
                      if (step) cls = step.equal ? " is-good" : step.sameHash ? " is-warn" : " is-bad";
                      return (
                        <span key={e.key} className="hmap__link">
                          {n > 0 ? (
                            <span className="hmap__arrow" aria-hidden="true">
                              →
                            </span>
                          ) : null}
                          <motion.span layout layoutId={"hmap-" + e.key} className={"lab-chip" + cls}>
                            {e.key}={e.value}
                          </motion.span>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {longest >= 3 ? (
          <p className="lab-note">
            A real HashMap turns a chain of <strong>8 or more nodes</strong> into a red-black tree (once the table has 64+ buckets), so even a terrible hash costs O(log n) instead of O(n).
          </p>
        ) : null}
        <div className="lab-row">
          <Btn variant="ghost" onClick={reset}>
            ↺ Reset
          </Btn>
        </div>
      </Panel>
    </div>
  );
}
