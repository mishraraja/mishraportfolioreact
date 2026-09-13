import { useMemo, useState } from "react";
import { sfx } from "../../lib/sound";
import { daysUntilDue } from "../progress";

/** Deterministic shuffle, so the right answer isn't always first but the order never jumps around. */
function seededOrder(length, seedText) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const order = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * The mastery check. One question about the core idea — answering it marks
 * the problem as mastered, and later answers count as spaced reviews.
 */
export function Quiz({ problem, record, due, onSolved }) {
  const { q, options, answer, why } = problem.quiz;
  const order = useMemo(() => seededOrder(options.length, problem.slug), [options.length, problem.slug]);
  const [wrong, setWrong] = useState(() => new Set());
  const [solved, setSolved] = useState(false);
  const [outcome, setOutcome] = useState(null);

  function pick(i) {
    if (solved || wrong.has(i)) return;
    if (i === answer) {
      setSolved(true);
      setOutcome(onSolved());
      return;
    }
    sfx.error();
    setWrong((prev) => new Set(prev).add(i));
  }

  let intro = "Answer this to mark the problem as mastered.";
  if (record && record.mastered) {
    intro = due ? "Time for a spaced review — answer again to lock it into long-term memory." : "Already mastered. You can still answer for practice.";
  }

  let result = null;
  if (outcome === "mastered") result = "⭐ Mastered! It's now on your review schedule.";
  else if (outcome === "reviewed") result = "🧠 Review logged. The next review is further away — that's how memory sticks.";
  else if (outcome === "early") result = `✅ Correct. Your next review opens in ${Math.max(1, daysUntilDue(record))} day${daysUntilDue(record) === 1 ? "" : "s"}.`;

  return (
    <div className="quiz">
      <p className="quiz__intro">{intro}</p>
      <p className="quiz__q">{q}</p>
      <div className="quiz__options">
        {order.map((i) => {
          let cls = "";
          if (wrong.has(i)) cls = " is-wrong";
          if (solved && i === answer) cls = " is-right";
          if (solved && i !== answer) cls += " is-muted";
          return (
            <button key={i} type="button" className={"quiz__opt" + cls} onClick={() => pick(i)} disabled={solved || wrong.has(i)}>
              {options[i]}
            </button>
          );
        })}
      </div>
      {!solved && wrong.size ? <p className="quiz__nudge">Not that one — think about what the animation was really doing.</p> : null}
      {solved ? (
        <div className="quiz__why" role="status">
          {result ? <strong>{result}</strong> : null}
          <p>{why}</p>
        </div>
      ) : null}
    </div>
  );
}
