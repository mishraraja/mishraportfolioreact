import { useState } from "react";
import { useTitle } from "../useTitle";
import { rich } from "../engine/views/format";
import { sfx } from "../../lib/sound";
import "./Learn.css";

const PHASES = [
  {
    time: "0–5 min",
    title: "Understand",
    icon: "🔍",
    do: [
      "Restate the problem in your own words.",
      "Ask how big the input can get — it tells you the target complexity.",
      "Clarify the edges: duplicates? negatives? empty input? what to return when there's no answer?",
    ],
    say: "“Let me check I've got this: given an array and a target, I return the two indices that add up to it. Can the array be empty, and can values repeat?”",
  },
  {
    time: "5–10 min",
    title: "Examples",
    icon: "✏️",
    do: [
      "Work one small example by hand, out loud.",
      "Invent an edge case the interviewer didn't mention.",
      "Write the expected outputs down — they become your tests later.",
    ],
    say: "“For [2, 7, 11, 15] and 9 I'd return [0, 1]. What should happen with [3, 3] and 6?”",
  },
  {
    time: "10–15 min",
    title: "Brute force",
    icon: "🔨",
    do: [
      "Say the obvious solution, even if it's slow.",
      "Give its time and space complexity.",
      "Don't code it — it's a stepping stone that proves you understand the problem.",
    ],
    say: "“The straightforward way is to check every pair — O(n²) time, O(1) space. Let's see if we can do better.”",
  },
  {
    time: "15–20 min",
    title: "Optimise",
    icon: "🧠",
    do: [
      "Find the work the brute force keeps repeating.",
      "Ask which data structure answers that repeated question quickly.",
      "Name the pattern, and agree on the approach before you type.",
    ],
    say: "“The slow part is searching for each number's partner. A hash map of what I've already seen answers that in O(1), so it becomes one pass.”",
  },
  {
    time: "20–35 min",
    title: "Code",
    icon: "⌨️",
    do: [
      "Narrate as you write — silence reads as being stuck.",
      "Use clear names and small helper functions.",
      "If a detail slows you down, leave a note and keep momentum.",
    ],
    say: "“I'll keep a map from value to index. For each number I work out what I need, check the map, then store the current number.”",
  },
  {
    time: "35–42 min",
    title: "Test",
    icon: "🧪",
    do: [
      "Dry-run your example line by line, tracking every variable.",
      "Run the edge cases you wrote down earlier.",
      "Fix bugs calmly. Finding your own bug is a strong signal, not a weak one.",
    ],
    say: "“Tracing [3, 3] with target 6: i = 0 needs 3, the map is empty, so store 3 → 0. i = 1 needs 3, found at 0. Returns [0, 1].”",
  },
  {
    time: "42–45 min",
    title: "Wrap up",
    icon: "🎁",
    do: [
      "State the final time and space complexity.",
      "Mention trade-offs and what you'd improve with more time.",
      "Ask a thoughtful question back.",
    ],
    say: "“That's O(n) time and O(n) space. If memory were tight, sorting plus two pointers would be O(n log n) time with O(1) extra space.”",
  },
];

const STUCK = [
  "Solve it slowly first. A correct brute force is a foothold, not a failure.",
  "Shrink it: work n = 1, 2, 3 by hand and look for what repeats.",
  "Draw it. Arrays as boxes, pointers as arrows, trees as trees.",
  "Name the repeated work, then ask which structure answers it in O(1) or O(log n).",
  "Check the signals: sorted? contiguous? prerequisites? top k? Each one points at a pattern.",
  "Think out loud and ask for a nudge. A hint used well beats ten silent minutes.",
];

const EDGES = [
  { title: "Arrays", emoji: "🧮", items: ["Empty array, a single element", "Every element the same, duplicates", "Negative numbers and zero", "Already sorted, reverse sorted", "Overflow on sums and products"] },
  { title: "Strings", emoji: "🔤", items: ["Empty string, one character", "Upper vs lower case, spaces, punctuation", "Every character the same", "Characters beyond a–z — does a 26-slot array still work?"] },
  { title: "Linked lists", emoji: "🔗", items: ["An empty list (head is null)", "One node, two nodes", "Removing the head or the tail", "A cycle"] },
  { title: "Trees", emoji: "🌳", items: ["A null root", "Only left children — a tree that's really a list", "Duplicate values", "Very deep trees and recursion limits"] },
  { title: "Graphs & grids", emoji: "🕸️", items: ["Disconnected pieces", "Cycles and self-loops", "A 1 × 1 grid, a single row or column", "Start equals target"] },
  { title: "Intervals", emoji: "📅", items: ["Touching endpoints: [1, 2] and [2, 3]", "One interval inside another", "Unsorted input", "Identical intervals"] },
];

const GOTCHAS = {
  Java: [
    "`==` on Integer objects compares references. It works up to 127, then silently fails — use `.equals()`.",
    "`(lo + hi) / 2` can overflow. Write `lo + (hi - lo) / 2`.",
    "Comparators like `(a, b) -> a - b` overflow on extreme values. Use `Integer.compare(a, b)`.",
    "`Arrays.asList(...)` is fixed-size, so `add` throws. Wrap it in `new ArrayList<>(...)`.",
    "Strings are immutable: build them in loops with `StringBuilder`, not `+=`.",
    "`Math.abs(Integer.MIN_VALUE)` is still negative.",
    "Use `ArrayDeque` for stacks and queues, not `Stack` or `LinkedList`.",
    "`map.merge(key, 1, Integer::sum)` counts in one line.",
  ],
  Python: [
    "`[[0] * n] * m` makes m references to the same row. Use `[[0] * n for _ in range(m)]`.",
    "`heapq` is a min-heap only — push negated values to fake a max-heap.",
    "`list.pop(0)` is O(n). Use `collections.deque` for queues.",
    "The default recursion limit is about 1000 — deep DFS may need an explicit stack.",
    "`//` rounds toward negative infinity: `-7 // 2 == -4`.",
    "Mutable default arguments like `def f(seen=[])` are shared between calls.",
    "Integers never overflow, so 32-bit tricks need an explicit `& 0xFFFFFFFF` mask.",
  ],
};

const SAY_THIS = [
  ["“I don't know this one.”", "“I haven't seen this exact problem. Let me start with a brute force and improve it.”"],
  ["Coding in silence", "“I'm writing a helper that finds the next valid index, so the main loop stays simple.”"],
  ["“Done.”", "“Let me trace an example through it before I call it done.”"],
  ["“It's O(n).”", "“It's O(n) time because each element is pushed and popped at most once, plus O(n) space for the stack.”"],
  ["Jumping straight into code", "“Before I code: I'll sort by start time and merge as I go. Does that sound reasonable?”"],
];

export function Playbook() {
  useTitle("Interview Playbook — DSA Arcade");
  const [phase, setPhase] = useState(0);
  const current = PHASES[phase];

  return (
    <div className="learn">
      <header className="learn__head">
        <span className="arcade-eyebrow">🎤 Interview Playbook</span>
        <h1 className="arcade-title">Solving it is half the interview. This is the other half.</h1>
        <p className="arcade-lede">
          Interviewers score how you think, not just what you submit. Here's how to use 45 minutes, what to say out loud, and the checklists that catch bugs
          before they catch you.
        </p>
      </header>

      <section className="arcade-section" aria-labelledby="plan-title">
        <h2 id="plan-title" className="arcade-h2">
          The 45-minute game plan
        </h2>
        <p className="arcade-section__sub">Click through the phases.</p>
        <div className="phases" role="tablist" aria-label="Interview phases">
          {PHASES.map((p, i) => (
            <button
              key={p.title}
              type="button"
              role="tab"
              aria-selected={phase === i}
              className={"phase" + (phase === i ? " is-on" : "") + (i < phase ? " is-past" : "")}
              onClick={() => {
                setPhase(i);
                sfx.click();
              }}
            >
              <span className="phase__icon" aria-hidden="true">
                {p.icon}
              </span>
              <span className="phase__title">{p.title}</span>
              <span className="phase__time">{p.time}</span>
            </button>
          ))}
        </div>
        <div className="acard phase-detail" role="tabpanel">
          <div>
            <h3>
              {current.icon} {current.title} <span className="phase__time">{current.time}</span>
            </h3>
            <ul className="ticks">
              {current.do.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <blockquote className="phase-detail__say">
            <span className="arcade-eyebrow">Say something like</span>
            <p>{current.say}</p>
          </blockquote>
          <div className="phase-detail__nav">
            <button type="button" className="achip" onClick={() => setPhase((p) => Math.max(0, p - 1))} disabled={phase === 0}>
              ← Previous phase
            </button>
            <button type="button" className="achip achip--on" onClick={() => setPhase((p) => Math.min(PHASES.length - 1, p + 1))} disabled={phase === PHASES.length - 1}>
              Next phase →
            </button>
          </div>
        </div>
      </section>

      <section className="arcade-section" aria-labelledby="stuck-title">
        <h2 id="stuck-title" className="arcade-h2">
          When you're stuck
        </h2>
        <p className="arcade-section__sub">Climb this ladder one rung at a time.</p>
        <ol className="ladder">
          {STUCK.map((s, i) => (
            <li key={s}>
              <span className="ladder__num">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </section>

      <section className="arcade-section" aria-labelledby="edges-title">
        <h2 id="edges-title" className="arcade-h2">
          Edge-case checklists
        </h2>
        <p className="arcade-section__sub">Run through the list for your input type before you say “done”.</p>
        <div className="edges">
          {EDGES.map((e) => (
            <section key={e.title} className="acard">
              <h3>
                {e.emoji} {e.title}
              </h3>
              <ul className="ticks ticks--small">
                {e.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section className="arcade-section" aria-labelledby="gotchas-title">
        <h2 id="gotchas-title" className="arcade-h2">
          Language gotchas
        </h2>
        <p className="arcade-section__sub">The bugs that pass the sample tests and fail the hidden ones.</p>
        <div className="gotchas">
          {Object.entries(GOTCHAS).map(([lang, items]) => (
            <section key={lang} className="acard">
              <h3>{lang}</h3>
              <ul className="warns">
                {items.map((item) => (
                  <li key={item}>{rich(item)}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section className="arcade-section" aria-labelledby="say-title">
        <h2 id="say-title" className="arcade-h2">
          Say this, not that
        </h2>
        <div className="saythis">
          {SAY_THIS.map(([not, instead]) => (
            <div key={not} className="saythis__row">
              <span className="saythis__not">
                <span aria-hidden="true">✗</span> {not}
              </span>
              <span className="saythis__yes">
                <span aria-hidden="true">✓</span> {instead}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
