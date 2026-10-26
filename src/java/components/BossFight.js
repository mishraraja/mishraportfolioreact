import { useMemo, useState } from "react";
import { passMark } from "../progress";
import { seededOrder } from "../shuffle";
import { sfx } from "../../lib/sound";
import { recordAnswer } from "../../learning/storage";

/** Five interview questions, one mistake allowed. The end-of-world check. */
export function BossFight({ world, questions, record, onFinish }) {
  const [phase, setPhase] = useState("intro");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(null);

  const orders = useMemo(() => questions.map((q) => seededOrder(q.options.length, q.q)), [questions]);

  const total = questions.length;
  const allowed = total - passMark(total);
  const current = questions[index];
  const answered = index + (picked !== null ? 1 : 0);
  const mistakes = answered - score;

  function start() {
    setPhase("playing");
    setIndex(0);
    setPicked(null);
    setScore(0);
    setResult(null);
    sfx.open();
  }

  function pick(i) {
    if (picked !== null) return;
    recordAnswer("java:" + world.id + ":" + index, world.name + ": " + current.q, "/java/" + world.id, i === current.answer);
    setPicked(i);
    if (i === current.answer) {
      setScore((s) => s + 1);
      sfx.success();
    } else {
      sfx.error();
    }
  }

  function next() {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
      sfx.click();
      return;
    }
    const outcome = onFinish(score, total);
    setResult({ ...outcome, score });
    setPhase("done");
    if (outcome.won) sfx.unlock();
    else sfx.error();
  }

  if (phase === "intro") {
    return (
      <div className="boss acard">
        <span className="boss__monster" aria-hidden="true">
          👾
        </span>
        <div className="boss__intro">
          <h3>The {world.name} boss</h3>
          <p>
            {total} real interview questions. You can afford {allowed === 1 ? "one mistake" : allowed + " mistakes"} — any more and the boss wins.
          </p>
          {record ? (
            <p className="boss__best">
              Best: {record.best}/{total} {record.won ? "· 🏆 beaten" : ""} {record.perfect ? "· ✨ flawless" : ""}
            </p>
          ) : null}
        </div>
        <button type="button" className="hub__btn hub__btn--primary" onClick={start}>
          ⚔️ {record && record.won ? "Rematch" : "Fight the boss"}
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className={"boss acard boss--done" + (result.won ? " is-won" : " is-lost")} role="status">
        <span className="boss__monster" aria-hidden="true">
          {result.won ? "🏆" : "💥"}
        </span>
        <div className="boss__intro">
          <h3>{result.won ? "Boss defeated!" : "The boss wins this round."}</h3>
          <p>
            You scored <strong>{result.score}</strong> out of {total}.{" "}
            {result.won
              ? result.score === total
                ? "Flawless — you'd walk through this round of an interview."
                : "One slip, still a win. Re-read that card and it's yours."
              : "Open the cards you missed, play the lab, and come back."}
          </p>
          {result.gained ? <span className="achip achip--on">+{result.gained} XP</span> : null}
        </div>
        <button type="button" className="hub__btn" onClick={start}>
          ↺ Rematch
        </button>
      </div>
    );
  }

  const order = orders[index];
  const correct = picked === current.answer;

  return (
    <div className="boss acard boss--playing">
      <div className="boss__hud">
        <span>
          Question {index + 1} / {total}
        </span>
        <span>⭐ {score}</span>
        <span aria-label={Math.max(0, allowed - mistakes) + " mistakes left"}>
          {Array.from({ length: allowed + 1 }, (_, i) => (i < allowed + 1 - mistakes ? "❤️" : "🖤")).join(" ")}
        </span>
      </div>

      <p className="boss__q">{current.q}</p>

      <div className="boss__opts">
        {order.map((i) => {
          let cls = "";
          if (picked !== null) {
            if (i === current.answer) cls = " is-right";
            else if (i === picked) cls = " is-wrong";
            else cls = " is-muted";
          }
          return (
            <button key={i} type="button" className={"boss__opt" + cls} onClick={() => pick(i)} disabled={picked !== null}>
              {current.options[i]}
            </button>
          );
        })}
      </div>

      {picked !== null ? (
        <div className={"boss__why" + (correct ? " is-right" : " is-wrong")}>
          <strong>{correct ? "Correct!" : "Not quite."}</strong>
          <p>{current.why}</p>
          <button type="button" className="player__cta" onClick={next} autoFocus>
            {index + 1 < total ? "Next question →" : "See the result"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
