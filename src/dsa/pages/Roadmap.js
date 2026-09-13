import { useState } from "react";
import { Link } from "react-router-dom";
import { getProblem } from "../data";
import { ROADMAP } from "../data/roadmap";
import { getPattern } from "../data/patterns";
import { useProgress, isDue, daysUntilDue, REVIEW_DAYS } from "../progress";
import { useTitle } from "../useTitle";
import "./Learn.css";

const ICON = { mastered: "★", watched: "✓", seen: "◐", new: "○" };

const LOOP = [
  { icon: "🎬", title: "Watch", text: "Play the animation once, start to finish. Read the story before the code." },
  { icon: "🎯", title: "Predict", text: "Replay it with Predict mode on. Every wrong guess shows you where your model is off." },
  { icon: "⌨️", title: "Code from memory", text: "Close the page and write the solution yourself. Then compare with the code tab." },
  { icon: "⭐", title: "Master", text: "Answer the mastery question. That puts the problem on your review schedule." },
  { icon: "🔁", title: "Review", text: `Come back after ${REVIEW_DAYS.join(", then ")} days. Spaced reviews are what make it stick.` },
];

export function Roadmap() {
  useTitle("8-Week Roadmap — DSA Arcade");
  const { statusOf, record, reset } = useProgress();
  const [confirming, setConfirming] = useState(false);

  const slugs = ROADMAP.flatMap((w) => w.slugs);
  const total = slugs.length;
  const masteredCount = slugs.filter((s) => statusOf(s) === "mastered").length;
  const todaySlug = slugs.find((s) => statusOf(s) !== "mastered");
  const today = todaySlug ? getProblem(todaySlug) : null;
  const due = slugs.map(getProblem).filter((p) => isDue(record(p.slug)));
  const upcoming = slugs
    .map(getProblem)
    .filter((p) => {
      const r = record(p.slug);
      return r && r.mastered && !isDue(r);
    })
    .sort((a, b) => daysUntilDue(record(a.slug)) - daysUntilDue(record(b.slug)))
    .slice(0, 6);
  const currentWeek = (ROADMAP.find((w) => w.slugs.some((s) => statusOf(s) !== "mastered")) || {}).week;

  return (
    <div className="learn">
      <header className="learn__head">
        <span className="arcade-eyebrow">🗺️ 8-Week Roadmap</span>
        <h1 className="arcade-title">Eight weeks. Seventy-five problems. One at a time.</h1>
        <p className="arcade-lede">
          About an hour a day, in an order where every week makes the next one easier. Your progress fills in as you master problems, and the plan tells you
          what's due for review.
        </p>
        <div className="roadmap__overall">
          <span>
            {masteredCount} of {total} mastered
          </span>
          <span className="meter" style={{ "--meter": "var(--color-accent-2)" }} aria-hidden="true">
            <span className="meter__fill" style={{ width: (masteredCount / total) * 100 + "%" }} />
          </span>
        </div>
      </header>

      <div className="roadmap__now">
        <section className="acard roadmap__today">
          <span className="arcade-eyebrow">Today's pick</span>
          {today ? (
            <>
              <h2 className="roadmap__today-title">
                {today.emoji} {today.title}
              </h2>
              <p className="arcade-section__sub">
                Next up in week {(ROADMAP.find((w) => w.slugs.includes(today.slug)) || {}).week} · {getPattern(today.pattern).name}
              </p>
              <Link to={"/dsa/" + today.slug} className="hub__btn hub__btn--primary">
                Play it →
              </Link>
            </>
          ) : (
            <h2 className="roadmap__today-title">🏆 Every problem mastered. Keep your reviews going.</h2>
          )}
        </section>

        <section className="acard">
          <span className="arcade-eyebrow">↻ Reviews</span>
          {due.length ? (
            <>
              <p className="arcade-section__sub">
                {due.length} due now — do these before anything new.
              </p>
              <div className="roadmap__chips">
                {due.map((p) => (
                  <Link key={p.slug} to={"/dsa/" + p.slug} className="achip achip--on">
                    {p.emoji} {p.title}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p className="arcade-section__sub">Nothing due right now.</p>
          )}
          {upcoming.length ? (
            <ul className="roadmap__upcoming">
              {upcoming.map((p) => (
                <li key={p.slug}>
                  <span>{p.title}</span>
                  <span className="roadmap__when">in {daysUntilDue(record(p.slug))}d</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>

      <section className="arcade-section" aria-labelledby="loop-title">
        <h2 id="loop-title" className="arcade-h2">
          The daily loop
        </h2>
        <ol className="loop">
          {LOOP.map((step, i) => (
            <li key={step.title} className="loop__step">
              <span className="loop__num">{i + 1}</span>
              <span className="loop__icon" aria-hidden="true">
                {step.icon}
              </span>
              <strong>{step.title}</strong>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="arcade-section" aria-labelledby="weeks-title">
        <h2 id="weeks-title" className="arcade-h2">
          The plan
        </h2>
        <div className="weeks">
          {ROADMAP.map((w) => {
            const done = w.slugs.filter((s) => statusOf(s) === "mastered").length;
            const complete = done === w.slugs.length;
            return (
              <section key={w.week} className={"acard week" + (w.week === currentWeek ? " is-current" : "") + (complete ? " is-complete" : "")}>
                <div className="week__head">
                  <span className="week__num">Week {w.week}</span>
                  {complete ? (
                    <span className="status status--mastered">★ Complete</span>
                  ) : w.week === currentWeek ? (
                    <span className="status status--due">● You are here</span>
                  ) : null}
                </div>
                <h3 className="week__title">{w.title}</h3>
                <p className="week__why">{w.why}</p>
                <div className="week__progress">
                  <span className="meter" style={{ "--meter": "var(--color-accent-2)" }} aria-hidden="true">
                    <span className="meter__fill" style={{ width: (done / w.slugs.length) * 100 + "%" }} />
                  </span>
                  <span>
                    {done}/{w.slugs.length}
                  </span>
                </div>
                <ol className="week__list">
                  {w.slugs.map((slug) => {
                    const p = getProblem(slug);
                    const s = statusOf(slug);
                    return (
                      <li key={slug}>
                        <Link to={"/dsa/" + slug} className={"week__item week__item--" + s}>
                          <span className="week__icon" aria-label={s}>
                            {isDue(record(slug)) ? "↻" : ICON[s]}
                          </span>
                          <span className="week__name">{p.title}</span>
                          <span className={"diff diff--" + p.difficulty} title={p.difficulty}>
                            {p.difficulty[0]}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      </section>

      <section className="arcade-section roadmap__reset">
        <p className="arcade-section__sub">Progress lives only in this browser. Starting over wipes XP, streaks and every mastered problem.</p>
        {confirming ? (
          <span className="roadmap__confirm">
            <button
              type="button"
              className="achip roadmap__danger"
              onClick={() => {
                reset();
                setConfirming(false);
              }}
            >
              Yes, wipe my progress
            </button>
            <button type="button" className="achip" onClick={() => setConfirming(false)}>
              Keep it
            </button>
          </span>
        ) : (
          <button type="button" className="achip" onClick={() => setConfirming(true)}>
            Start over…
          </button>
        )}
      </section>
    </div>
  );
}
