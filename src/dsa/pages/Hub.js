import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PROBLEMS, getProblem } from "../data";
import { WORLDS } from "../data/worlds";
import { getPattern } from "../data/patterns";
import { ROADMAP } from "../data/roadmap";
import { useProgress, isDue } from "../progress";
import { ProblemCard } from "../components/ProblemCard";
import { useTitle } from "../useTitle";
import { sfx } from "../../lib/sound";
import "./Hub.css";

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];
const STATUSES = [
  { id: "all", label: "All" },
  { id: "todo", label: "Not started" },
  { id: "watched", label: "Watched" },
  { id: "mastered", label: "Mastered" },
];

const TOOLKIT = [
  {
    to: "/dsa/learn/patterns",
    emoji: "🧠",
    title: "Pattern Playbook",
    desc: "24 patterns, the signals that give each one away, a Java template and the traps to avoid.",
  },
  {
    to: "/dsa/radar",
    emoji: "📡",
    title: "Pattern Radar",
    desc: "Quick-fire game: read a problem, name its pattern before the timer runs out.",
  },
  {
    to: "/dsa/learn/roadmap",
    emoji: "🗺️",
    title: "8-Week Roadmap",
    desc: "All 75 in an order that builds, with spaced-review reminders so they actually stick.",
  },
  {
    to: "/dsa/learn/big-o",
    emoji: "⚡",
    title: "Big-O Lab",
    desc: "Drag n and watch O(n²) fall off a cliff. Plus: read the constraints, know the target complexity.",
  },
  {
    to: "/dsa/learn/interview",
    emoji: "🎤",
    title: "Interview Playbook",
    desc: "A 45-minute game plan, what to say out loud, edge-case checklists and language gotchas.",
  },
];

const ROADMAP_ORDER = ROADMAP.flatMap((w) => w.slugs);

function StatTile({ label, value, detail, meter, meterColor }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      {meter !== undefined ? (
        <span className="meter" style={{ "--meter": meterColor }} aria-hidden="true">
          <span className="meter__fill" style={{ width: Math.round(meter * 100) + "%" }} />
        </span>
      ) : null}
      {detail ? <span className="stat__detail">{detail}</span> : null}
    </div>
  );
}

export function Hub() {
  useTitle("DSA Arcade — 75 interview problems you can play");
  const progress = useProgress();
  const { statusOf, record, level, next, levelProgress, xp, streak, state } = progress;
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [status, setStatus] = useState("all");
  const [world, setWorld] = useState("all");

  const mastered = PROBLEMS.filter((p) => statusOf(p.slug) === "mastered").length;
  const watched = PROBLEMS.filter((p) => statusOf(p.slug) === "watched").length;
  const due = PROBLEMS.filter((p) => isDue(record(p.slug)));
  const accuracy = state.predict.total ? Math.round((state.predict.right / state.predict.total) * 100) : null;

  const continueTo = useMemo(() => {
    const last = state.last && getProblem(state.last);
    if (last && statusOf(last.slug) !== "mastered") return last;
    const slug = ROADMAP_ORDER.find((s) => statusOf(s) !== "mastered");
    return slug ? getProblem(slug) : null;
  }, [state.last, statusOf]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROBLEMS.filter((p) => {
      if (q && !`${p.title} ${p.lc} ${getPattern(p.pattern).name}`.toLowerCase().includes(q)) return false;
      if (difficulty !== "All" && p.difficulty !== difficulty) return false;
      if (world !== "all" && p.world !== world) return false;
      const s = statusOf(p.slug);
      if (status === "todo" && (s === "watched" || s === "mastered")) return false;
      if (status === "watched" && s !== "watched") return false;
      if (status === "mastered" && s !== "mastered") return false;
      return true;
    });
  }, [query, difficulty, world, status, statusOf]);

  function surprise() {
    const pool = PROBLEMS.filter((p) => statusOf(p.slug) !== "mastered");
    const list = pool.length ? pool : PROBLEMS;
    const pick = list[Math.floor(Math.random() * list.length)];
    sfx.open();
    navigate("/dsa/" + pick.slug);
  }

  const filtersActive = query || difficulty !== "All" || status !== "all" || world !== "all";

  return (
    <div className="hub">
      {/* ---------- hero ---------- */}
      <header className="hub__hero">
        <span className="arcade-eyebrow">Free · No sign-up · Progress saved in your browser</span>
        <h1 className="arcade-title">
          75 interview problems.
          <br />
          Every one of them playable.
        </h1>
        <p className="arcade-lede">
          The problems product companies keep asking, turned into animations you can play, pause, rewind and{" "}
          <strong>predict</strong>. Each one comes with a story that makes the trick stick, working Java and Python, and a
          one-question check that tells you when you really get it.
        </p>
        <div className="hub__cta">
          {continueTo ? (
            <Link to={"/dsa/" + continueTo.slug} className="hub__btn hub__btn--primary" onClick={sfx.click}>
              {state.last ? "Continue" : "Start"}: {continueTo.title} →
            </Link>
          ) : (
            <span className="hub__btn hub__btn--primary">All 75 mastered. Legend. 🏆</span>
          )}
          <button type="button" className="hub__btn" onClick={surprise}>
            🎲 Surprise me
          </button>
          <Link to="/dsa/radar" className="hub__btn" onClick={sfx.click}>
            📡 Play Pattern Radar
          </Link>
        </div>
      </header>

      {/* ---------- progress ---------- */}
      <section className="hub__stats" aria-label="Your progress">
        <StatTile
          label={`Level · ${level.emoji} ${level.name}`}
          value={`${xp} XP`}
          meter={levelProgress}
          meterColor="var(--color-accent)"
          detail={next ? `${next.min - xp} XP to ${next.emoji} ${next.name}` : "Top level reached"}
        />
        <StatTile label="Mastered" value={`${mastered} / ${PROBLEMS.length}`} meter={mastered / PROBLEMS.length} meterColor="var(--color-accent-2)" detail={`${watched} more watched`} />
        <StatTile label="Daily streak" value={streak ? `🔥 ${streak} day${streak === 1 ? "" : "s"}` : "—"} detail={streak ? "Come back tomorrow to keep it alive" : "Play anything today to start one"} />
        <StatTile
          label="Predictions"
          value={accuracy === null ? "—" : accuracy + "%"}
          detail={accuracy === null ? "Turn on Predict mode in any problem" : `${state.predict.right} of ${state.predict.total} right`}
        />
      </section>

      {due.length ? (
        <section className="hub__due" aria-label="Reviews due">
          <strong>↻ {due.length} review{due.length === 1 ? "" : "s"} due.</strong>
          <span>Spaced reviews are what move a problem from “I've seen it” to “I can do it cold”.</span>
          <div className="hub__due-list">
            {due.slice(0, 6).map((p) => (
              <Link key={p.slug} to={"/dsa/" + p.slug} className="achip achip--on">
                {p.emoji} {p.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------- toolkit ---------- */}
      <section className="arcade-section" aria-labelledby="toolkit-title">
        <div className="arcade-section__head">
          <div>
            <h2 id="toolkit-title" className="arcade-h2">
              Beyond the 75
            </h2>
            <p className="arcade-section__sub">The problems teach you answers. These teach you how to find them.</p>
          </div>
        </div>
        <div className="hub__toolkit">
          {TOOLKIT.map((t) => (
            <Link key={t.to} to={t.to} className="tool" onPointerEnter={sfx.hover}>
              <span className="tool__emoji" aria-hidden="true">
                {t.emoji}
              </span>
              <span className="tool__title">{t.title}</span>
              <span className="tool__desc">{t.desc}</span>
              <span className="tool__go" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- problem map ---------- */}
      <section className="arcade-section" aria-labelledby="problems-title">
        <div className="arcade-section__head">
          <div>
            <h2 id="problems-title" className="arcade-h2">
              The problem map
            </h2>
            <p className="arcade-section__sub">
              Ten worlds, seventy-five levels — the “Blind 75”, the interview prep list that spread through the Blind forum in 2018 and never went away.
            </p>
          </div>
        </div>

        <div className="hub__filters">
          <input
            type="search"
            className="hub__search"
            placeholder="Search by name, number or pattern…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search problems"
          />
          <div className="hub__chips" role="group" aria-label="Difficulty">
            {DIFFICULTIES.map((d) => (
              <button key={d} type="button" className={"achip" + (difficulty === d ? " achip--on" : "")} onClick={() => setDifficulty(d)} aria-pressed={difficulty === d}>
                {d}
              </button>
            ))}
          </div>
          <div className="hub__chips" role="group" aria-label="Progress">
            {STATUSES.map((s) => (
              <button key={s.id} type="button" className={"achip" + (status === s.id ? " achip--on" : "")} onClick={() => setStatus(s.id)} aria-pressed={status === s.id}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="hub__chips hub__chips--worlds" role="group" aria-label="World">
            <button type="button" className={"achip" + (world === "all" ? " achip--on" : "")} onClick={() => setWorld("all")} aria-pressed={world === "all"}>
              All worlds
            </button>
            {WORLDS.map((w) => (
              <button key={w.id} type="button" className={"achip" + (world === w.id ? " achip--on" : "")} onClick={() => setWorld(w.id)} aria-pressed={world === w.id}>
                {w.emoji} {w.name}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="hub__empty">
            <p>Nothing matches those filters.</p>
            {filtersActive ? (
              <button
                type="button"
                className="achip achip--on"
                onClick={() => {
                  setQuery("");
                  setDifficulty("All");
                  setStatus("all");
                  setWorld("all");
                }}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}

        {WORLDS.map((w) => {
          const inWorld = visible.filter((p) => p.world === w.id);
          if (!inWorld.length) return null;
          const total = PROBLEMS.filter((p) => p.world === w.id);
          const done = total.filter((p) => statusOf(p.slug) === "mastered").length;
          return (
            <div key={w.id} className="world">
              <div className="world__head">
                <span className="world__emoji" aria-hidden="true">
                  {w.emoji}
                </span>
                <div className="world__text">
                  <h3 className="world__name">{w.name}</h3>
                  <p className="world__blurb">{w.blurb}</p>
                </div>
                <div className="world__progress">
                  <span>
                    {done}/{total.length} mastered
                  </span>
                  <span className="meter" style={{ "--meter": "var(--color-accent-2)" }} aria-hidden="true">
                    <span className="meter__fill" style={{ width: (done / total.length) * 100 + "%" }} />
                  </span>
                </div>
              </div>
              <div className="world__grid">
                {inWorld.map((p) => (
                  <ProblemCard key={p.slug} problem={p} status={statusOf(p.slug)} record={record(p.slug)} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
