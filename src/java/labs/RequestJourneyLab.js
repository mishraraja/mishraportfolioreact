import { useState } from "react";
import { motion } from "framer-motion";
import { Btn, Say, Segmented } from "./kit";
import { sfx } from "../../lib/sound";
import "./RequestJourneyLab.css";

const STATIONS = [
  { id: "client", label: "Client", icon: "📱" },
  { id: "filter", label: "Security filters", icon: "🛂" },
  { id: "dispatcher", label: "DispatcherServlet", icon: "🚦" },
  { id: "controller", label: "@RestController", icon: "🛎️" },
  { id: "service", label: "@Transactional service", icon: "✉️" },
  { id: "repository", label: "JPA repository", icon: "🗃️" },
  { id: "db", label: "Database", icon: "🗄️" },
  { id: "advice", label: "@RestControllerAdvice", icon: "🧯" },
];

const REASON = { 201: "Created", 400: "Bad Request", 401: "Unauthorized", 404: "Not Found", 409: "Conflict" };

const SCENARIOS = {
  ok: {
    label: "Happy path",
    mission: "ok",
    request: 'POST /api/orders   Authorization: Bearer eyJhbGci…   { "sku": "pen", "qty": 2 }',
    frames: [
      { at: "client", say: "The client sends `POST /api/orders` with a valid JWT and a JSON body." },
      { at: "filter", say: "Spring Security's filter chain validates the JWT and stores the user in the SecurityContext. Servlet filters run **before** Spring MVC does." },
      { at: "dispatcher", say: "DispatcherServlet asks its HandlerMappings who handles `POST /api/orders`, and finds `OrderController.create`." },
      { at: "controller", say: "Jackson turns the JSON into a `CreateOrder` record and `@Valid` checks it: sku present, qty positive. All good." },
      { at: "service", say: "The call goes through a **proxy**, which opens a transaction and then runs `OrderService.place()`." },
      { at: "repository", say: "`orderRepository.save(order)` — Hibernate queues an INSERT in the persistence context." },
      { at: "db", say: "At commit, Hibernate flushes the INSERT and the database confirms it." },
      { at: "service", say: "The method returned normally, so the proxy **commits** the transaction." },
      { at: "controller", say: "The controller returns `ResponseEntity.created(...)`, and Jackson writes the saved order back as JSON." },
      { at: "client", say: "**201 Created**, with a Location header pointing at the new order.", status: 201, body: '{ "id": 42, "sku": "pen", "qty": 2 }', tone: "good" },
    ],
  },
  noToken: {
    label: "No token",
    mission: "unauthorized",
    request: "POST /api/orders   (no Authorization header)",
    frames: [
      { at: "client", say: "The client forgets the Authorization header." },
      { at: "filter", say: "The security filter chain finds no credentials for a protected URL, and stops the request **right here**.", tone: "bad" },
      {
        at: "client",
        say: "**401 Unauthorized.** DispatcherServlet, your controller and even your @RestControllerAdvice never heard about this request.",
        status: 401,
        body: '{ "error": "unauthorized" }',
        tone: "bad",
      },
    ],
  },
  invalid: {
    label: "Invalid body",
    mission: "bad-request",
    request: 'POST /api/orders   { "sku": "", "qty": -3 }',
    frames: [
      { at: "client", say: "This body has an empty sku and a negative qty." },
      { at: "filter", say: "The token is fine, so the filter chain lets the request through." },
      { at: "dispatcher", say: "DispatcherServlet routes it to `OrderController.create`." },
      {
        at: "controller",
        say: "Before the method body even runs, `@Valid` fails on `@NotBlank sku` and `@Positive qty`. Spring throws **MethodArgumentNotValidException**.",
        tone: "bad",
      },
      { at: "advice", say: "The @RestControllerAdvice has an `@ExceptionHandler` for that exception, and builds a ProblemDetail listing the bad fields." },
      { at: "client", say: "**400 Bad Request.** The service and the database were never touched.", status: 400, body: '{ "title": "Bad Request", "fields": ["sku", "qty"] }', tone: "bad" },
    ],
  },
  notFound: {
    label: "Not found",
    mission: "not-found",
    request: "GET /api/orders/999",
    frames: [
      { at: "client", say: "The client asks for order 999, which doesn't exist." },
      { at: "filter", say: "Authenticated, so it passes the filter chain." },
      { at: "dispatcher", say: "Routed to `OrderController.get(999)`." },
      { at: "controller", say: "The controller calls `orderService.find(999)`." },
      { at: "service", say: "The proxy opens a read-only transaction around the service call." },
      { at: "repository", say: "`findById(999)` runs a SELECT." },
      { at: "db", say: "No rows come back." },
      { at: "service", say: "`orElseThrow()` throws **OrderNotFoundException**. It's unchecked, so the proxy rolls the transaction back.", tone: "bad" },
      { at: "advice", say: "The advice maps `OrderNotFoundException` to a 404." },
      { at: "client", say: "**404 Not Found**, with a clean error body — no stack trace leaked.", status: 404, body: '{ "title": "Not Found", "detail": "Order 999 not found" }', tone: "bad" },
    ],
  },
  conflict: {
    label: "Duplicate order",
    mission: "rollback",
    request: 'POST /api/orders   { "reference": "INV-7", "sku": "pen", "qty": 2 }   (INV-7 already exists)',
    frames: [
      { at: "client", say: "The client retries an order whose reference, INV-7, is already taken." },
      { at: "filter", say: "Authenticated, so it passes the filter chain." },
      { at: "dispatcher", say: "Routed to `OrderController.create`." },
      { at: "controller", say: "Validation passes — the body looks perfectly fine." },
      { at: "service", say: "The proxy opens a transaction. The service reserves stock first, then saves the order." },
      { at: "repository", say: "The stock UPDATE and the order INSERT are queued in the persistence context." },
      { at: "db", say: "At flush, the unique constraint on `reference` fires, and the database refuses.", tone: "bad" },
      {
        at: "service",
        say: "Spring translates that into **DataIntegrityViolationException** — unchecked — so the proxy **rolls back**. The stock update is undone too.",
        tone: "bad",
      },
      { at: "advice", say: "The advice maps DataIntegrityViolationException to 409 Conflict." },
      {
        at: "client",
        say: "**409 Conflict.** Nothing was half-saved — that's the whole point of the transaction.",
        status: 409,
        body: '{ "title": "Conflict", "detail": "reference INV-7 already exists" }',
        tone: "bad",
      },
    ],
  },
};

export function RequestJourneyLab({ complete }) {
  const [scenario, setScenario] = useState("ok");
  const [frame, setFrame] = useState(0);

  const s = SCENARIOS[scenario];
  const f = s.frames[frame];
  const last = frame === s.frames.length - 1;
  const reached = new Set(s.frames.slice(0, frame + 1).map((x) => x.at));
  const route = new Set(s.frames.map((x) => x.at));

  function go(n) {
    const next = Math.max(0, Math.min(s.frames.length - 1, n));
    setFrame(next);
    if (next === s.frames.length - 1) {
      complete(s.mission);
      if (s.frames[next].tone === "good") sfx.success();
      else sfx.error();
    } else {
      sfx.click();
    }
  }

  function choose(id) {
    setScenario(id);
    setFrame(0);
  }

  return (
    <div className="lab journey">
      <Segmented label="Scenario" options={Object.entries(SCENARIOS).map(([id, v]) => ({ id, label: v.label }))} value={scenario} onChange={choose} />
      <pre className="lab-code">
        <span className="lab-code__line">{s.request}</span>
      </pre>

      <ol className="journey__track" aria-label="Where the request is">
        {STATIONS.map((st) => {
          const here = f.at === st.id;
          let cls = "";
          if (here) cls = " is-here";
          else if (reached.has(st.id)) cls = " is-seen";
          else if (last && !route.has(st.id)) cls = " is-skipped";
          return (
            <li key={st.id} className={"journey__station" + cls} aria-current={here ? "step" : undefined}>
              <span className="journey__icon" aria-hidden="true">
                {st.icon}
              </span>
              <span className="journey__label">{st.label}</span>
              {here ? <motion.span layoutId="journey-packet" className="journey__packet" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>

      <Say tone={f.tone}>{f.say}</Say>

      {f.status ? (
        <motion.div
          key={scenario}
          className={"journey__response" + (f.status < 300 ? " is-ok" : " is-err")}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <strong>
            HTTP {f.status} {REASON[f.status]}
          </strong>
          <code>{f.body}</code>
        </motion.div>
      ) : null}

      <div className="lab-row">
        <Btn onClick={() => go(frame - 1)} disabled={frame === 0}>
          ◂ Back
        </Btn>
        <Btn variant="primary" onClick={() => go(frame + 1)} disabled={last}>
          Next hop ▸
        </Btn>
        <span className="lab-label">
          hop {frame + 1} / {s.frames.length}
        </span>
        {last ? (
          <Btn variant="ghost" onClick={() => go(0)}>
            ↺ Replay
          </Btn>
        ) : null}
      </div>
    </div>
  );
}
