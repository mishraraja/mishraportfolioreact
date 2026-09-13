import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PROBLEMS } from "../data";
import { PATTERNS, getPattern } from "../data/patterns";
import { useProgress } from "../progress";
import { useTitle } from "../useTitle";
import { sfx } from "../../lib/sound";
import "./Learn.css";

const ROUNDS = 10;
const SECONDS = 20;

/** Patterns people genuinely confuse, so the wrong answers are tempting. */
const FAMILIES = [
  ["two-pointers", "sliding-window", "binary-search", "prefix-suffix", "fast-slow"],
  ["dp-1d", "dp-2d", "greedy", "backtracking"],
  ["graph-traversal", "topo-sort", "union-find", "tree-bfs"],
  ["tree-dfs", "tree-bfs", "bst", "trie"],
  ["hashing", "stack", "heap", "design", "prefix-suffix"],
  ["intervals", "greedy", "heap", "matrix"],
  ["list-rewire", "fast-slow", "two-pointers", "stack"],
  ["bit-manipulation", "hashing", "matrix", "backtracking"],
];

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeRound(problem) {
  const correct = problem.pattern;
  const family = shuffle(FAMILIES.filter((f) => f.includes(correct)).flat());
  const everyone = shuffle(PATTERNS.map((p) => p.id));
  const picks = [];
  [...family, ...everyone].forEach((id) => {
    if (picks.length < 3 && id !== correct && !picks.includes(id)) picks.push(id);
  });
  return { problem, options: shuffle([correct, ...picks]) };
}

function newGame() {
  return shuffle(PROBLEMS).slice(0, ROUNDS).map(makeRound);
}

export function PatternRadar() {
  useTitle("Pattern Radar — DSA Arcade");
  const { radar, state } = useProgress();
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
  const bestBefore = useRef(state.radarBest);

  const current = rounds[round];

  const answer = useCallback(
    (id) => {
      if (phase !== "playing" || picked !== null) return;
      const correct = id === current.problem.pattern;
      const secondsLeft = Math.ceil(Math.max(0, deadline.current - Date.now()) / 1000);
      const multiplier = 1 + 0.25 * Math.min(streak, 4);
      const points = correct ? Math.round((100 + secondsLeft * 10) * multiplier) : 0;
      setPicked(id === null ? "timeout" : id);
      setLastPoints(points);
      setScore((s) => s + points);
      setStreak((s) => (correct ? s + 1 : 0));
      setHistory((h) => [...h, { problem: current.problem, correct, picked: id }]);
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
    bestBefore.current = state.radarBest;
    deadline.current = Date.now() + SECONDS * 1000;
    setLeft(SECONDS * 1000);
    setPhase("playing");
    sfx.open();
  }

  function next() {
    if (round + 1 >= ROUNDS) {
      const hits = history.filter((h) => h.correct).length;
      setGained(radar(score, hits));
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
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (picked === null && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        answerRef.current(current.options[Number(e.key) - 1]);
      } else if (picked !== null && e.key === "Enter") {
        e.preventDefault();
        nextRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, picked, current]);

  /* ---------- intro ---------- */
  if (phase === "intro") {
    return (
      <div className="learn radar">
        <header className="learn__head">
          <span className="arcade-eyebrow">📡 Pattern Radar</span>
          <h1 className="arcade-title">Name the pattern before the clock does.</h1>
          <p className="arcade-lede">
            In a real interview, the hardest part is the first minute: working out what kind of problem you're looking at. This game trains exactly that.
          </p>
        </header>
        <div className="radar__rules acard">
          <ul className="ticks">
            <li>{ROUNDS} real interview problems, shown without their names.</li>
            <li>{SECONDS} seconds each to pick the pattern that cracks it.</li>
            <li>Faster answers score more. Streaks multiply your points, up to 2×.</li>
            <li>Keyboard: press 1–4 to answer, Enter for the next problem.</li>
          </ul>
          {state.radarBest ? <p className="radar__best">Your best so far: {state.radarBest.toLocaleString("en-US")}</p> : null}
          <button type="button" className="hub__btn hub__btn--primary" onClick={start}>
            Start scanning →
          </button>
        </div>
      </div>
    );
  }

  /* ---------- results ---------- */
  if (phase === "done") {
    const hits = history.filter((h) => h.correct).length;
    const misses = history.filter((h) => !h.correct);
    const newBest = score > bestBefore.current;
    return (
      <div className="learn radar">
        <header className="learn__head">
          <span className="arcade-eyebrow">📡 Scan complete</span>
          <h1 className="arcade-title">{score.toLocaleString("en-US")} points</h1>
          <p className="arcade-lede">
            {hits} of {ROUNDS} patterns spotted.{" "}
            {hits === ROUNDS ? "A perfect scan — you read problems like an interviewer." : hits >= 7 ? "Sharp eyes. A few more rounds and it'll be instinct." : "Every miss below is a pattern worth a second look."}
          </p>
        </header>
        <div className="radar__summary">
          {newBest ? <span className="achip achip--accent">🏆 New personal best</span> : null}
          {gained ? <span className="achip achip--on">+{gained} XP</span> : null}
          <button type="button" className="hub__btn hub__btn--primary" onClick={start}>
            Play again
          </button>
        </div>
        {misses.length ? (
          <section className="arcade-section">
            <h2 className="arcade-h2">Worth a second look</h2>
            <div className="radar__misses">
              {misses.map((m) => {
                const pattern = getPattern(m.problem.pattern);
                return (
                  <div key={m.problem.slug} className="acard radar__miss">
                    <strong>
                      {m.problem.emoji} {m.problem.title}
                    </strong>
                    <span>
                      was <b>{pattern.name}</b>
                      {m.picked ? `, not ${getPattern(m.picked).name}` : " — the clock ran out"}.
                    </span>
                    <span className="radar__miss-links">
                      <Link to={"/dsa/" + m.problem.slug} className="achip">
                        Play the problem
                      </Link>
                      <Link to={"/dsa/learn/patterns#" + pattern.id} className="achip">
                        Read the pattern
                      </Link>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  /* ---------- playing ---------- */
  const correctId = current.problem.pattern;
  const fraction = left / (SECONDS * 1000);
  return (
    <div className="learn radar">
      <div className="radar__hud">
        <span>
          Problem {round + 1} / {ROUNDS}
        </span>
        <span>{score.toLocaleString("en-US")} pts</span>
        {streak > 1 ? <span className="radar__streak">🔥 ×{(1 + 0.25 * Math.min(streak, 4)).toFixed(2)}</span> : null}
      </div>
      <div className="meter radar__timer" style={{ "--meter": fraction < 0.25 ? "var(--color-danger)" : "var(--color-accent-3)" }} aria-hidden="true">
        <span className="meter__fill" style={{ width: fraction * 100 + "%" }} />
      </div>
      <span className="sr-only" aria-live="polite">
        {Math.ceil(left / 1000)} seconds left
      </span>

      <section className="acard radar__card">
        <span className="arcade-eyebrow">Which pattern cracks this?</span>
        <p className="radar__statement">{current.problem.statement}</p>
        <div className="radar__options">
          {current.options.map((id, i) => {
            const p = getPattern(id);
            let cls = "";
            if (picked !== null) cls = id === correctId ? " is-right" : id === picked ? " is-wrong" : " is-muted";
            return (
              <button key={id} type="button" className={"radar__opt" + cls} onClick={() => answer(id)} disabled={picked !== null}>
                <span className="radar__key" aria-hidden="true">
                  {i + 1}
                </span>
                <span aria-hidden="true">{p.emoji}</span> {p.name}
              </button>
            );
          })}
        </div>

        {picked !== null ? (
          <div className="radar__feedback" role="status">
            {picked === correctId ? (
              <strong className="is-right">+{lastPoints} — that's {getPattern(correctId).name}.</strong>
            ) : (
              <strong className="is-wrong">{picked === "timeout" ? "Time's up." : "Not this time."} It's {getPattern(correctId).name}.</strong>
            )}
            <span>
              This was <b>{current.problem.title}</b>. {getPattern(correctId).tagline}
            </span>
            <button type="button" className="player__cta" onClick={next} autoFocus>
              {round + 1 >= ROUNDS ? "See my score" : "Next problem →"}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
