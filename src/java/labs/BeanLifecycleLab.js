import { useState } from "react";
import { Btn, Panel, Say } from "./kit";
import { sfx } from "../../lib/sound";
import "./BeanLifecycleLab.css";

const STEPS = [
  { id: "instantiate", title: "Instantiate", detail: "The constructor runs — constructor injection happens right here." },
  { id: "populate", title: "Populate properties", detail: "@Autowired fields and setter dependencies are injected." },
  { id: "aware", title: "Aware callbacks", detail: "setBeanName(), setApplicationContext() and friends." },
  { id: "bpp-before", title: "BeanPostProcessor · before init", detail: "Every post-processor's postProcessBeforeInitialization()." },
  { id: "post-construct", title: "@PostConstruct", detail: "Your init code, with every dependency already in place." },
  { id: "init", title: "afterPropertiesSet() → init-method", detail: "InitializingBean's callback, then any custom init method." },
  { id: "bpp-after", title: "BeanPostProcessor · after init", detail: "postProcessAfterInitialization() — AOP proxies for @Transactional and @Async are made here." },
  { id: "ready", title: "Ready for use", detail: "The bean — or its proxy — is injected wherever it's needed." },
  { id: "destroy", title: "@PreDestroy → destroy()", detail: "When the context closes. Singletons only." },
];

// A fixed shuffle, so the board looks the same on every visit.
const SHUFFLE = [4, 0, 7, 2, 8, 5, 1, 6, 3];

const ORDER_INTRO = "Spring is about to create a bean. Click the lifecycle steps **in the order they happen**, starting with the very first.";
const SCOPE_INTRO =
  "The context has started, and singletons are created eagerly at startup — so CartService already exists. Ask the context for beans and compare what comes back.";

function hashOf(n) {
  return (0x1b2c + n * 0x2f9).toString(16);
}

function freshContext() {
  const singleton = "CartService@" + hashOf(1);
  return { singleton, singletonGets: 0, prototypes: [], counter: 1, closed: false, log: ["context started → " + singleton + " created eagerly"] };
}

const CART_CODE = ["@Service", "public class CartService {", "    @PreDestroy", '    void goodbye() { log.info("bye"); }', "}"];
const REPORT_CODE = ["@Component", '@Scope("prototype")', "public class ReportBuilder {", "    @PreDestroy", '    void goodbye() { log.info("bye"); }', "}"];

export function BeanLifecycleLab({ complete }) {
  const [placed, setPlaced] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState(null);
  const [say, setSay] = useState({ text: ORDER_INTRO });

  const [ctx, setCtx] = useState(freshContext);
  const [scopeSay, setScopeSay] = useState({ text: SCOPE_INTRO });

  const remaining = SHUFFLE.map((i) => STEPS[i]).filter((s) => !placed.includes(s.id));

  function pick(step) {
    const expected = STEPS[placed.length];
    if (step.id !== expected.id) {
      setMistakes((m) => m + 1);
      setShake({ id: step.id, n: Date.now() });
      setSay({ text: "Not yet — **" + step.title + "** comes later. What has to exist before that can happen?", tone: "bad" });
      sfx.error();
      return;
    }

    const next = [...placed, step.id];
    setPlaced(next);
    setShake(null);
    if (next.length === STEPS.length) {
      setSay({
        text:
          "That's the whole lifecycle" + (mistakes ? " (" + mistakes + " wrong guess" + (mistakes === 1 ? "" : "es") + " on the way)" : ", first try") +
          ". The detail interviewers love: proxies are created in the **after-init** post-processor, so what gets injected elsewhere is the proxy, not your class.",
        tone: "good",
      });
      complete("order");
      sfx.success();
    } else {
      setSay({ text: "✓ **" + step.title + "** — " + step.detail });
      sfx.click();
    }
  }

  function restartOrder() {
    setPlaced([]);
    setMistakes(0);
    setShake(null);
    setSay({ text: ORDER_INTRO });
    sfx.close();
  }

  function getSingleton() {
    const gets = ctx.singletonGets + 1;
    setCtx({ ...ctx, singletonGets: gets, log: [...ctx.log, "getBean(CartService.class) → " + ctx.singleton + " (the same one)"] });
    if (gets >= 2) {
      setScopeSay({ text: "Every call returns **" + ctx.singleton + "**. One instance per context, shared by every caller and every thread — so keep singletons stateless.", tone: "good" });
      complete("singleton-same");
    } else {
      setScopeSay({ text: "You got " + ctx.singleton + ", created at startup. Ask again and compare." });
    }
    sfx.click();
  }

  function getPrototype() {
    const n = ctx.counter + 1;
    const instance = "ReportBuilder@" + hashOf(n);
    const prototypes = [...ctx.prototypes, instance];
    setCtx({ ...ctx, counter: n, prototypes, log: [...ctx.log, "getBean(ReportBuilder.class) → " + instance + " (brand new)"] });
    if (prototypes.length >= 2) {
      setScopeSay({ text: "Another **new** instance: " + prototypes.join(", ") + ". Prototype scope means a fresh object on every request.", tone: "good" });
      complete("prototype-new");
    } else {
      setScopeSay({ text: "Prototypes are created on demand: " + instance + ". Ask again." });
    }
    sfx.click();
  }

  function close() {
    if (!ctx.prototypes.length) {
      setScopeSay({ text: "Ask for at least one ReportBuilder first, so you can see who gets a goodbye.", tone: "bad" });
      sfx.error();
      return;
    }
    setCtx({
      ...ctx,
      closed: true,
      log: [
        ...ctx.log,
        "context.close()",
        ctx.singleton + ": @PreDestroy called ✓",
        ...ctx.prototypes.map((p) => p + ": no callback — Spring stopped tracking it once handed over"),
      ],
    });
    setScopeSay({
      text: "Only the singleton got its **@PreDestroy**. Spring hands prototypes over and forgets them, so cleaning them up is your job.",
      tone: "good",
    });
    complete("close");
    sfx.success();
  }

  function reopen() {
    setCtx(freshContext());
    setScopeSay({ text: SCOPE_INTRO });
    sfx.close();
  }

  return (
    <div className="lab bean">
      <Panel title="Part 1 · Put a bean's life in order">
        <div className="bean__board">
          <ol className="bean__timeline">
            {STEPS.map((s, i) => {
              const done = i < placed.length;
              return (
                <li key={s.id} className={done ? "is-done" : i === placed.length ? "is-next" : ""}>
                  <span className="bean__num">{i + 1}</span>
                  {done ? (
                    <span className="bean__text">
                      <strong>{s.title}</strong>
                      <span className="bean__detail">{s.detail}</span>
                    </span>
                  ) : (
                    <span className="bean__blank">{i === placed.length ? "what happens next?" : ""}</span>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="bean__pool">
            <span className="lab-label">Pick the next step</span>
            {remaining.map((s) => {
              const shaking = shake && shake.id === s.id;
              return (
                <Btn key={s.id + (shaking ? shake.n : "")} className={shaking ? "lab-shake" : ""} onClick={() => pick(s)}>
                  {s.title}
                </Btn>
              );
            })}
            {!remaining.length ? <p className="lab-note">🫘 Born, used and retired.</p> : null}
            {placed.length ? (
              <Btn variant="ghost" onClick={restartOrder}>
                ↺ Start over
              </Btn>
            ) : null}
          </div>
        </div>
      </Panel>

      <Say tone={say.tone}>{say.text}</Say>

      <Panel title="Part 2 · Singleton vs prototype">
        <div className="lab-grid">
          <div className="bean__card">
            <pre className="lab-code">
              {CART_CODE.map((line, i) => (
                <span key={i} className="lab-code__line">
                  {line}
                </span>
              ))}
            </pre>
            <Btn variant="primary" onClick={getSingleton} disabled={ctx.closed}>
              context.getBean(CartService.class)
            </Btn>
          </div>
          <div className="bean__card">
            <pre className="lab-code">
              {REPORT_CODE.map((line, i) => (
                <span key={i} className="lab-code__line">
                  {line}
                </span>
              ))}
            </pre>
            <Btn variant="primary" onClick={getPrototype} disabled={ctx.closed}>
              context.getBean(ReportBuilder.class)
            </Btn>
          </div>
        </div>
        <div className="lab-row">
          {ctx.closed ? (
            <Btn variant="ghost" onClick={reopen}>
              ↺ Start a new context
            </Btn>
          ) : (
            <Btn variant="danger" onClick={close}>
              context.close()
            </Btn>
          )}
          <span className="lab-chip is-active">1 × CartService</span>
          <span className="lab-chip">
            {ctx.prototypes.length} × ReportBuilder
          </span>
        </div>
        <ol className="lab-log">
          {ctx.log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </Panel>

      <Say tone={scopeSay.tone}>{scopeSay.text}</Say>
    </div>
  );
}
