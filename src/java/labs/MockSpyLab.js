import { useState } from "react";
import { motion } from "framer-motion";
import { Btn, Panel, Say, Segmented } from "./kit";
import { sfx } from "../../lib/sound";
import "./MockSpyLab.css";

const CLASS_CODE = [
  "class PriceService {",
  "    double basePrice(long id) {",
  "        return db.lookupPrice(id);   // real database call → 100.0",
  "    }",
  "",
  "    double discounted(long id) {",
  "        return basePrice(id) * 0.9;",
  "    }",
  "}",
];

const DOUBLES = [
  { id: "mock", label: "mock()" },
  { id: "spy", label: "spy()" },
];

const STUBS = [
  { id: "none", label: "no stubbing" },
  { id: "when", label: "when().thenReturn()" },
  { id: "doReturn", label: "doReturn().when()" },
];

const INTRO = "A mock is a cardboard stunt double; a spy is the real actor with an earpiece. Pick one, choose how to stub `basePrice`, then call methods and watch the database light.";

function setupFor(double, stub) {
  const lines = [double === "mock" ? "PriceService price = mock(PriceService.class);" : "PriceService price = spy(new PriceService(db));"];
  if (stub === "when") lines.push("when(price.basePrice(1)).thenReturn(50.0);");
  if (stub === "doReturn") lines.push("doReturn(50.0).when(price).basePrice(1);");
  // when(spy.basePrice(1)) has to call basePrice to record it — on a spy that's the real method.
  return { lines, setupHits: double === "spy" && stub === "when" ? 1 : 0 };
}

function fresh(double, stub) {
  const { lines, setupHits } = setupFor(double, stub);
  return { setup: lines, dbHits: setupHits, basePriceCalls: 0, results: [] };
}

const format = (v) => v.toFixed(1);

export function MockSpyLab({ complete }) {
  const [double, setDouble] = useState("mock");
  const [stub, setStub] = useState("none");
  const [test, setTest] = useState(() => fresh("mock", "none"));
  const [say, setSay] = useState({ text: INTRO });

  function configure(nextDouble, nextStub) {
    setDouble(nextDouble);
    setStub(nextStub);
    const t = fresh(nextDouble, nextStub);
    setTest(t);
    if (t.dbHits) {
      setSay({
        text: "Surprise: the database was hit **during setup**. `when(price.basePrice(1))` has to call basePrice to record it, and on a spy that's the real method. For spies, stub with `doReturn(50.0).when(price).basePrice(1)`.",
        tone: "bad",
      });
      complete("when-trap");
      sfx.error();
    } else {
      setSay({ text: "New test set up. Now call a method." });
      sfx.click();
    }
  }

  function call(method) {
    const stubbed = stub !== "none";
    let value;
    let db = 0;
    let base = 0;
    let text;
    let tone;

    if (method === "basePrice") {
      base = 1;
      if (stubbed) {
        value = 50;
        text = "`basePrice(1)` returned the stubbed **50.0**. No real code ran.";
      } else if (double === "mock") {
        value = 0;
        text = "An unstubbed mock method returns the type's default: **0.0**. The real method never ran.";
        tone = "good";
        complete("mock-default");
      } else {
        value = 100;
        db = 1;
        text = "The spy ran the **real** `basePrice`, so the database was queried and returned 100.0.";
        tone = "good";
        complete("spy-real");
      }
    } else if (double === "mock") {
      value = 0;
      text = "**0.0.** `discounted` isn't stubbed, and a mock never runs real code — not even a method that would call your stubbed one.";
      tone = "good";
      complete("mock-default");
    } else {
      base = 1;
      if (stubbed) {
        value = 45;
        text = "The spy ran the real `discounted`, which called `basePrice` on the spy itself — stubbed to 50.0 — so you get **45.0**, with no database call.";
        tone = "good";
        complete("forty-five");
      } else {
        value = 90;
        db = 1;
        text = "The spy ran the real `discounted`, which called the real `basePrice` — database hit — so 100.0 × 0.9 = **90.0**.";
        tone = "good";
        complete("spy-real");
      }
    }

    setTest({
      ...test,
      dbHits: test.dbHits + db,
      basePriceCalls: test.basePriceCalls + base,
      results: [...test.results, { expr: "price." + method + "(1)", value, db }].slice(-6),
    });
    setSay({ text, tone });
    if (db) sfx.error();
    else sfx.success();
  }

  return (
    <div className="lab mspy">
      <div className="lab-grid">
        <Panel title="The real class">
          <pre className="lab-code">
            {CLASS_CODE.map((line, i) => (
              <span key={i} className={"lab-code__line" + (line.includes("database") ? " mspy__db-line" : "")}>
                {line || " "}
              </span>
            ))}
          </pre>
        </Panel>

        <Panel title="Your test">
          <div className="lab-row">
            <Segmented label="Test double" options={DOUBLES} value={double} onChange={(v) => configure(v, stub)} />
          </div>
          <div className="lab-row">
            <Segmented label="Stubbing" options={STUBS} value={stub} onChange={(v) => configure(double, v)} />
          </div>
          <pre className="lab-code">
            {test.setup.map((line, i) => (
              <span key={i} className="lab-code__line">
                {line}
              </span>
            ))}
          </pre>
          <div className="lab-row">
            <Btn variant="primary" onClick={() => call("basePrice")}>
              price.basePrice(1)
            </Btn>
            <Btn variant="primary" onClick={() => call("discounted")}>
              price.discounted(1)
            </Btn>
          </div>
        </Panel>
      </div>

      <Say tone={say.tone}>{say.text}</Say>

      <div className="mspy__status">
        <Panel title="Database">
          <motion.span key={test.dbHits} className={"mspy__light" + (test.dbHits ? " is-hit" : "")} initial={{ scale: 1.25 }} animate={{ scale: 1 }}>
            🗄️ {test.dbHits}
          </motion.span>
          <span className="lab-note">real queries so far{test.setup.length && double === "spy" && stub === "when" ? " (1 during setup)" : ""}</span>
        </Panel>
        <Panel title="Results">
          {test.results.length ? (
            <dl className="lab-kv">
              {test.results.map((r, i) => (
                <div key={i}>
                  <dt>{r.expr}</dt>
                  <dd className={r.db ? "t-warn" : ""}>{format(r.value)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="lab-note">No calls yet.</p>
          )}
          <p className="lab-note">
            verify(price, times({test.basePriceCalls})).basePrice(1) ✓ — stubbing calls aren't counted, but a spy's internal calls are.
          </p>
        </Panel>
      </div>
    </div>
  );
}
