import { useEffect, useMemo, useRef, useState } from "react";
import { PUZZLES } from "../data/outputs";
import { getWorld } from "../data/worlds";
import { useJavaProgress } from "../progress";
import { seededOrder, shuffle } from "../shuffle";
import { CodeBlock } from "../../dsa/components/CodeBlock";
import { useTitle } from "../../dsa/useTitle";
import { sfx } from "../../lib/sound";

const GAME_ID = "guess-output";
const MAX_ROUNDS = 10;
const LEVELS = ["Mixed", "Warm-up", "Tricky", "Evil"];
const POINTS = { "Warm-up": 1, Tricky: 2, Evil: 3 };

function newGame(level) {
  const pool = level === "Mixed" ? PUZZLES : PUZZLES.filter((p) => p.level === level);
  return shuffle(pool).slice(0, MAX_ROUNDS);
}

export function GuessOutput() {
  useTitle("Guess the Output — Backend Arcade");
  const { game, state } = useJavaProgress();
  const [level, setLevel] = useState("Mixed");
  const [phase, setPhase] = useState("intro");
  const [rounds, setRounds] = useState([]);
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState(null);
  const [history, setHistory] = useState([]);
  const [gained, setGained] = useState(0);
  const bestBefore = useRef(0);

  const current = rounds[round];
  const order = useMemo(() => (current ? seededOrder(current.options.length, current.id) : []), [current]);
  const score = history.reduce((sum, h) => sum + (h.correct ? POINTS[h.puzzle.level] : 0), 0);

  function start() {
    setRounds(newGame(level));
    setRound(0);
    setPicked(null);
    setHistory([]);
    bestBefore.current = state.games[GAME_ID] || 0;
    setPhase("playing");
    sfx.open();
  }

  function pick(i) {
    if (picked !== null) return;
    const correct = i === current.answer;
    setPicked(i);
    setHistory((h) => [...h, { puzzle: current, correct, picked: i }]);
    if (correct) sfx.success();
    else sfx.error();
  }

  function next() {
    if (round + 1 >= rounds.length) {
      const hits = history.filter((h) => h.correct).length;
      setGained(game(GAME_ID, score, hits));
      setPhase("done");
      sfx.unlock();
      return;
    }
    setRound((r) => r + 1);
    setPicked(null);
    sfx.click();
  }

  const pickRef = useRef(pick);
  pickRef.current = pick;
  const nextRef = useRef(next);
  nextRef.current = next;

  useEffect(() => {
    if (phase !== "playing" || !current) return undefined;
    function onKey(e) {
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (picked === null && ["1", "2", "3", "4"].includes(e.key)) {
        const slot = order[Number(e.key) - 1];
        if (slot !== undefined) {
          e.preventDefault();
          pickRef.current(slot);
        }
      } else if (picked !== null && e.key === "Enter") {
        e.preventDefault();
        nextRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, picked, current, order]);

  if (phase === "intro") {
    const best = state.games[GAME_ID] || 0;
    return (
      <div className="jgame">
        <header className="learn__head">
          <span className="arcade-eyebrow">🖨️ Guess the Output</span>
          <h1 className="arcade-title">What does this really print?</h1>
          <p className="arcade-lede">
            Short snippets, each hiding one surprise: the Integer cache, a return inside finally, a lazy stream, a @Transactional self-call. Read carefully — then commit to an answer.
          </p>
        </header>
        <div className="acard jgame__rules">
          <div className="hub__chips" role="group" aria-label="Difficulty">
            {LEVELS.map((l) => (
              <button key={l} type="button" className={"achip" + (level === l ? " achip--on" : "")} aria-pressed={level === l} onClick={() => setLevel(l)}>
                {l === "Evil" ? "😈 Evil" : l}
              </button>
            ))}
          </div>
          <ul className="jticks">
            <li>Up to {MAX_ROUNDS} puzzles, no timer. Warm-ups score 1, tricky ones 2, evil ones 3.</li>
            <li>Every answer comes with the reason — that's the part to remember.</li>
            <li>Keyboard: press 1–4 to answer, Enter for the next snippet.</li>
          </ul>
          {best ? <p className="jgame__best">Your best: {best}</p> : null}
          <button type="button" className="hub__btn hub__btn--primary" onClick={start}>
            Show me the code →
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
          <span className="arcade-eyebrow">🖨️ Compiled and run</span>
          <h1 className="arcade-title">
            {hits} / {rounds.length} correct
          </h1>
          <p className="arcade-lede">
            {score} points. {hits === rounds.length ? "Not a single surprise got past you." : "The misses below are exactly the kind of snippet interviewers put on a whiteboard."}
          </p>
        </header>
        <div className="jgame__summary">
          {score > bestBefore.current ? <span className="achip achip--accent">🏆 New personal best</span> : null}
          {gained ? <span className="achip achip--on">+{gained} XP</span> : null}
          <button type="button" className="hub__btn hub__btn--primary" onClick={start}>
            Play again
          </button>
          <button type="button" className="hub__btn" onClick={() => setPhase("intro")}>
            Change difficulty
          </button>
        </div>
        {misses.length ? (
          <section className="arcade-section">
            <h2 className="arcade-h2">The ones that got you</h2>
            <div className="guess__misses">
              {misses.map((m) => (
                <div key={m.puzzle.id} className="acard guess__miss">
                  <CodeBlock code={m.puzzle.code} lang={m.puzzle.lang || "java"} />
                  <p>
                    <strong>Answer: {m.puzzle.options[m.puzzle.answer]}.</strong> {m.puzzle.why}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  const world = getWorld(current.world);
  const correct = picked === current.answer;

  return (
    <div className="jgame">
      <div className="jgame__hud">
        <span>
          Snippet {round + 1} / {rounds.length}
        </span>
        <span>{score} pts</span>
        <span className={"guess__level guess__level--" + current.level.replace(/\W/g, "").toLowerCase()}>{current.level}</span>
      </div>

      <section className="acard guess__card">
        <span className="arcade-eyebrow">
          {world.emoji} {world.name}
        </span>
        <p className="guess__ask">{current.ask || "What does this print?"}</p>
        <CodeBlock code={current.code} lang={current.lang || "java"} />
        <div className="guess__opts">
          {order.map((i, slot) => {
            let cls = "";
            if (picked !== null) cls = i === current.answer ? " is-right" : i === picked ? " is-wrong" : " is-muted";
            return (
              <button key={i} type="button" className={"guess__opt" + cls} onClick={() => pick(i)} disabled={picked !== null}>
                <span className="jgame__key" aria-hidden="true">
                  {slot + 1}
                </span>
                <code>{current.options[i]}</code>
              </button>
            );
          })}
        </div>

        {picked !== null ? (
          <div className="jgame__feedback">
            <strong className={correct ? "t-good" : "t-bad"}>{correct ? "+" + POINTS[current.level] + " — correct!" : "Gotcha. It's " + current.options[current.answer] + "."}</strong>
            <span>{current.why}</span>
            <button type="button" className="player__cta" onClick={next} autoFocus>
              {round + 1 >= rounds.length ? "See my score" : "Next snippet →"}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
