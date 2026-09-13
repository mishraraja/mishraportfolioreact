import { useMemo, useState } from "react";
import { useTitle } from "../useTitle";
import "./Learn.css";

/** A comfortable rule of thumb for simple operations per second in a judged language. */
const OPS_PER_SECOND = 1e8;
const MAX_LOG = 20;
const TICKS = [0, 4, 8, 12, 16, 20];
const PRESETS = [10, 20, 500, 10000, 100000, 1000000, 100000000];

const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹", "-": "⁻" };
const sup = (n) => String(n).split("").map((d) => SUP[d]).join("");
const pow10 = (e) => (e === 0 ? "1" : "10" + sup(e));

function log10Factorial(n) {
  if (n < 2) return 0;
  if (n <= 5000) {
    let s = 0;
    for (let k = 2; k <= n; k += 1) s += Math.log10(k);
    return s;
  }
  return (n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n)) / Math.LN10;
}

const log2 = (n) => Math.log2(Math.max(n, 2));

/** Each class returns log10(operations) so nothing ever overflows. */
const CLASSES = [
  { id: "1", label: "O(1)", log: () => 0, example: "A hash-map lookup" },
  { id: "logn", label: "O(log n)", log: (n) => Math.log10(log2(n)), example: "Binary search" },
  { id: "n", label: "O(n)", log: (n) => Math.log10(n), example: "One pass, two pointers, a sliding window" },
  { id: "nlogn", label: "O(n log n)", log: (n) => Math.log10(n) + Math.log10(log2(n)), example: "Sorting, or n heap operations" },
  { id: "n2", label: "O(n²)", log: (n) => 2 * Math.log10(n), example: "Every pair: two nested loops" },
  { id: "n3", label: "O(n³)", log: (n) => 3 * Math.log10(n), example: "Every triple, interval DP" },
  { id: "2n", label: "O(2ⁿ)", log: (n) => n * Math.log10(2), example: "Every subset" },
  { id: "nfact", label: "O(n!)", log: (n) => log10Factorial(n), example: "Every possible ordering" },
];

function formatOps(L) {
  if (!Number.isFinite(L)) return "∞";
  if (L < 6) return Math.round(10 ** L).toLocaleString("en-US");
  const words = [
    [15, "quadrillion"],
    [12, "trillion"],
    [9, "billion"],
    [6, "million"],
  ];
  if (L < 18) {
    const [e, word] = words.find(([exp]) => L >= exp);
    const v = 10 ** (L - e);
    return (v < 10 ? v.toFixed(1) : Math.round(v)) + " " + word;
  }
  return pow10(Math.floor(L));
}

function humanTime(L) {
  const e = L - Math.log10(OPS_PER_SECOND);
  if (e > 17.64) return "longer than the universe has existed";
  const s = 10 ** e;
  if (s < 0.001) return "instant";
  if (s < 1) return Math.round(s * 1000) + " ms";
  if (s < 60) return (s < 10 ? s.toFixed(1) : Math.round(s)) + " seconds";
  if (s < 3600) return Math.round(s / 60) + " minutes";
  if (s < 86400) return Math.round(s / 3600) + " hours";
  if (s < 31557600) return Math.round(s / 86400) + " days";
  const years = s / 31557600;
  return years < 1e6 ? Math.round(years).toLocaleString("en-US") + " years" : "about " + pow10(Math.floor(Math.log10(years))) + " years";
}

function verdictFor(L) {
  const seconds = 10 ** (L - Math.log10(OPS_PER_SECOND));
  if (seconds <= 1) return { id: "ok", icon: "✓", label: "Fits" };
  if (seconds <= 10) return { id: "slow", icon: "!", label: "Too slow" };
  return { id: "tle", icon: "✗", label: "Time limit exceeded" };
}

/** The largest n that fits in about one second, found by bisection on log10(n). */
function largestFittingN(cls) {
  const budget = Math.log10(OPS_PER_SECOND);
  if (cls.log(1e18) <= budget) return "any n";
  let lo = 0;
  let hi = 18;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (cls.log(10 ** mid) <= budget) lo = mid;
    else hi = mid;
  }
  const n = Math.floor(10 ** lo);
  return n >= 1e6 ? "≈ " + formatOps(Math.log10(n)) : "≈ " + n.toLocaleString("en-US");
}

const CONSTRAINTS = [
  ["n ≤ 12", "O(n!)", "Try every ordering: permutations, brute force"],
  ["n ≤ 25", "O(2ⁿ)", "Every subset: backtracking, bitmask DP"],
  ["n ≤ 500", "O(n³)", "Three nested loops, interval DP, Floyd–Warshall"],
  ["n ≤ 5,000", "O(n²)", "Every pair: nested loops, 2-D DP"],
  ["n ≤ 10⁶", "O(n log n)", "Sorting, heaps, binary search inside a loop"],
  ["n ≤ 10⁸", "O(n)", "One pass: hashing, two pointers, sliding window"],
  ["n > 10⁸", "O(log n) or O(1)", "Binary search on the answer, maths"],
];

const STRUCTURES = [
  ["Array / ArrayList", "ArrayList", "O(1)", "O(n)", "O(1)* at end", "O(n)", "*amortised; inserting in the middle shifts"],
  ["Hash map / set", "HashMap, HashSet", "—", "O(1)*", "O(1)*", "O(1)*", "*average; no ordering"],
  ["Balanced BST", "TreeMap, TreeSet", "—", "O(log n)", "O(log n)", "O(log n)", "Sorted; floor, ceiling, ranges"],
  ["Heap", "PriorityQueue", "peek O(1)", "O(n)", "O(log n)", "poll O(log n)", "Min-heap by default"],
  ["Stack / queue / deque", "ArrayDeque", "ends O(1)", "O(n)", "O(1)", "O(1)", "Prefer it over Stack and LinkedList"],
  ["Linked list", "LinkedList", "O(n)", "O(n)", "O(1) at a node", "O(1) at a node", "Finding the node is the O(n) part"],
  ["Trie", "custom", "—", "O(L)", "O(L)", "O(L)", "L = word length"],
  ["Union-Find", "custom", "—", "find ≈ O(1)", "union ≈ O(1)", "—", "With path compression"],
];

function OpsChart({ n }) {
  const [active, setActive] = useState(null);
  const rows = useMemo(() => CLASSES.map((c) => ({ ...c, L: c.log(n), verdict: verdictFor(c.log(n)) })), [n]);
  const at = (L) => (Math.min(Math.max(L, 0), MAX_LOG) / MAX_LOG) * 100;

  return (
    <div className="bigo-chart" role="group" aria-label={`Operations each complexity needs when n is ${n.toLocaleString("en-US")}`}>
      <div className="bigo-row bigo-row--axis" aria-hidden="true">
        <span />
        <span className="bigo-axis">
          {TICKS.map((t) => (
            <span key={t} style={{ left: at(t) + "%" }}>
              {pow10(t)}
            </span>
          ))}
        </span>
        <span />
      </div>

      {rows.map((r) => {
        const off = r.L > MAX_LOG;
        const width = at(r.L);
        return (
          <div
            key={r.id}
            className={"bigo-row" + (active === r.id ? " is-active" : "")}
            tabIndex={0}
            onPointerEnter={() => setActive(r.id)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(r.id)}
            onBlur={() => setActive(null)}
            aria-label={`${r.label}: ${formatOps(r.L)} operations, ${humanTime(r.L)}. ${r.verdict.label}.`}
          >
            <span className="bigo-row__label">{r.label}</span>
            <span className="bigo-row__track">
              {TICKS.map((t) => (
                <span key={t} className="bigo-row__grid" style={{ left: at(t) + "%" }} aria-hidden="true" />
              ))}
              <span className="bigo-row__limit" style={{ left: at(Math.log10(OPS_PER_SECOND)) + "%" }} aria-hidden="true" />
              <span className="bigo-row__bar" style={{ width: `max(${width}%, 4px)` }} />
              <span className="bigo-row__value" style={{ left: `min(${width}%, calc(100% - 8.5rem))` }}>
                {off ? "off the chart →" : formatOps(r.L)}
              </span>
              {active === r.id ? (
                <span className="bigo-tip" role="tooltip" style={{ left: `min(${width}%, calc(100% - 13rem))` }}>
                  <strong>{humanTime(r.L)}</strong>
                  <span>{formatOps(r.L)} operations</span>
                  <span className="bigo-tip__muted">{r.example}</span>
                </span>
              ) : null}
            </span>
            <span className={"verdict verdict--" + r.verdict.id}>
              <span aria-hidden="true">{r.verdict.icon}</span> {r.verdict.label}
            </span>
          </div>
        );
      })}
      <p className="bigo-chart__note">
        The gold line marks about one second (≈ 10⁸ simple operations). Hover or focus a row for the time it would take.
      </p>
    </div>
  );
}

export function BigO() {
  useTitle("Big-O Lab — DSA Arcade");
  const [exp, setExp] = useState(5);
  const n = Math.max(1, Math.round(10 ** exp));

  return (
    <div className="learn">
      <header className="learn__head">
        <span className="arcade-eyebrow">⚡ Big-O Lab</span>
        <h1 className="arcade-title">Feel the difference between O(n) and O(n²).</h1>
        <p className="arcade-lede">
          Complexity isn't an exam formality — it's whether your solution finishes before the judge gives up. Drag the input size and watch what each growth
          rate costs.
        </p>
      </header>

      <section className="acard bigo-lab" aria-labelledby="lab-title">
        <div className="bigo-lab__controls">
          <label className="bigo-lab__slider">
            <span id="lab-title" className="bigo-lab__n">
              n = <strong>{n.toLocaleString("en-US")}</strong>
            </span>
            <input type="range" min={0} max={9} step={0.05} value={exp} onChange={(e) => setExp(Number(e.target.value))} aria-label="Input size n (logarithmic)" />
          </label>
          <div className="bigo-lab__presets" role="group" aria-label="Preset sizes">
            {PRESETS.map((p) => (
              <button key={p} type="button" className={"achip achip--sm" + (n === p ? " achip--on" : "")} onClick={() => setExp(Math.log10(p))}>
                {p.toLocaleString("en-US")}
              </button>
            ))}
          </div>
        </div>
        <OpsChart n={n} />

        <details className="bigo-table">
          <summary>Show these numbers as a table</summary>
          <div className="ltable-wrap">
            <table className="ltable">
              <thead>
                <tr>
                  <th scope="col">Complexity</th>
                  <th scope="col">Operations at n = {n.toLocaleString("en-US")}</th>
                  <th scope="col">Time at 10⁸ ops/s</th>
                  <th scope="col">Largest n in ~1 s</th>
                </tr>
              </thead>
              <tbody>
                {CLASSES.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.label}</td>
                    <td className="mono">{formatOps(c.log(n))}</td>
                    <td>{humanTime(c.log(n))}</td>
                    <td className="mono">{largestFittingN(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="arcade-section" aria-labelledby="constraints-title">
        <h2 id="constraints-title" className="arcade-h2">
          Read the constraints, know the target
        </h2>
        <p className="arcade-section__sub">The input limits in a problem statement quietly tell you which complexity the intended solution has.</p>
        <div className="ltable-wrap">
          <table className="ltable">
            <thead>
              <tr>
                <th scope="col">If the constraint is</th>
                <th scope="col">Aim for</th>
                <th scope="col">Usually means</th>
              </tr>
            </thead>
            <tbody>
              {CONSTRAINTS.map(([limit, target, means]) => (
                <tr key={limit}>
                  <td className="mono">{limit}</td>
                  <td className="mono">
                    <strong>{target}</strong>
                  </td>
                  <td>{means}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="arcade-section" aria-labelledby="structures-title">
        <h2 id="structures-title" className="arcade-h2">
          Data structure cheat sheet
        </h2>
        <p className="arcade-section__sub">What each operation costs — with the Java class you'd actually use.</p>
        <div className="ltable-wrap">
          <table className="ltable ltable--dense">
            <thead>
              <tr>
                <th scope="col">Structure</th>
                <th scope="col">In Java</th>
                <th scope="col">Access</th>
                <th scope="col">Search</th>
                <th scope="col">Insert</th>
                <th scope="col">Delete</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {STRUCTURES.map((row) => (
                <tr key={row[0]}>
                  <td>
                    <strong>{row[0]}</strong>
                  </td>
                  <td className="mono">{row[1]}</td>
                  <td className="mono">{row[2]}</td>
                  <td className="mono">{row[3]}</td>
                  <td className="mono">{row[4]}</td>
                  <td className="mono">{row[5]}</td>
                  <td>{row[6]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
