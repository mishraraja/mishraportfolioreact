import { useState } from "react";
import { motion } from "framer-motion";
import { Btn, Panel, Say, Segmented } from "./kit";
import { CodeBlock } from "../../dsa/components/CodeBlock";
import { sfx } from "../../lib/sound";
import "./NPlusOneLab.css";

const ROUND_TRIP_MS = 4;
const BATCH = 10;
const SHOWN = 8;

const STRATEGIES = [
  {
    id: "lazy",
    label: "LAZY (default)",
    code: `@OneToMany(mappedBy = "author")          // LAZY by default
private List<Book> books;

authorRepository.findAll()
    .forEach(a -> report(a.getName(), a.getBooks().size()));`,
  },
  {
    id: "eager",
    label: "EAGER",
    code: `@OneToMany(mappedBy = "author", fetch = FetchType.EAGER)
private List<Book> books;

authorRepository.findAll()
    .forEach(a -> report(a.getName(), a.getBooks().size()));`,
  },
  {
    id: "join",
    label: "JOIN FETCH",
    code: `@Query("select distinct a from Author a left join fetch a.books")
List<Author> findAllWithBooks();

authorRepository.findAllWithBooks()
    .forEach(a -> report(a.getName(), a.getBooks().size()));`,
  },
  {
    id: "graph",
    label: "@EntityGraph",
    code: `@Override
@EntityGraph(attributePaths = "books")
List<Author> findAll();

authorRepository.findAll()
    .forEach(a -> report(a.getName(), a.getBooks().size()));`,
  },
  {
    id: "batch",
    label: "@BatchSize(10)",
    code: `@OneToMany(mappedBy = "author")
@BatchSize(size = 10)                     // load books for 10 authors at a time
private List<Book> books;

authorRepository.findAll()
    .forEach(a -> report(a.getName(), a.getBooks().size()));`,
  },
];

const AUTHORS_SQL = "select a.id, a.name from author a";

function queriesFor(strategy, n) {
  if (strategy === "join" || strategy === "graph") {
    return ["select a.id, a.name, b.id, b.title from author a left join book b on b.author_id = a.id"];
  }
  if (strategy === "batch") {
    const out = [AUTHORS_SQL];
    for (let start = 0; start < n; start += BATCH) {
      const size = Math.min(BATCH, n - start);
      out.push("select b.* from book b where b.author_id in (" + Array(size).fill("?").join(", ") + ")");
    }
    return out;
  }
  const out = [AUTHORS_SQL];
  for (let i = 1; i <= n; i += 1) out.push("select b.* from book b where b.author_id = ?   -- " + i);
  return out;
}

function explain(strategy, n, count) {
  if (strategy === "lazy") {
    return (
      "**" + count + " queries**: 1 for the authors, then 1 more per author the moment `getBooks()` is touched. That's N+1 — invisible with 3 rows in dev, painful with " + n + " in production." +
      (n < 20 ? " Drag the slider to 20 or more and run it again." : "")
    );
  }
  if (strategy === "eager") {
    return "Still **" + count + " queries**. EAGER doesn't mean “joined”: for `findAll()` Hibernate loads the authors, then fires one query per collection straight away. Same problem, just earlier.";
  }
  if (strategy === "join") {
    return "**1 query.** A fetch join brings authors and books back together. One caution: combined with pagination, Hibernate pages in memory — use it with a query that isn't paged.";
  }
  if (strategy === "graph") {
    return "**1 query.** The entity graph tells Spring Data to fetch books with the authors — same SQL as the fetch join, no JPQL needed.";
  }
  return "**" + count + " queries**: the authors, then books for up to " + BATCH + " authors at a time with an IN clause. A good fix when you can't touch every query.";
}

export function NPlusOneLab({ complete }) {
  const [n, setN] = useState(10);
  const [strategy, setStrategy] = useState("lazy");
  const [run, setRun] = useState(null);

  const current = STRATEGIES.find((s) => s.id === strategy);

  function execute() {
    const queries = queriesFor(strategy, n);
    setRun({ strategy, n, queries, key: Date.now() });

    if (strategy === "lazy" && n >= 20) complete("n-plus-one");
    if (strategy === "eager" && n >= 2) complete("eager-trap");
    if (strategy === "join" || strategy === "graph") complete("fixed");
    if (strategy === "batch" && n > BATCH) complete("batch");

    if (queries.length > 1 + Math.ceil(n / BATCH)) sfx.error();
    else sfx.success();
  }

  const worst = run ? run.n + 1 : 1;

  return (
    <div className="lab nplus">
      <div className="lab-grid">
        <Panel title="1 · The report">
          <label className="nplus__slider">
            <span className="lab-label">
              authors in the database: <strong className="t-accent">{n}</strong>
            </span>
            <input type="range" className="lab-range" min="1" max="50" value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Number of authors" />
          </label>
          <Segmented label="Fetch strategy" options={STRATEGIES.map((s) => ({ id: s.id, label: s.label }))} value={strategy} onChange={setStrategy} />
          <Btn variant="primary" onClick={execute}>
            ▶ Run the report
          </Btn>
        </Panel>
        <Panel title="2 · The code">
          <CodeBlock code={current.code} lang="java" />
        </Panel>
      </div>

      {run ? (
        <>
          <Say tone={run.queries.length > 1 + Math.ceil(run.n / BATCH) ? "bad" : "good"}>{explain(run.strategy, run.n, run.queries.length)}</Say>
          <div className="nplus__results">
            <Panel title="Round trips to the database" className="nplus__meter">
              <motion.span key={run.key} className="nplus__count" initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                {run.queries.length}
              </motion.span>
              <span className="lab-note">
                ≈ {run.queries.length * ROUND_TRIP_MS} ms of network alone, at {ROUND_TRIP_MS} ms per round trip
              </span>
              <span className="meter" style={{ "--meter": run.queries.length > 2 ? "var(--color-danger)" : "var(--color-success)" }} aria-hidden="true">
                <span className="meter__fill" style={{ width: (run.queries.length / worst) * 100 + "%" }} />
              </span>
            </Panel>
            <Panel title="Hibernate SQL log" className="nplus__log">
              <ol className="lab-log">
                {run.queries.slice(0, SHOWN).map((q, i) => (
                  <motion.li key={run.key + "-" + i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    {q}
                  </motion.li>
                ))}
                {run.queries.length > SHOWN ? <li className="nplus__more">… and {run.queries.length - SHOWN} more</li> : null}
              </ol>
            </Panel>
          </div>
        </>
      ) : (
        <Say>A report lists every author with their number of books. Pick how many authors there are and a fetch strategy, then run it and count the queries.</Say>
      )}
    </div>
  );
}
