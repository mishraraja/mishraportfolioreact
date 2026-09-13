import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { runTrace, parseInputs, formatField, formatValue } from "./trace";
import { Stage } from "./Stage";
import { rich } from "./views/format";
import { sfx } from "../../lib/sound";
import "./Player.css";

const SPEEDS = [0.5, 1, 1.5, 2];
const PRAISE = ["Nailed it!", "Exactly right.", "You're thinking like the algorithm.", "Spot on.", "That's the one."];

function rawFrom(problem, input) {
  return Object.fromEntries(problem.inputs.map((spec) => [spec.name, formatField(spec, input[spec.name])]));
}

function safeRun(problem, input) {
  try {
    return runTrace(problem, input);
  } catch (err) {
    return { frames: [], error: "That input tripped up the animation: " + err.message };
  }
}

function shorten(text, max = 64) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

const ICONS = {
  restart: (
    <>
      <path d="M6 5v14" />
      <path d="M19 6l-9 6 9 6V6z" />
    </>
  ),
  prev: <path d="M15 6l-6 6 6 6" />,
  next: <path d="M9 6l6 6-6 6" />,
  end: (
    <>
      <path d="M18 5v14" />
      <path d="M5 6l9 6-9 6V6z" />
    </>
  ),
  play: <path d="M8 5l11 7-11 7V5z" fill="currentColor" />,
  pause: <path d="M8 5v14M16 5v14" strokeWidth="3" />,
  replay: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4 4v4h4" />
    </>
  ),
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

/**
 * The step player. It records the whole run up front, so stepping backwards,
 * scrubbing and replaying are free — and Predict mode can pause right before
 * a decision and ask what the algorithm will do next.
 */
export function Player({ problem, onFinish, onPredict }) {
  const first = problem.examples[0].input;
  const [input, setInput] = useState(first);
  const [raw, setRaw] = useState(() => rawFrom(problem, first));
  const [errors, setErrors] = useState({});
  const [preset, setPreset] = useState(0);
  const [editing, setEditing] = useState(false);

  const run = useMemo(() => safeRun(problem, input), [problem, input]);
  const frames = run.frames;
  const last = Math.max(0, frames.length - 1);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [predict, setPredict] = useState(false);
  const [question, setQuestion] = useState(null);
  const [answered, setAnswered] = useState({});
  const resumeRef = useRef(false);
  const seenRef = useRef(new Set());
  const finishedRef = useRef(false);

  useEffect(() => {
    setIdx(0);
    setPlaying(false);
    setQuestion(null);
    setAnswered({});
    seenRef.current = new Set();
    finishedRef.current = false;
  }, [run]);

  const frame = frames[Math.min(idx, last)];

  // Watching only counts when most of the run was actually seen, not scrubbed past.
  useEffect(() => {
    if (idx > last) return;
    seenRef.current.add(idx);
    if (frames.length < 3 || idx !== last || finishedRef.current) return;
    if (seenRef.current.size >= Math.ceil(frames.length * 0.6)) {
      finishedRef.current = true;
      if (onFinish) onFinish();
    }
  }, [idx, last, frames.length, onFinish]);

  const goTo = useCallback(
    (i) => {
      setQuestion(null);
      setIdx(Math.max(0, Math.min(last, i)));
    },
    [last]
  );

  const advance = useCallback(() => {
    if (idx >= last) {
      setPlaying(false);
      return;
    }
    if (predict && frames[idx].ask && answered[idx] === undefined) {
      resumeRef.current = playing;
      setPlaying(false);
      setQuestion({ at: idx, choice: null });
      sfx.open();
      return;
    }
    setIdx(idx + 1);
  }, [idx, last, predict, frames, answered, playing]);

  useEffect(() => {
    if (!playing || question || !frame) return undefined;
    if (idx >= last) {
      setPlaying(false);
      return undefined;
    }
    const wait = (900 + Math.min(2600, frame.say.length * 22)) / speed;
    const timer = setTimeout(advance, wait);
    return () => clearTimeout(timer);
  }, [playing, question, frame, idx, last, speed, advance]);

  function togglePlay() {
    sfx.click();
    if (question) return;
    if (idx >= last) {
      setIdx(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }

  function answer(choice) {
    if (!question || question.choice !== null) return;
    const correct = choice === frames[question.at].ask.answer;
    setQuestion({ ...question, choice });
    setAnswered((a) => ({ ...a, [question.at]: correct }));
    if (correct) sfx.success();
    else sfx.error();
    if (onPredict) onPredict(correct);
  }

  function resume() {
    if (!question) return;
    const at = question.at;
    setQuestion(null);
    setIdx(Math.min(last, at + 1));
    setPlaying(resumeRef.current);
  }

  function skip() {
    if (!question) return;
    setAnswered((a) => ({ ...a, [question.at]: null }));
    resume();
  }

  function onKeyDown(e) {
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (question) {
        if (question.choice !== null) resume();
      } else {
        advance();
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(idx - 1);
    } else if (e.key === " " && tag !== "BUTTON") {
      e.preventDefault();
      togglePlay();
    }
  }

  function applyPreset(i) {
    const example = problem.examples[i];
    setPreset(i);
    setRaw(rawFrom(problem, example.input));
    setErrors({});
    setInput(example.input);
    sfx.click();
  }

  function runCustom(e) {
    e.preventDefault();
    const parsed = parseInputs(problem, raw);
    if (parsed.errors) {
      setErrors(parsed.errors);
      sfx.error();
      return;
    }
    setErrors({});
    setPreset(-1);
    setInput(parsed.input);
    sfx.request();
  }

  const results = Object.values(answered).filter((v) => typeof v === "boolean");
  const right = results.filter(Boolean).length;
  const askCount = frames.filter((f) => f.ask).length;
  const ask = question ? frames[question.at].ask : null;

  return (
    <div className="player" onKeyDown={onKeyDown}>
      {/* ---------- input ---------- */}
      <div className="player__inputs">
        <div className="player__presets" role="group" aria-label="Choose an input">
          {problem.examples.map((_, i) => (
            <button
              key={i}
              type="button"
              className={"achip" + (preset === i ? " achip--on" : "")}
              onClick={() => applyPreset(i)}
              aria-pressed={preset === i}
            >
              Example {i + 1}
            </button>
          ))}
          <button
            type="button"
            className={"achip achip--accent" + (editing ? " achip--on" : "")}
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
          >
            🛠 Try your own input
          </button>
        </div>

        <p className="player__input-line">
          {problem.inputs.map((spec) => (
            <span key={spec.name} className="player__input-item">
              <em>{spec.name}</em> = <code>{shorten(formatField(spec, input[spec.name]))}</code>
            </span>
          ))}
        </p>

        {editing ? (
          <form className="player__form" onSubmit={runCustom}>
            {problem.inputs.map((spec) => (
              <label key={spec.name} className="player__field">
                <span className="player__field-name">{spec.name}</span>
                <input
                  value={raw[spec.name] ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRaw((r) => ({ ...r, [spec.name]: value }));
                  }}
                  spellCheck="false"
                  autoComplete="off"
                  autoCapitalize="off"
                  aria-invalid={Boolean(errors[spec.name])}
                />
                {errors[spec.name] ? <span className="player__error">{errors[spec.name]}</span> : null}
              </label>
            ))}
            {errors._form ? <p className="player__error">{errors._form}</p> : null}
            <button type="submit" className="player__cta">
              Run it
            </button>
          </form>
        ) : null}
      </div>

      {run.error ? <p className="player__error player__error--run">{run.error}</p> : null}

      {frame ? (
        <>
          {/* ---------- narration ---------- */}
          <div className="player__narration" aria-live="polite">
            <span className="player__guide" aria-hidden="true">
              🧑‍🚀
            </span>
            <motion.p key={idx + ":" + frame.say} className="player__say" initial={{ opacity: 0.2, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
              {rich(frame.say)}
            </motion.p>
          </div>

          {frame.vars ? (
            <div className="player__vars">
              {Object.entries(frame.vars).map(([k, v]) => (
                <span key={k} className="player__var">
                  <em>{k}</em>
                  {typeof v === "string" ? v : formatValue(v)}
                </span>
              ))}
            </div>
          ) : null}

          {/* ---------- predict question ---------- */}
          {ask ? (
            <motion.div
              className="player__quiz"
              role="group"
              aria-label="Predict the next step"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <p className="player__quiz-q">
                <span aria-hidden="true">🎯</span> {ask.q}
              </p>
              <div className="player__quiz-options">
                {ask.options.map((option, i) => {
                  const revealed = question.choice !== null;
                  let cls = "";
                  if (revealed) cls = i === ask.answer ? " is-right" : i === question.choice ? " is-wrong" : " is-muted";
                  return (
                    <button key={i} type="button" className={"player__opt" + cls} onClick={() => answer(i)} disabled={revealed}>
                      {option}
                    </button>
                  );
                })}
              </div>
              {question.choice !== null ? (
                <div className="player__quiz-feedback">
                  <strong className={question.choice === ask.answer ? "is-right" : "is-wrong"}>
                    {question.choice === ask.answer ? PRAISE[question.at % PRAISE.length] : "Not quite."}
                  </strong>
                  {ask.why ? <span>{ask.why}</span> : null}
                  <button type="button" className="player__cta" onClick={resume} autoFocus>
                    See what happens →
                  </button>
                </div>
              ) : (
                <button type="button" className="player__skip" onClick={skip}>
                  Skip this one
                </button>
              )}
            </motion.div>
          ) : null}

          {/* ---------- the visualisation ---------- */}
          <div className={"player__stage" + (ask ? " player__stage--waiting" : "")}>
            <Stage panels={frame.panels} />
          </div>

          {idx === last && frames.length > 1 ? (
            <div className="player__done" role="status">
              <span aria-hidden="true">🎉</span> Answer <code>{shorten(formatValue(run.result), 140)}</code>
              {run.truncated ? <em>(a long run, so it skipped ahead)</em> : null}
            </div>
          ) : null}

          {/* ---------- controls ---------- */}
          <div className="player__controls">
            <div className="player__buttons">
              <button type="button" className="pbtn" onClick={() => goTo(0)} aria-label="Back to the start" disabled={idx === 0}>
                <Icon name="restart" />
              </button>
              <button type="button" className="pbtn" onClick={() => goTo(idx - 1)} aria-label="Previous step" disabled={idx === 0}>
                <Icon name="prev" />
              </button>
              <button type="button" className="pbtn pbtn--play" onClick={togglePlay} aria-label={playing ? "Pause" : idx >= last ? "Replay" : "Play"} disabled={Boolean(ask)}>
                <Icon name={playing ? "pause" : idx >= last ? "replay" : "play"} />
              </button>
              <button type="button" className="pbtn" onClick={advance} aria-label="Next step" disabled={idx >= last || Boolean(ask)}>
                <Icon name="next" />
              </button>
              <button type="button" className="pbtn" onClick={() => goTo(last)} aria-label="Jump to the end" disabled={idx >= last}>
                <Icon name="end" />
              </button>
            </div>

            <div className="player__timeline">
              <input
                type="range"
                className="player__scrub"
                min={0}
                max={last}
                value={Math.min(idx, last)}
                onChange={(e) => goTo(Number(e.target.value))}
                aria-label="Scrub through the steps"
                style={{ "--progress": last ? (idx / last) * 100 + "%" : "100%" }}
              />
              <span className="player__count">
                Step {Math.min(idx, last) + 1} / {frames.length}
              </span>
            </div>

            <div className="player__speeds" role="group" aria-label="Playback speed">
              {SPEEDS.map((s) => (
                <button key={s} type="button" className={"achip achip--sm" + (speed === s ? " achip--on" : "")} onClick={() => setSpeed(s)} aria-pressed={speed === s}>
                  {s}×
                </button>
              ))}
            </div>

            <label className={"player__predict" + (predict ? " is-on" : "")}>
              <input
                type="checkbox"
                checked={predict}
                onChange={(e) => {
                  setPredict(e.target.checked);
                  sfx.click();
                }}
              />
              <span className="player__predict-switch" aria-hidden="true" />
              <span>Predict mode</span>
              {results.length ? (
                <span className="player__score">
                  {right}/{results.length}
                </span>
              ) : null}
            </label>
          </div>

          {predict && !results.length && askCount ? (
            <p className="player__hint">
              The animation will pause at {askCount} key moment{askCount === 1 ? "" : "s"} and ask what happens next. Each correct guess earns XP.
            </p>
          ) : null}
          <p className="player__keys">
            <kbd>Space</kbd> play / pause · <kbd>←</kbd> <kbd>→</kbd> step
          </p>
        </>
      ) : null}
    </div>
  );
}
