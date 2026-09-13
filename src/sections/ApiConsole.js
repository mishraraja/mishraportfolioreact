import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ENDPOINTS, callEndpoint, statusClass, statusText } from "../lib/api";
import { SectionHeading } from "../components/ui/SectionHeading";
import { useExperience } from "../context/ExperienceContext";
import { sfx } from "../lib/sound";
import "./ApiConsole.css";

/** Minimal JSON syntax highlighter - no dependency, no dangerouslySetInnerHTML. */
function JsonView({ value, indent = 0 }) {
  const pad = { paddingLeft: indent ? 18 : 0 };

  if (value === null) return <span className="json__null">null</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="json__punc">[]</span>;
    return (
      <span>
        <span className="json__punc">[</span>
        {value.map((item, i) => (
          <span key={i} className="json__row" style={pad}>
            <JsonView value={item} indent={indent + 1} />
            {i < value.length - 1 ? <span className="json__punc">,</span> : null}
          </span>
        ))}
        <span className="json__punc json__row">]</span>
      </span>
    );
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return <span className="json__punc">{"{}"}</span>;
    return (
      <span>
        <span className="json__punc">{"{"}</span>
        {keys.map((key, i) => (
          <span key={key} className="json__row" style={pad}>
            <span className="json__key">&quot;{key}&quot;</span>
            <span className="json__punc">: </span>
            <JsonView value={value[key]} indent={indent + 1} />
            {i < keys.length - 1 ? <span className="json__punc">,</span> : null}
          </span>
        ))}
        <span className="json__punc json__row">{"}"}</span>
      </span>
    );
  }

  if (typeof value === "number") return <span className="json__num">{value}</span>;
  if (typeof value === "boolean") return <span className="json__bool">{String(value)}</span>;
  return <span className="json__str">&quot;{String(value)}&quot;</span>;
}

/**
 * The centrepiece surprise: a working REST console embedded in the page.
 * Visitors send real requests against an in-browser service that returns this
 * site's own content - for a backend engineer, the most honest demo there is.
 */
export function ApiConsole() {
  const [active, setActive] = useState(ENDPOINTS[0]);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [called, setCalled] = useState(() => new Set());
  const { unlock } = useExperience();
  const liveRef = useRef(null);

  const send = useCallback(
    async (endpoint) => {
      setLoading(true);
      setResponse(null);
      sfx.request();

      const res = await callEndpoint(endpoint);
      setResponse(res);
      setLoading(false);

      if (res.status >= 400) sfx.error();
      else sfx.success();

      unlock("api-caller");
      setCalled((prev) => {
        if (prev.has(endpoint.id)) return prev;
        const next = new Set(prev);
        next.add(endpoint.id);
        if (next.size === ENDPOINTS.length) queueMicrotask(() => unlock("endpoint-explorer"));
        return next;
      });
    },
    [unlock]
  );

  // Fire the health check once the section first scrolls into view, so the
  // console is already alive when the visitor looks at it.
  useEffect(() => {
    const el = liveRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          io.disconnect();
          setTimeout(() => send(ENDPOINTS[0]), 400);
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [send]);

  return (
    <section id="api" className="api section" ref={liveRef}>
      <div className="container">
        <SectionHeading
          index="05"
          eyebrow="Try it yourself"
          title="This portfolio has an API."
          description="A Spring-Boot-shaped service running entirely in your browser. Pick an endpoint, send the request, read the response. Everything it returns is the real content of this site."
        />

        <div className="api__console">
          {/* Endpoint list */}
          <aside className="api__sidebar">
            <div className="api__sidebar-head">
              <span className="api__base">https://rajamishra.dev</span>
              <span className={"api__pill api__pill--" + (called.size === ENDPOINTS.length ? "ok" : "idle")}>
                {called.size}/{ENDPOINTS.length} called
              </span>
            </div>

            <ul className="api__list">
              {ENDPOINTS.map((ep) => (
                <li key={ep.id}>
                  <button
                    type="button"
                    className={"api__endpoint " + (active.id === ep.id ? "api__endpoint--on" : "")}
                    onClick={() => {
                      setActive(ep);
                      setResponse(null);
                      sfx.click();
                    }}
                    onPointerEnter={sfx.hover}
                  >
                    <span className={"api__method api__method--" + ep.method.toLowerCase()}>
                      {ep.method}
                    </span>
                    <span className="api__path">{ep.path}</span>
                    {called.has(ep.id) ? (
                      <span className="api__tick" aria-label="already called">
                        &#10003;
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Request / response */}
          <div className="api__main">
            <div className="api__request">
              <div className="api__request-line">
                <span className={"api__method api__method--" + active.method.toLowerCase()}>
                  {active.method}
                </span>
                <code className="api__request-path">{active.path}</code>
                <button
                  type="button"
                  className="api__send"
                  onClick={() => send(active)}
                  disabled={loading}
                  onPointerEnter={sfx.hover}
                >
                  {loading ? "Sending" : "Send"}
                  {loading ? <span className="api__spinner" aria-hidden="true" /> : <span aria-hidden="true"> &#8594;</span>}
                </button>
              </div>
              <p className="api__summary text-muted">{active.summary}</p>

              {active.body ? (
                <div className="api__body-block">
                  <span className="api__block-label">Request body</span>
                  <pre className="api__json">
                    <JsonView value={active.body} />
                  </pre>
                </div>
              ) : null}
            </div>

            <div className="api__response">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    className="api__state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="api__spinner api__spinner--lg" aria-hidden="true" />
                    <span className="text-muted">Awaiting response…</span>
                  </motion.div>
                ) : response ? (
                  <motion.div
                    key={"res-" + active.id + response.latency}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="api__status-row">
                      <span className={"api__status api__status--" + statusClass(response.status)}>
                        <span className="api__status-dot" aria-hidden="true" />
                        {response.status} {statusText(response.status)}
                      </span>
                      <span className="api__meta">{response.latency} ms</span>
                      <span className="api__meta">
                        {new Blob([JSON.stringify(response.body)]).size} B
                      </span>
                    </div>

                    <details className="api__headers">
                      <summary>Response headers</summary>
                      <dl>
                        {Object.entries(response.headers).map(([k, v]) => (
                          <div key={k}>
                            <dt>{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>

                    <pre className="api__json api__json--res">
                      <JsonView value={response.body} />
                    </pre>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    className="api__state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="api__state-icon" aria-hidden="true">
                      &#9889;
                    </span>
                    <span className="text-muted">Hit Send to call this endpoint.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <p className="api__footnote text-muted">
          No server involved. The whole service is client-side JavaScript modelled on the Spring Boot
          conventions used in production work.
        </p>
      </div>
    </section>
  );
}
