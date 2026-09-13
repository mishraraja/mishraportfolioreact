import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import { useExperience } from "../context/ExperienceContext";
import { sfx } from "../lib/sound";
import "./NotFound.css";

/**
 * Every Java developer has seen the Whitelabel Error Page a thousand times.
 * Meeting it here, rendered properly, is the joke - and the stack trace is
 * worth reading to the last line.
 */
export function NotFound() {
  const { setTerminalOpen } = useExperience();
  const [stamp] = useState(() => new Date().toISOString());
  const path = typeof window !== "undefined" ? window.location.pathname : "/unknown";

  useEffect(() => {
    sfx.error();
    document.title = "404 — Not Found | Raja Mishra";
    return () => {
      document.title = "Raja Mishra — Java Backend Developer";
    };
  }, []);

  const trace = [
    "org.springframework.web.servlet.NoHandlerFoundException:",
    "  No mapping for GET " + path,
    "    at DispatcherServlet.noHandlerFound(DispatcherServlet.java:1304)",
    "    at DispatcherServlet.doDispatch(DispatcherServlet.java:1077)",
    "    at PortfolioController.resolve(PortfolioController.java:57)",
    "    at Curiosity.rewarded(EasterEgg.java:1)",
    "",
    "Caused by: java.lang.IllegalArgumentException: that page was never built",
    "  ... and honestly, it probably never will be",
  ];

  return (
    <section className="nf section">
      <div className="container nf__inner">
        <motion.div
          className="nf__card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="nf__head">
            <span className="nf__status">HTTP 404</span>
            <span className="nf__label">Whitelabel Error Page</span>
          </div>

          <h1 className="nf__title">
            This application has no explicit mapping for <code>{path}</code>.
          </h1>

          <dl className="nf__meta">
            <div>
              <dt>timestamp</dt>
              <dd>{stamp}</dd>
            </div>
            <div>
              <dt>status</dt>
              <dd>404</dd>
            </div>
            <div>
              <dt>error</dt>
              <dd>Not Found</dd>
            </div>
            <div>
              <dt>path</dt>
              <dd>{path}</dd>
            </div>
          </dl>

          <pre className="nf__trace">{trace.join("\n")}</pre>

          <div className="nf__actions">
            <Button as={Link} to="/" variant="primary" onClick={sfx.click}>
              Back to safety
            </Button>
            <Button
              as="button"
              variant="secondary"
              onClick={() => {
                setTerminalOpen(true);
                sfx.open();
              }}
            >
              Open a shell instead
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
