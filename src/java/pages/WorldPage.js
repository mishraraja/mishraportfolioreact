import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { WORLDS, getWorld } from "../data/worlds";
import { bossFor, conceptsInWorld } from "../data";
import { labsInWorld } from "../labs";
import { XP, useJavaProgress } from "../progress";
import { ConceptCard } from "../components/ConceptCard";
import { BossFight } from "../components/BossFight";
import { LabCard } from "../components/LabCard";
import { useTitle } from "../../dsa/useTitle";
import { sfx } from "../../lib/sound";

const FILTERS = [
  { id: "all", label: "All cards" },
  { id: "hot", label: "🔥 Most asked" },
  { id: "todo", label: "Not understood yet" },
];

export function WorldPage() {
  const { worldId } = useParams();
  const { hash } = useLocation();
  const world = getWorld(worldId);
  useTitle(world ? world.name + " — Backend Arcade" : "World not found — Backend Arcade");
  const { learned, toggleConcept, labRecord, bossRecord, boss, visit, notify } = useJavaProgress();
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (world) visit("/java/" + world.id);
  }, [world, visit]);

  // Links like /java/spring#transactional open that card and bring it into view.
  useEffect(() => {
    if (!hash) return undefined;
    const timer = setTimeout(() => {
      const el = document.getElementById(hash.slice(1));
      if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(timer);
  }, [hash, worldId]);

  if (!world) {
    return (
      <div className="arcade-missing">
        <span className="arcade-eyebrow">404</span>
        <h1 className="arcade-title">That world doesn't exist.</h1>
        <Link to="/java" className="hub__btn hub__btn--primary">
          ← Back to all worlds
        </Link>
      </div>
    );
  }

  const index = WORLDS.indexOf(world);
  const prev = WORLDS[index - 1];
  const next = WORLDS[index + 1];
  const concepts = conceptsInWorld(world.id);
  const labs = labsInWorld(world.id);
  const questions = bossFor(world.id);
  const got = concepts.filter((c) => learned(c.id)).length;
  const record = bossRecord(world.id);

  const visible = concepts.filter((c) => {
    if (filter === "hot") return c.hot;
    if (filter === "todo") return !learned(c.id);
    return true;
  });

  function toggle(id) {
    const nowLearned = toggleConcept(id);
    if (nowLearned) notify("+" + XP.concept + " XP — concept understood", "💡");
  }

  function finishBoss(score, total) {
    const outcome = boss(world.id, score, total);
    if (outcome.gained) notify("+" + outcome.gained + " XP — " + world.name + " boss defeated", "🏆");
    return outcome;
  }

  return (
    <div className="jworldpage">
      <header className="learn__head jworldpage__head">
        <Link to="/java" className="jback" onClick={sfx.click}>
          ← All worlds
        </Link>
        <span className="arcade-eyebrow">
          World {index + 1} of {WORLDS.length}
        </span>
        <h1 className="arcade-title">
          <span className="jworldpage__emoji" aria-hidden="true">
            {world.emoji}
          </span>{" "}
          {world.name}
        </h1>
        <p className="arcade-lede">{world.blurb}</p>
        <div className="jworldpage__chips">
          <span className="achip achip--on">
            💡 {got} / {concepts.length} understood
          </span>
          {labs.length ? (
            <span className="achip">
              🧪 {labs.filter((l) => labRecord(l.id).done).length} / {labs.length} labs cleared
            </span>
          ) : null}
          <span className={"achip" + (record && record.won ? " achip--accent" : "")}>{record && record.won ? "🏆 boss beaten" : "👾 boss waiting"}</span>
        </div>
      </header>

      <section className="arcade-section" aria-labelledby="world-cards">
        <div className="arcade-section__head">
          <div>
            <h2 id="world-cards" className="arcade-h2">
              Concept cards
            </h2>
            <p className="arcade-section__sub">Open a card, read it in plain words first, then flip to how it works and what to say.</p>
          </div>
          <div className="hub__chips" role="group" aria-label="Filter cards">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" className={"achip" + (filter === f.id ? " achip--on" : "")} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="concepts">
          {visible.map((c) => (
            <ConceptCard key={c.id} concept={c} learned={learned(c.id)} onToggle={toggle} defaultOpen={hash === "#" + c.id} />
          ))}
          {!visible.length ? <p className="arcade-section__sub">Every card here is understood. Nice — go beat the boss.</p> : null}
        </div>
      </section>

      {labs.length ? (
        <section className="arcade-section" aria-labelledby="world-labs">
          <div className="arcade-section__head">
            <div>
              <h2 id="world-labs" className="arcade-h2">
                Labs
              </h2>
              <p className="arcade-section__sub">Don't just read about it. Cause the bug, then fix it.</p>
            </div>
          </div>
          <div className="jlabs">
            {labs.map((lab) => (
              <LabCard key={lab.id} lab={lab} record={labRecord(lab.id)} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="arcade-section" aria-labelledby="world-boss">
        <div className="arcade-section__head">
          <div>
            <h2 id="world-boss" className="arcade-h2">
              Boss fight
            </h2>
            <p className="arcade-section__sub">The questions interviewers really ask about {world.name}.</p>
          </div>
        </div>
        <BossFight key={world.id} world={world} questions={questions} record={record} onFinish={finishBoss} />
      </section>

      <nav className="jworld-nav" aria-label="Other worlds">
        {prev ? (
          <Link to={"/java/" + prev.id} className="jworld-nav__card" onClick={sfx.click}>
            <span className="arcade-eyebrow">← Previous world</span>
            <span>
              {prev.emoji} {prev.name}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={"/java/" + next.id} className="jworld-nav__card jworld-nav__card--next" onClick={sfx.click}>
            <span className="arcade-eyebrow">Next world →</span>
            <span>
              {next.emoji} {next.name}
            </span>
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
