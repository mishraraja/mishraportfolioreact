import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProblem, neighbours, leetcodeUrl } from "../data";
import { getWorld } from "../data/worlds";
import { getPattern } from "../data/patterns";
import { useProgress, isDue } from "../progress";
import { Player } from "../engine/Player";
import { CodeBlock } from "../components/CodeBlock";
import { Quiz } from "../components/Quiz";
import { StatusBadge } from "../components/ProblemCard";
import { useTitle } from "../useTitle";
import "./ProblemPage.css";

export function ProblemPage() {
  const { slug } = useParams();
  const problem = getProblem(slug);
  const { visit, watched, predicted, mastered, statusOf, record } = useProgress();
  const [revealed, setRevealed] = useState(false);

  useTitle(problem ? `${problem.title} — DSA Arcade` : "Problem not found — DSA Arcade");

  useEffect(() => {
    setRevealed(false);
    if (problem) visit(problem.slug);
  }, [problem, visit]);

  const onFinish = useCallback(() => {
    if (!problem) return;
    watched(problem.slug);
    setRevealed(true);
  }, [problem, watched]);

  if (!problem) {
    return (
      <div className="arcade-missing">
        <span className="arcade-eyebrow">404 · level not found</span>
        <h1 className="arcade-title">That level doesn't exist.</h1>
        <p className="arcade-lede">There's no problem called “{slug}”. It may have been renamed — the map has all 75.</p>
        <Link to="/dsa" className="achip achip--on">
          ← Back to the problem map
        </Link>
      </div>
    );
  }

  const world = getWorld(problem.world);
  const pattern = getPattern(problem.pattern);
  const { prev, next } = neighbours(problem.slug);
  const rec = record(problem.slug);

  return (
    <article className="pp">
      <header className="pp__head">
        <nav className="pp__crumbs" aria-label="Breadcrumb">
          <Link to="/dsa">← All problems</Link>
          <span aria-hidden="true">/</span>
          <span>
            {world.emoji} {world.name}
          </span>
        </nav>

        <div className="pp__title-row">
          <span className="pp__emoji" aria-hidden="true">
            {problem.emoji}
          </span>
          <div className="pp__title-text">
            <h1 className="pp__title">{problem.title}</h1>
            <div className="pp__meta">
              <span className={"diff diff--" + problem.difficulty}>{problem.difficulty}</span>
              <Link to={"/dsa/learn/patterns#" + pattern.id} className="achip">
                {pattern.emoji} {pattern.name}
              </Link>
              <a href={leetcodeUrl(problem)} className="achip" target="_blank" rel="noreferrer">
                LeetCode #{problem.lc} ↗
              </a>
              <StatusBadge status={statusOf(problem.slug)} record={rec} />
            </div>
          </div>
        </div>

        <p className="pp__statement">{problem.statement}</p>
      </header>

      <div className="pp__intro">
        <section className="acard pp__story">
          <h2>
            <span aria-hidden="true">📖</span> The story
          </h2>
          <p>{problem.story}</p>
        </section>
        <section className={"acard pp__trick" + (revealed ? " is-revealed" : "")}>
          <h2>
            <span aria-hidden="true">💡</span> The trick
          </h2>
          {revealed ? (
            <p>{problem.insight}</p>
          ) : (
            <>
              <p className="pp__tease">Try to spot it yourself while the animation plays. It reveals itself when you reach the end.</p>
              <button type="button" className="achip achip--accent" onClick={() => setRevealed(true)}>
                I'm stuck — show me
              </button>
            </>
          )}
        </section>
      </div>

      <section className="pp__play" aria-labelledby="play-title">
        <h2 id="play-title" className="pp__h2">
          <span aria-hidden="true">🎮</span> Play it
        </h2>
        <Player key={problem.slug} problem={problem} onFinish={onFinish} onPredict={predicted} />
      </section>

      <div className="pp__learn">
        <section className="acard pp__code" aria-labelledby="code-title">
          <h2 id="code-title">
            <span aria-hidden="true">👩‍💻</span> Code it
          </h2>
          <CodeBlock java={problem.java} python={problem.python} />
        </section>

        <aside className="pp__side">
          <section className="acard">
            <h2>
              <span aria-hidden="true">⏱️</span> Complexity
            </h2>
            <dl className="pp__cx">
              <div>
                <dt>Time</dt>
                <dd>{problem.complexity.time}</dd>
              </div>
              <div>
                <dt>Space</dt>
                <dd>{problem.complexity.space}</dd>
              </div>
            </dl>
            <p className="pp__muted">{problem.complexity.why}</p>
          </section>

          {problem.levelUp ? (
            <section className="acard pp__levelup">
              <h2>
                <span aria-hidden="true">🚀</span> Level up
              </h2>
              <p className="pp__muted">{problem.levelUp}</p>
            </section>
          ) : null}

          <section className="acard pp__quiz">
            <h2>
              <span aria-hidden="true">⭐</span> Master it
            </h2>
            <Quiz key={problem.slug} problem={problem} record={rec} due={isDue(rec)} onSolved={() => mastered(problem.slug)} />
          </section>
        </aside>
      </div>

      <nav className="pp__nav" aria-label="More problems">
        {prev ? (
          <Link to={"/dsa/" + prev.slug} className="pp__navcard">
            <span className="pp__navdir">← Previous</span>
            <span>
              {prev.emoji} {prev.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={"/dsa/" + next.slug} className="pp__navcard pp__navcard--next">
            <span className="pp__navdir">Next →</span>
            <span>
              {next.emoji} {next.title}
            </span>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
