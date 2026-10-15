import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { WORLDS } from "../data/worlds";
import { CONCEPTS } from "../data";
import { useJavaProgress } from "../progress";
import { rich } from "../../dsa/engine/views/format";
import { useTitle } from "../../dsa/useTitle";

const FORMULA = [
  ["1", "Define it in one line", "“A HashMap stores key–value pairs in buckets chosen by the key's hash.”"],
  ["2", "Say why it exists", "“…so lookups are O(1) on average instead of scanning a list.”"],
  ["3", "Go one level deeper", "“Collisions chain in a bucket, and the table doubles past a 0.75 load factor.”"],
  ["4", "Close with a trade-off or a story", "“It isn't thread-safe, so for our shared cache we used ConcurrentHashMap.”"],
];

function plain(text) {
  return String(text).replace(/\*\*|`/g, "").toLowerCase();
}

export function Revise() {
  useTitle("Revision Sheet — Backend Arcade");
  const { learned } = useJavaProgress();
  const [query, setQuery] = useState("");
  const [world, setWorld] = useState("all");
  const [hotOnly, setHotOnly] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CONCEPTS.filter((c) => {
      if (world !== "all" && c.world !== world) return false;
      if (hotOnly && !c.hot) return false;
      if (q && !plain(c.title + " " + c.say + " " + c.trap + " " + c.simple).includes(q)) return false;
      return true;
    });
  }, [query, world, hotOnly]);

  function printSheet() {
    if (typeof window.print === "function") window.print();
  }

  return (
    <div className="revise">
      <header className="learn__head">
        <span className="arcade-eyebrow">📜 Revision sheet · {CONCEPTS.length} concepts</span>
        <h1 className="arcade-title">The night before.</h1>
        <p className="arcade-lede">
          Every concept as the one line to say out loud and the follow-up question that trips people up. Skim it, search it, or print it for the commute.
        </p>
      </header>

      <section className="arcade-section" aria-labelledby="formula-title">
        <h2 id="formula-title" className="arcade-h2">
          The four-beat answer
        </h2>
        <p className="arcade-section__sub">Use it for any “explain X” question. It sounds confident because it's structured.</p>
        <ol className="formula">
          {FORMULA.map(([n, title, example]) => (
            <li key={n} className="formula__step">
              <span className="formula__num">{n}</span>
              <strong>{title}</strong>
              <span>{example}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="arcade-section" aria-labelledby="sheet-title">
        <div className="arcade-section__head">
          <div>
            <h2 id="sheet-title" className="arcade-h2">
              The sheet
            </h2>
            <p className="arcade-section__sub">
              Showing {visible.length} of {CONCEPTS.length}.
            </p>
          </div>
          <button type="button" className="hub__btn revise__print" onClick={printSheet}>
            🖨️ Print
          </button>
        </div>

        <div className="hub__filters revise__filters">
          <input
            type="search"
            className="hub__search"
            placeholder="Search: volatile, N+1, rebase, @Transactional…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the revision sheet"
          />
          <div className="hub__chips" role="group" aria-label="World">
            <button type="button" className={"achip" + (world === "all" ? " achip--on" : "")} aria-pressed={world === "all"} onClick={() => setWorld("all")}>
              All worlds
            </button>
            {WORLDS.map((w) => (
              <button key={w.id} type="button" className={"achip" + (world === w.id ? " achip--on" : "")} aria-pressed={world === w.id} onClick={() => setWorld(w.id)}>
                {w.emoji} {w.name}
              </button>
            ))}
          </div>
          <div className="hub__chips">
            <button type="button" className={"achip" + (hotOnly ? " achip--accent" : "")} aria-pressed={hotOnly} onClick={() => setHotOnly(!hotOnly)}>
              🔥 Most asked only
            </button>
          </div>
        </div>

        {WORLDS.map((w) => {
          const items = visible.filter((c) => c.world === w.id);
          if (!items.length) return null;
          return (
            <div key={w.id} className="revise__world">
              <h3 className="revise__world-name">
                {w.emoji} {w.name}
              </h3>
              <div className="revise__items">
                {items.map((c) => (
                  <article key={c.id} className={"revise__item" + (learned(c.id) ? " is-learned" : "")}>
                    <div className="revise__item-head">
                      <h4>
                        {c.emoji} {c.title}
                      </h4>
                      {c.hot ? <span className="achip achip--sm achip--accent">🔥</span> : null}
                    </div>
                    <p className="revise__say">{rich(c.say)}</p>
                    <p className="revise__trap">
                      <span className="revise__trap-label">Trap</span> {rich(c.trap)}
                    </p>
                    <Link to={"/java/" + c.world + "#" + c.id} className="revise__open">
                      Open the card →
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          );
        })}

        {!visible.length ? <p className="arcade-section__sub">Nothing matches that search. Try a shorter word.</p> : null}
      </section>
    </div>
  );
}
