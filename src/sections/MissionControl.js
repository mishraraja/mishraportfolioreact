import { Component, lazy, Suspense, useEffect, useRef, useState } from "react";
import { sfx } from "../lib/sound";
import "./MissionControl.css";

const Playground = lazy(() => import("./MissionPlayground"));

export function MissionPanel() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <nav className="mission-panel" aria-label="Choose your mission">
      <div className="mission-panel__head"><span className="mission-label">MISSION CONTROL</span><span>{greeting}, explorer.</span></div>
      <p>Three ways in. Follow your curiosity.</p>
      <div className="mission-panel__links">
        {[["01", "Explore my work", "projects"], ["02", "Try a coding challenge", "mission-lab"], ["03", "Meet the developer", "about"]].map(([n, label, id]) => (
          <a key={id} href={`#${id}`} onClick={() => sfx.click()}><span aria-hidden="true">{n}</span>{label}<span aria-hidden="true">↗</span></a>
        ))}
      </div>
    </nav>
  );
}

class LabBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <p role="status">The lab could not load. Refresh to retry, or <a href="/java">explore the Backend Arcade</a>.</p> : this.props.children;
  }
}

export function MissionControl() {
  const section = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) { setReady(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setReady(true); observer.disconnect(); }
    }, { rootMargin: "200px" });
    observer.observe(section.current);
    return () => observer.disconnect();
  }, []);
  return (
    <section ref={section} id="mission-lab" className="mission-section section" aria-labelledby="mission-title">
      <div className="container">
        <div className="mission-heading"><span className="mission-label">SIDE QUEST / NO SIGN-UP</span><h2 id="mission-title">Less scrolling. More exploring.</h2><p>Send a request. Follow the journey. Give your Java instincts a quick workout.</p></div>
        <div className="mission-slot">
          <LabBoundary><Suspense fallback={<p role="status">Preparing your mission…</p>}>
            {ready ? <Playground /> : <button className="mission-button" onClick={() => setReady(true)}>Open the interactive lab →</button>}
          </Suspense></LabBoundary>
        </div>
      </div>
    </section>
  );
}
