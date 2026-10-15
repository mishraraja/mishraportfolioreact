import { useCallback, useEffect, useRef, useState } from "react";
import { VERSUS } from "../data/versus";
import { getWorld } from "../data/worlds";
import { useJavaProgress } from "../progress";
import { shuffle } from "../shuffle";
import { useTitle } from "../../dsa/useTitle";
import { sfx } from "../../lib/sound";

const GAME_ID = "this-or-that";
const ROUNDS = 12;
const SECONDS = 10;

export const CLUES = VERSUS.flatMap((pair) => pair.clues.map((clue) => ({ ...clue, a: pair.a, b: pair.b, world: pair.world })));

function newGame() {
  return shuffle(CLUES)
    .slice(0, ROUNDS)
    .map((clue) => ({ ...clue, flip: Math.random() < 0.5 }));
}

function sidesOf(clue) {
  const sides = [
    { key: "a", label: clue.a },
    { key: "b", label: clue.b },
  ];
  return clue.flip ? sides.reverse() : sides;
}

export function ThisOrThat() {
  useTitle("This or That — Backend Arcade");
  const { game, state } = useJavaProgress();
  const [phase, setPhase] = useState("intro");
  const [rounds, setRounds] = useState(newGame);
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState(null);
  const [left, setLeft] = useState(SECONDS * 1000);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState([]);
  const [lastPoints, setLastPoints] = useState(0);
  const [gained, setGained] = useState(0);
  const deadline = useRef(0);
  const bestBefore = useRef(state.games[GAME_ID] || 0);

  const current = rounds[round];

  const answer = useCallback(
    (key) => {
      if (phase !== "playing" || picked !== null) return;
      const correct = key === current.answer;
      const secondsLeft = Math.ceil(Math.max(0, deadline.current - Date.now()) / 1000);
      const multiplier = 1 + 0.25 * Math.min(streak, 4);
      const points = correct ? Math.round((100 + secondsLeft * 10) * multiplier) : 0;
      setPicked(key === null ? "timeout" : key);
      setLastPoints(points);
      setScore((s) => s + points);
      setStreak((s) => (correct ? s + 1 : 0));
      setHistory((h) => [...h, { clue: current, correct, picked: key }]);
      if (correct) sfx.success();
      else sfx.error();
    },
    [phase, picked, current, streak]
  );

  const answerRef = useRef(answer);
  answerRef.current = answer;

  useEffect(() => {
    if (phase !== "playing" || picked !== null) return undefined;
    const timer = setInterval(() => {
      const remaining = deadline.current - Date.now();
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) answerRef.current(null);
    }, 100);
    return () => clearInterval(timer);
  }, [phase, picked, round]);

  function start() {
    setRounds(newGame());
    setRound(0);
    setScore(0);
    setStreak(0);
    setHistory([]);
    setPicked(null);
    bestBefore.current = state.games[GAME_ID] || 0;
    deadline.current = Date.now() + SECONDS * 1000;
    setLeft(SECONDS * 1000);
    setPhase("playing");
    sfx.open();
  }

  function next() {
    if (round + 1 >= ROUNDS) {
      const hits = history.filter((h) => h.correct).length;
      setGained(game(GAME_ID, score, hits));
      setPhase("done");
      sfx.unlock();
      return;
    }
    setRound((r) => r + 1);
    setPicked(null);
    deadline.current = Date.now() + SECONDS * 1000;
    setLeft(SECONDS * 1000);
    sfx.click();
  }

  const nextRef = useRef(next);
  nextRef.current = next;

  useEffect(() => {
    if (phase !== "playing") return undefined;
    function onKey(e) {
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const sides = sidesOf(current);
      if (picked === null && (e.key === "1" || e.key === "ArrowLeft")) {
        e.preventDefault();
        answerRef.current(sides[0].key);
      } else if (picked === null && (e.key === "2" || e.key === "ArrowRight")) {
        e.preventDefault();
        answerRef.current(sides[1].key);
      } else if (picked !== null && e.key === "Enter") {
        e.preventDefault();
        nextRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, picked, current]);

  if (phase === "intro") {
    const best = state.games[GAME_ID] || 0;
    return (
      <div className="jgame">
        <header className="learn__head">
          <span className="arcade-eyebrow">⚖️ This or That</span>
          <h1 className="arcade-title">Two choices. Ten seconds.</h1>
          <p className="arcade-lede">
            Interviewers love comparisons: ArrayList or LinkedList, PUT or POST, merge or rebase. One clue, two answers — pick the one it describes before the timer runs out.
          </p>
        </header>
        <div className="acard jgame__rules">
          <ul className="jticks">
            <li>
              {ROUNDS} clues drawn from {CLUES.length}, across every world.
            </li>
            <li>{SECONDS} seconds each. Faster answers score more; streaks multiply, up to 2×.</li>
            <li>Keyboard: 1 / ← and 2 / → to answer, Enter for the next clue.</li>
          </ul>
          {best ? <p className="jgame__best">Your best: {best.toLocaleString("en-US")}</p> : null}
          <button type="button" className="hub__btn hub__btn--primary" onClick={start}>
            Start →
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const hits = history.filter((h) => h.correct).length;
    const misses = history.filter((h) => !h.correct);
    return (
      <div className="jgame">
        <header className="learn__head">
          <span className="arcade-eyebrow">⚖️ Round over</span>
          <h1 className="arcade-title">{score.toLocaleString("en-US")} points</h1>
          <p className="arcade-lede">
            {hits} of {ROUNDS} right.{" "}
            {hits === ROUNDS ? "Perfect — you know your trade-offs cold." : hits >= 9 ? "Sharp. The misses below are worth one more look." : "Every miss below is a likely interview question."}
          </p>
        </header>
        <div className="jgame__summary">
          {score > bestBefore.current ? <span className="achip achip--accent">🏆 New personal best</span> : null}
          {gained ? <span className="achip achip--on">+{gained} XP</span> : null}
          <button type="button" className="hub__btn hub__btn--primary" onClick={start}>
            Play again
          </button>
        </div>
        {misses.length ? (
          <section className="arcade-section">
            <h2 className="arcade-h2">Worth a second look</h2>
            <div className="jgame__misses">
              {misses.map((m, i) => (
                <div key={i} className="acard jgame__miss">
                  <span className="arcade-eyebrow">
                    {m.clue.a} vs {m.clue.b}
                  </span>
                  <strong>“{m.clue.text}”</strong>
                  <span>
                    → <b>{m.clue.answer === "a" ? m.clue.a : m.clue.b}</b>. {m.clue.why}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  const world = getWorld(current.world);
  const fraction = left / (SECONDS * 1000);
  const sides = sidesOf(current);
  const rightLabel = current.answer === "a" ? current.a : current.b;

  return (
    <div className="jgame">
      <div className="jgame__hud">
        <span>
          Clue {round + 1} / {ROUNDS}
        </span>
        <span>{score.toLocaleString("en-US")} pts</span>
        {streak > 1 ? <span className="jgame__streak">🔥 ×{(1 + 0.25 * Math.min(streak, 4)).toFixed(2)}</span> : null}
      </div>
      <div className="meter jgame__timer" style={{ "--meter": fraction < 0.3 ? "var(--color-danger)" : "var(--color-accent-3)" }} aria-hidden="true">
        <span className="meter__fill" style={{ width: fraction * 100 + "%" }} />
      </div>
      <span className="sr-only" aria-live="polite">
        {Math.ceil(left / 1000)} seconds left
      </span>

      <section className="acard vs__card">
        <span className="arcade-eyebrow">
          {world.emoji} {world.name} · which one is it?
        </span>
        <p className="vs__clue">“{current.text}”</p>
        <div className="vs__choices">
          {sides.map((side, i) => {
            let cls = "";
            if (picked !== null) cls = side.key === current.answer ? " is-right" : side.key === picked ? " is-wrong" : " is-muted";
            return (
              <button key={side.key} type="button" className={"vs__choice" + cls} onClick={() => answer(side.key)} disabled={picked !== null}>
                <span className="jgame__key" aria-hidden="true">
                  {i + 1}
                </span>
                {side.label}
              </button>
            );
          })}
        </div>

        {picked !== null ? (
          <div className="jgame__feedback">
            {picked === current.answer ? (
              <strong className="t-good">+{lastPoints} — it's {rightLabel}.</strong>
            ) : (
              <strong className="t-bad">
                {picked === "timeout" ? "Time's up." : "Not this time."} It's {rightLabel}.
              </strong>
            )}
            <span>{current.why}</span>
            <button type="button" className="player__cta" onClick={next} autoFocus>
              {round + 1 >= ROUNDS ? "See my score" : "Next clue →"}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
