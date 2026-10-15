import { useState } from "react";
import { Link } from "react-router-dom";
import { CodeBlock } from "../../dsa/components/CodeBlock";
import { rich } from "../../dsa/engine/views/format";
import { sfx } from "../../lib/sound";

const TABS = [
  { id: "simple", label: "🧸 In plain words" },
  { id: "deep", label: "⚙️ How it works" },
  { id: "interview", label: "🎤 Interview" },
];

const NEXT = { simple: ["deep", "how it works"], deep: ["interview", "the interview answer"] };

/**
 * One concept, three ways in: the analogy first, then the real mechanics,
 * then exactly what to say — and the follow-up that trips people up.
 */
export function ConceptCard({ concept, learned, onToggle, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState("simple");
  const bodyId = "concept-body-" + concept.id;

  function toggleOpen() {
    if (open) sfx.close();
    else sfx.open();
    setOpen(!open);
  }

  return (
    <article id={concept.id} className={"concept" + (open ? " is-open" : "") + (learned ? " is-learned" : "")}>
      <button type="button" className="concept__head" aria-expanded={open} aria-controls={bodyId} onClick={toggleOpen}>
        <span className="concept__emoji" aria-hidden="true">
          {concept.emoji}
        </span>
        <span className="concept__names">
          <span className="concept__title">{concept.title}</span>
          {!open ? <span className="concept__teaser">{concept.simple}</span> : null}
        </span>
        <span className="concept__badges">
          {concept.hot ? <span className="achip achip--sm achip--accent">🔥 asked a lot</span> : null}
          {learned ? <span className="achip achip--sm achip--on">✓ got it</span> : null}
        </span>
        <span className="concept__chev" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>

      {open ? (
        <div id={bodyId} className="concept__body">
          <div className="concept__tabs" role="tablist" aria-label={concept.title}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={"concept__tab" + (tab === t.id ? " is-on" : "")}
                onClick={() => {
                  setTab(t.id);
                  sfx.click();
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="concept__panel" role="tabpanel">
            {tab === "simple" ? (
              <>
                <p className="concept__simple">{rich(concept.simple)}</p>
                {concept.lab ? (
                  <Link to={"/java/lab/" + concept.lab} className="concept__lab" onClick={sfx.click}>
                    🧪 Play with it in the lab →
                  </Link>
                ) : null}
              </>
            ) : null}

            {tab === "deep" ? (
              <>
                <ul className="concept__points">
                  {concept.points.map((p, i) => (
                    <li key={i}>{rich(p)}</li>
                  ))}
                </ul>
                {concept.code ? <CodeBlock code={concept.code} lang={concept.lang || "java"} /> : null}
              </>
            ) : null}

            {tab === "interview" ? (
              <>
                <blockquote className="concept__say">
                  <span className="arcade-eyebrow">🎤 Say this</span>
                  <p>{rich(concept.say)}</p>
                </blockquote>
                <div className="concept__trap">
                  <span className="arcade-eyebrow">⚠️ The follow-up trap</span>
                  <p>{rich(concept.trap)}</p>
                </div>
              </>
            ) : null}
          </div>

          <div className="concept__foot">
            <button type="button" className={"concept__got" + (learned ? " is-on" : "")} aria-pressed={learned} onClick={() => onToggle(concept.id)}>
              {learned ? "✓ Understood" : "💡 I get it now"}
            </button>
            {NEXT[tab] ? (
              <button type="button" className="concept__next" onClick={() => setTab(NEXT[tab][0])}>
                Next: {NEXT[tab][1]} →
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
