import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WORLDS, getWorld } from "../data/worlds";
import { CONCEPTS, conceptsInWorld } from "../data";
import { LABS, getLab, labsInWorld } from "../labs";
import { useJavaProgress } from "../progress";
import { useTitle } from "../../dsa/useTitle";
import { sfx } from "../../lib/sound";

const TOOLS = [
  {
    to: "/java/labs",
    emoji: "🧪",
    title: LABS.length + " hands-on labs",
    desc: "Break a HashMap, deadlock two threads, roll back a transaction, rebase a branch. Every lab has missions to clear.",
  },
  {
    to: "/java/play/this-or-that",
    emoji: "⚖️",
    title: "This or That",
    desc: "Rapid fire: ArrayList or LinkedList? PUT or POST? Mock or spy? Answer before the clock does.",
  },
  {
    to: "/java/play/guess-output",
    emoji: "🖨️",
    title: "Guess the Output",
    desc: "Short snippets with a twist — the Integer cache, finally, lazy streams, @Transactional self-calls.",
  },
  {
    to: "/java/revise",
    emoji: "📜",
    title: "Revision Sheet",
    desc: "Every interview one-liner and follow-up trap on one searchable page. Read it the night before.",
  },
];

const STEPS = [
  ["🧸", "Read it simply", "Every concept opens with a plain-words analogy — the jargon comes after you already get the idea."],
  ["🧪", "Break it in a lab", "Hard ideas click when you cause the bug yourself: lose an update, trip a breaker, deadlock two threads."],
  ["👾", "Beat the boss", "Each world ends with five real interview questions. One mistake allowed."],
];

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

export function JavaHub() {
  useTitle("Backend Arcade — Java backend interview prep you can play");
  const { state, xp, level, next, levelProgress, streak, learned, labRecord, bossRecord } = useJavaProgress();
  const navigate = useNavigate();

  const understood = CONCEPTS.filter((c) => learned(c.id)).length;
  const cleared = LABS.filter((l) => labRecord(l.id).done).length;
  const beaten = WORLDS.filter((w) => (bossRecord(w.id) || {}).won).length;

  const resume = useMemo(() => {
    const path = state.last || "";
    const lab = path.match(/^\/java\/lab\/([^/]+)$/);
    if (lab && getLab(lab[1])) return { to: path, label: getLab(lab[1]).title };
    const world = path.match(/^\/java\/([^/]+)$/);
    if (world && getWorld(world[1])) return { to: path, label: getWorld(world[1]).name };
    return null;
  }, [state.last]);

  function randomLab() {
    const pool = LABS.filter((l) => !labRecord(l.id).done);
    const list = pool.length ? pool : LABS;
    const lab = list[Math.floor(Math.random() * list.length)];
    sfx.open();
    navigate("/java/lab/" + lab.id);
  }

  return (
    <div className="jhub">
      <header className="hub__hero jhub__hero">
        <span className="arcade-eyebrow">Free · No sign-up · Built from real Java backend interviews</span>
        <h1 className="arcade-title">
          Hard backend topics.
          <br />
          Made playable.
        </h1>
        <p className="arcade-lede">
          Core Java to Spring Boot, SQL to Git — the topics a Java backend interview actually walks through. Each idea starts in <strong>plain words</strong>, then
          you break it in a lab, then you prove it against a boss.
        </p>
        <div className="hub__cta">
          {resume ? (
            <Link to={resume.to} className="hub__btn hub__btn--primary" onClick={sfx.click}>
              Continue: {resume.label} →
            </Link>
          ) : (
            <Link to="/java/core-java" className="hub__btn hub__btn--primary" onClick={sfx.click}>
              Start with Core Java →
            </Link>
          )}
          <button type="button" className="hub__btn" onClick={randomLab}>
            🎲 Random lab
          </button>
          <Link to="/java/play/this-or-that" className="hub__btn" onClick={sfx.click}>
            ⚖️ Play This or That
          </Link>
        </div>
      </header>

      <section className="hub__stats" aria-label="Your progress">
        <StatTile
          label={`Level · ${level.emoji} ${level.name}`}
          value={`${xp} XP`}
          meter={levelProgress}
          meterColor="var(--color-accent)"
          detail={next ? `${next.min - xp} XP to ${next.emoji} ${next.name}` : "Top level reached"}
        />
        <StatTile label="Concepts understood" value={`${understood} / ${CONCEPTS.length}`} meter={understood / CONCEPTS.length} meterColor="var(--color-accent-2)" />
        <StatTile label="Labs cleared" value={`${cleared} / ${LABS.length}`} meter={cleared / LABS.length} meterColor="var(--color-accent-3)" />
        <StatTile
          label="Bosses beaten"
          value={`${beaten} / ${WORLDS.length}`}
          detail={streak ? `🔥 ${streak}-day streak` : "Play anything today to start a streak"}
        />
      </section>

      <section className="arcade-section" aria-labelledby="jhub-how">
        <div className="arcade-section__head">
          <div>
            <h2 id="jhub-how" className="arcade-h2">
              How it works
            </h2>
            <p className="arcade-section__sub">Three steps per idea. Most people stop after the first; interviews test the other two.</p>
          </div>
        </div>
        <ol className="jsteps">
          {STEPS.map(([icon, title, text], i) => (
            <li key={title} className="jsteps__step">
              <span className="jsteps__num">{i + 1}</span>
              <span className="jsteps__icon" aria-hidden="true">
                {icon}
              </span>
              <strong>{title}</strong>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="arcade-section" aria-labelledby="jhub-worlds">
        <div className="arcade-section__head">
          <div>
            <h2 id="jhub-worlds" className="arcade-h2">
              Ten worlds
            </h2>
            <p className="arcade-section__sub">
              {CONCEPTS.length} concept cards, {LABS.length} labs and {WORLDS.length} bosses, in the order interviews usually go.
            </p>
          </div>
        </div>
        <div className="jhub__worlds">
          {WORLDS.map((w, i) => {
            const cards = conceptsInWorld(w.id);
            const got = cards.filter((c) => learned(c.id)).length;
            const labs = labsInWorld(w.id);
            const labsDone = labs.filter((l) => labRecord(l.id).done).length;
            const boss = bossRecord(w.id);
            return (
              <Link key={w.id} to={"/java/" + w.id} className={"jworld" + (boss && boss.won ? " is-beaten" : "")} onPointerEnter={sfx.hover}>
                <span className="jworld__top">
                  <span className="jworld__emoji" aria-hidden="true">
                    {w.emoji}
                  </span>
                  <span className="jworld__num">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className="jworld__name">{w.name}</span>
                <span className="jworld__tagline">{w.tagline}</span>
                <span className="jworld__meta">
                  <span>
                    💡 {got}/{cards.length}
                  </span>
                  {labs.length ? (
                    <span>
                      🧪 {labsDone}/{labs.length}
                    </span>
                  ) : null}
                  <span>{boss && boss.won ? "🏆 beaten" : "👾 boss"}</span>
                </span>
                <span className="meter" style={{ "--meter": "var(--color-accent-2)" }} aria-hidden="true">
                  <span className="meter__fill" style={{ width: (got / cards.length) * 100 + "%" }} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="arcade-section" aria-labelledby="jhub-tools">
        <div className="arcade-section__head">
          <div>
            <h2 id="jhub-tools" className="arcade-h2">
              Play & revise
            </h2>
            <p className="arcade-section__sub">For when you have ten minutes, or the interview is tomorrow.</p>
          </div>
        </div>
        <div className="hub__toolkit">
          {TOOLS.map((t) => (
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
    </div>
  );
}
