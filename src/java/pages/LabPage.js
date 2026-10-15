import { useCallback, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { LABS, getLab } from "../labs";
import { WORLDS, getWorld } from "../data/worlds";
import { CONCEPTS } from "../data";
import { useJavaProgress } from "../progress";
import { LabCard } from "../components/LabCard";
import { useTitle } from "../../dsa/useTitle";
import { sfx } from "../../lib/sound";

export function LabPage() {
  const { labId } = useParams();
  const lab = getLab(labId);
  useTitle(lab ? lab.title + " — Backend Arcade lab" : "Lab not found — Backend Arcade");
  const { labRecord, mission, visit } = useJavaProgress();

  useEffect(() => {
    if (lab) visit("/java/lab/" + lab.id);
  }, [lab, visit]);

  // Labs report what they notice; only the missions this lab lists count.
  const complete = useCallback(
    (missionId) => {
      if (lab && lab.missions.some((m) => m.id === missionId)) mission(lab.id, missionId, lab.missions.length);
    },
    [lab, mission]
  );

  if (!lab) {
    return (
      <div className="arcade-missing">
        <span className="arcade-eyebrow">404</span>
        <h1 className="arcade-title">That lab doesn't exist.</h1>
        <Link to="/java/labs" className="hub__btn hub__btn--primary">
          ← See every lab
        </Link>
      </div>
    );
  }

  const world = getWorld(lab.world);
  const record = labRecord(lab.id);
  const done = new Set(record.missions);
  const count = lab.missions.filter((m) => done.has(m.id)).length;
  const related = CONCEPTS.filter((c) => c.lab === lab.id);
  const index = LABS.indexOf(lab);
  const nextLab = LABS[(index + 1) % LABS.length];
  const Component = lab.Component;

  return (
    <div className="labpage">
      <header className="learn__head">
        <div className="jcrumbs">
          <Link to="/java/labs" className="jback" onClick={sfx.click}>
            ← All labs
          </Link>
          <Link to={"/java/" + world.id} className="achip achip--sm">
            {world.emoji} {world.name}
          </Link>
        </div>
        <span className="arcade-eyebrow">
          🧪 Lab {index + 1} of {LABS.length}
        </span>
        <h1 className="arcade-title">
          {lab.emoji} {lab.title}
        </h1>
        <p className="arcade-lede">{lab.blurb}</p>
      </header>

      <section className={"labpage__missions acard" + (record.done ? " is-done" : "")} aria-label="Missions">
        <div className="labpage__missions-head">
          <strong>{record.done ? "🏆 Lab cleared — every mission done" : "🎯 Missions"}</strong>
          <span className="lab-label">
            {count} / {lab.missions.length}
          </span>
        </div>
        <ul className="labpage__list">
          {lab.missions.map((m) => {
            const ok = done.has(m.id);
            return (
              <li key={m.id} className={"mission" + (ok ? " is-done" : "")}>
                <span className="mission__check" aria-hidden="true">
                  {ok ? "✓" : ""}
                </span>
                <span>{m.text}</span>
                {ok ? <span className="sr-only"> (done)</span> : null}
              </li>
            );
          })}
        </ul>
        <span className="meter" style={{ "--meter": "var(--color-accent-2)" }} aria-hidden="true">
          <span className="meter__fill" style={{ width: (count / lab.missions.length) * 100 + "%" }} />
        </span>
      </section>

      <section className="labpage__stage" aria-label={lab.title + " lab"}>
        <Component key={lab.id} complete={complete} />
      </section>

      <section className="arcade-section labpage__after">
        <div className="acard">
          <h2>What to remember</h2>
          <ul className="jticks">
            {lab.takeaways.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        {related.length ? (
          <div className="acard">
            <h2>Read the matching cards</h2>
            <div className="labpage__related">
              {related.map((c) => (
                <Link key={c.id} to={"/java/" + c.world + "#" + c.id} className="achip">
                  {c.emoji} {c.title}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <nav className="jworld-nav" aria-label="More labs">
        <Link to={"/java/" + world.id} className="jworld-nav__card" onClick={sfx.click}>
          <span className="arcade-eyebrow">← Back to the world</span>
          <span>
            {world.emoji} {world.name}
          </span>
        </Link>
        <Link to={"/java/lab/" + nextLab.id} className="jworld-nav__card jworld-nav__card--next" onClick={sfx.click}>
          <span className="arcade-eyebrow">Next lab →</span>
          <span>
            {nextLab.emoji} {nextLab.title}
          </span>
        </Link>
      </nav>
    </div>
  );
}

export function LabsIndex() {
  useTitle("Labs — Backend Arcade");
  const { labRecord } = useJavaProgress();
  const cleared = LABS.filter((l) => labRecord(l.id).done).length;
  const worlds = WORLDS.filter((w) => LABS.some((l) => l.world === w.id));

  return (
    <div className="labsindex">
      <header className="learn__head">
        <span className="arcade-eyebrow">
          🧪 {cleared} of {LABS.length} labs cleared
        </span>
        <h1 className="arcade-title">Break it to understand it.</h1>
        <p className="arcade-lede">
          {LABS.length} small machines for the ideas that never stick from reading alone. Each one has missions — clear them all for bonus XP.
        </p>
      </header>

      {worlds.map((w) => (
        <section key={w.id} className="arcade-section" aria-labelledby={"labs-" + w.id}>
          <h2 id={"labs-" + w.id} className="jlabs__world">
            {w.emoji} {w.name}
          </h2>
          <div className="jlabs">
            {LABS.filter((l) => l.world === w.id).map((l) => (
              <LabCard key={l.id} lab={l} record={labRecord(l.id)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
