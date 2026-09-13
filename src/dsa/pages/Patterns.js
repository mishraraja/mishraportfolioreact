import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PATTERNS, getPattern } from "../data/patterns";
import { problemsForPattern } from "../data";
import { useProgress } from "../progress";
import { CodeBlock } from "../components/CodeBlock";
import { useTitle } from "../useTitle";
import { sfx } from "../../lib/sound";
import "./Learn.css";

/** The fastest way into a problem: the words in its statement. */
const DECODER = [
  ["A sorted array, and a pair or triplet to find", "two-pointers"],
  ["“Longest / shortest substring or subarray that…”", "sliding-window"],
  ["“Have I seen this?”, counting, grouping by a key", "hashing"],
  ["Sorted or rotated input, or an O(log n) requirement", "binary-search"],
  ["“Top k”, “k-th largest”, a running median", "heap"],
  ["“All combinations / permutations / paths”", "backtracking"],
  ["Prerequisites, dependencies, a build order", "topo-sort"],
  ["Connected groups that merge as edges arrive", "union-find"],
  ["A grid: islands, flooding, what can reach what", "graph-traversal"],
  ["“Level by level” in a tree", "tree-bfs"],
  ["“How many ways” or “min cost” with a choice at each step", "dp-1d"],
  ["Two strings compared, or paths through a grid", "dp-2d"],
  ["Matching brackets, “next greater element”", "stack"],
  ["Meetings, bookings, overlapping ranges", "intervals"],
  ["A linked-list cycle, middle, or n-th from the end", "fast-slow"],
  ["Prefix search, autocomplete, many words at once", "trie"],
];

export function Patterns() {
  useTitle("Pattern Playbook — DSA Arcade");
  const { hash } = useLocation();
  const { statusOf } = useProgress();
  const [open, setOpen] = useState(() => (hash ? hash.slice(1) : null));

  useEffect(() => {
    if (!hash) return undefined;
    const id = hash.slice(1);
    setOpen(id);
    const timer = setTimeout(() => {
      document.getElementById("pattern-" + id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 90);
    return () => clearTimeout(timer);
  }, [hash]);

  return (
    <div className="learn">
      <header className="learn__head">
        <span className="arcade-eyebrow">🧠 Pattern Playbook</span>
        <h1 className="arcade-title">Stop memorising problems. Recognise patterns.</h1>
        <p className="arcade-lede">
          There are thousands of interview questions but only a couple of dozen ideas behind them. Learn to spot the signals in a problem statement, and you'll
          know which tool to reach for before you've written a line.
        </p>
      </header>

      <section className="arcade-section" aria-labelledby="decoder-title">
        <h2 id="decoder-title" className="arcade-h2">
          The signal decoder
        </h2>
        <p className="arcade-section__sub">Read the problem, find the phrase, reach for the pattern.</p>
        <div className="ltable-wrap">
          <table className="ltable">
            <thead>
              <tr>
                <th scope="col">If the problem says…</th>
                <th scope="col">Reach for</th>
              </tr>
            </thead>
            <tbody>
              {DECODER.map(([signal, id]) => {
                const p = getPattern(id);
                return (
                  <tr key={signal}>
                    <td>{signal}</td>
                    <td>
                      <Link to={"#" + id} className="achip">
                        {p.emoji} {p.name}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="arcade-section" aria-labelledby="patterns-title">
        <h2 id="patterns-title" className="arcade-h2">
          All {PATTERNS.length} patterns
        </h2>
        <p className="arcade-section__sub">Open one for its signals, the core idea, a Java template, the classic mistakes and the problems that use it.</p>

        <div className="patterns">
          {PATTERNS.map((p) => {
            const problems = problemsForPattern(p.id);
            const done = problems.filter((x) => statusOf(x.slug) === "mastered").length;
            const isOpen = open === p.id;
            return (
              <section key={p.id} id={"pattern-" + p.id} className={"pattern" + (isOpen ? " is-open" : "")}>
                <button
                  type="button"
                  className="pattern__head"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setOpen(isOpen ? null : p.id);
                    sfx.click();
                  }}
                >
                  <span className="pattern__emoji" aria-hidden="true">
                    {p.emoji}
                  </span>
                  <span className="pattern__names">
                    <span className="pattern__name">{p.name}</span>
                    <span className="pattern__tagline">{p.tagline}</span>
                  </span>
                  <span className="pattern__count">
                    {done}/{problems.length} mastered
                  </span>
                  <span className="pattern__chev" aria-hidden="true">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen ? (
                  <div className="pattern__body">
                    <div className="pattern__cols">
                      <div className="pattern__notes">
                        <h3>Spot it when you see…</h3>
                        <ul className="ticks">
                          {p.signals.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                        <h3>The idea</h3>
                        <p>{p.idea}</p>
                        <h3>Watch out for</h3>
                        <ul className="warns">
                          {p.pitfalls.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3>Template</h3>
                        <CodeBlock java={p.template} />
                      </div>
                    </div>
                    <h3>Practise it</h3>
                    <div className="pattern__problems">
                      {problems.map((x) => (
                        <Link key={x.slug} to={"/dsa/" + x.slug} className={"achip" + (statusOf(x.slug) === "mastered" ? " achip--accent" : "")}>
                          {x.emoji} {x.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
