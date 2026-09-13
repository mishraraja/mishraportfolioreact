import { useCallback, useEffect, useRef, useState } from "react";
import { bodies, comet, star } from "../../data/system";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { sfx } from "../../lib/sound";
import "./OrbitalSystem.css";

const VIEW_W = 620;
const VIEW_H = 470;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const MAX_ORBIT = 272;
// Orbits are viewed at an angle, so every ellipse is squashed by the same
// factor. This one number is what makes the whole thing read as 3D — too flat
// and the system reads as a wide smear rather than a body of planets.
const TILT = 0.52;

/**
 * The hero centrepiece: his stack drawn as a solar system that actually runs.
 *
 * Bodies orbit on tilted ellipses, scale with depth so they pass visibly in
 * front of and behind the star, and can be hovered, focused or clicked for
 * detail. Drag anywhere to spin the whole system; scrub the speed control to
 * change time. Under reduced motion it renders as a still diagram.
 */
export function OrbitalSystem() {
  const reduced = useReducedMotion();
  const svgRef = useRef(null);
  const bodyRefs = useRef({});
  const cometRef = useRef(null);

  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [dragging, setDragging] = useState(false);

  // Animation state lives in refs so the orbit loop never triggers a render.
  const timeRef = useRef(0);
  const spinRef = useRef(0);
  const speedRef = useRef(1);
  const pausedRef = useRef(false);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const active = hovered || selected;

  useEffect(() => {
    pausedRef.current = Boolean(active);
  }, [active]);

  /* ---------------- the orbit loop ---------------- */
  useEffect(() => {
    let raf = null;
    let last = performance.now();

    function place(el, orbit, period, phase, radius) {
      const rx = orbit * MAX_ORBIT;
      const ry = rx * TILT;
      const angle = (timeRef.current / period) * Math.PI * 2 + phase + spinRef.current;

      const x = CX + Math.cos(angle) * rx;
      const y = CY + Math.sin(angle) * ry;

      // sin(angle) > 0 means the body is on the near side of the star.
      const depth = (Math.sin(angle) + 1) / 2;
      const scale = 0.68 + depth * 0.42;

      el.setAttribute("transform", "translate(" + x + " " + y + ") scale(" + scale.toFixed(3) + ")");
      el.style.opacity = (0.55 + depth * 0.45).toFixed(3);
      // Near-side bodies must paint over the star, far-side ones behind it.
      el.dataset.front = depth > 0.5 ? "1" : "0";
      return { x, y, depth, radius };
    }

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (!pausedRef.current && !reduced) {
        timeRef.current += dt * speedRef.current;
      }

      bodies.forEach((b, i) => {
        const el = bodyRefs.current[b.id];
        if (el) place(el, b.orbit, b.period, (i * Math.PI * 2) / bodies.length, b.radius);
      });

      // The comet runs a tighter, faster, more eccentric path.
      if (cometRef.current) {
        const a = (timeRef.current / 9) * Math.PI * 2 + spinRef.current + 1.2;
        const rx = 0.22 * MAX_ORBIT;
        const ry = rx * TILT * 2.1;
        const x = CX + Math.cos(a) * rx;
        const y = CY + Math.sin(a) * ry;
        const depth = (Math.sin(a) + 1) / 2;
        cometRef.current.setAttribute(
          "transform",
          "translate(" + x + " " + y + ") scale(" + (0.7 + depth * 0.4).toFixed(3) + ")"
        );
        cometRef.current.style.opacity = (0.5 + depth * 0.5).toFixed(3);
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  /* ---------------- drag to spin ---------------- */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || reduced) return undefined;

    let startX = 0;
    let startSpin = 0;
    let active = false;

    function down(e) {
      // Let the planets handle their own clicks.
      if (e.target.closest("[data-body]")) return;
      active = true;
      setDragging(true);
      startX = e.clientX;
      startSpin = spinRef.current;
      svg.setPointerCapture?.(e.pointerId);
    }
    function move(e) {
      if (!active) return;
      spinRef.current = startSpin + (e.clientX - startX) * 0.006;
    }
    function up(e) {
      if (!active) return;
      active = false;
      setDragging(false);
      svg.releasePointerCapture?.(e.pointerId);
    }

    svg.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      svg.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [reduced]);

  const selectBody = useCallback(
    (body) => {
      sfx.click();
      setSelected((prev) => (prev && prev.id === body.id ? null : body));
    },
    []
  );

  const all = [...bodies, comet];
  const readout = active || { name: star.name, role: star.label, detail: star.detail };

  return (
    <div className={"orbital " + (dragging ? "orbital--dragging" : "")}>
      <svg
        ref={svgRef}
        className="orbital__svg"
        viewBox={"0 0 " + VIEW_W + " " + VIEW_H}
        role="group"
        aria-label="The technology stack shown as a solar system"
      >
        <defs>
          <radialGradient id="starCore">
            <stop offset="0%" stopColor="#fffdf5" />
            <stop offset="35%" stopColor="var(--color-accent-2-strong, #ffc97d)" />
            <stop offset="100%" stopColor="var(--color-accent-2, #ffb454)" />
          </radialGradient>

          <radialGradient id="starGlow">
            <stop offset="0%" stopColor="var(--color-accent-2, #ffb454)" stopOpacity="0.55" />
            <stop offset="45%" stopColor="var(--color-accent-2, #ffb454)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--color-accent-2, #ffb454)" stopOpacity="0" />
          </radialGradient>

          <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {all.map((b) => (
            <radialGradient key={b.id} id={"grad-" + b.id} cx="35%" cy="30%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="45%" stopColor={b.color} />
              <stop offset="100%" stopColor={b.color} stopOpacity="0.55" />
            </radialGradient>
          ))}
        </defs>

        {/* Orbit paths */}
        <g className="orbital__paths">
          {bodies.map((b) => (
            <ellipse
              key={b.id}
              cx={CX}
              cy={CY}
              rx={b.orbit * MAX_ORBIT}
              ry={b.orbit * MAX_ORBIT * TILT}
              className={"orbital__path " + (active && active.id === b.id ? "orbital__path--on" : "")}
            />
          ))}
          <ellipse
            cx={CX}
            cy={CY}
            rx={0.22 * MAX_ORBIT}
            ry={0.22 * MAX_ORBIT * TILT * 2.1}
            className="orbital__path orbital__path--comet"
          />
        </g>

        {/* Far-side bodies render before the star so it occludes them */}
        <g className="orbital__bodies orbital__bodies--back">
          {bodies.map((b, i) => (
            <Body
              key={b.id}
              body={b}
              layer="back"
              refFn={(el) => {
                if (el) bodyRefs.current[b.id] = el;
              }}
              onSelect={selectBody}
              onHover={setHovered}
              isActive={Boolean(active && active.id === b.id)}
            />
          ))}
        </g>

        {/* The star */}
        <g className="orbital__star">
          <circle cx={CX} cy={CY} r={165} fill="url(#starGlow)" className="orbital__corona" />
          <circle cx={CX} cy={CY} r={38} fill="url(#starCore)" filter="url(#softGlow)" />
          <circle cx={CX} cy={CY} r={38} className="orbital__star-rim" />
          <text x={CX} y={CY + 5} className="orbital__star-label">
            {star.name}
          </text>
        </g>

        <g className="orbital__comet-wrap">
          <g
            ref={cometRef}
            data-body="comet"
            className={"orbital__body " + (active && active.id === comet.id ? "orbital__body--on" : "")}
            tabIndex={0}
            role="button"
            aria-label={comet.name + " — " + comet.role}
            onPointerEnter={() => {
              setHovered(comet);
              sfx.hover();
            }}
            onPointerLeave={() => setHovered(null)}
            onFocus={() => setHovered(comet)}
            onBlur={() => setHovered(null)}
            onClick={() => selectBody(comet)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectBody(comet);
              }
            }}
          >
            <circle r={18} className="orbital__hit" />
            <circle r={7} fill={"url(#grad-" + comet.id + ")"} filter="url(#softGlow)" />
          </g>
        </g>
      </svg>

      {/* Readout — always occupied, so nothing below it shifts */}
      <div className="orbital__readout" aria-live="polite">
        <span className="orbital__readout-name">{readout.name}</span>
        <span className="orbital__readout-role">{readout.role}</span>
        <p className="orbital__readout-detail">{readout.detail}</p>
      </div>

      <div className="orbital__controls">
        <span className="orbital__hint">
          {reduced ? "Reduced motion: static view" : "Drag to spin · click a body"}
        </span>
        {!reduced ? (
          <label className="orbital__speed">
            <span className="sr-only">Orbit speed</span>
            <input
              type="range"
              min="0"
              max="4"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <span className="orbital__speed-value">{speed.toFixed(1)}&times;</span>
          </label>
        ) : null}
      </div>
    </div>
  );
}

function Body({ body, refFn, onSelect, onHover, isActive }) {
  return (
    <g
      ref={refFn}
      data-body={body.id}
      className={"orbital__body " + (isActive ? "orbital__body--on" : "")}
      tabIndex={0}
      role="button"
      aria-label={body.name + " — " + body.role}
      onPointerEnter={() => {
        onHover(body);
        sfx.hover();
      }}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(body)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(body)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(body);
        }
      }}
    >
      {/* Generous invisible hit area — the visible dot is small on purpose. */}
      <circle r={body.radius + 14} className="orbital__hit" />

      {body.ring ? (
        <ellipse
          rx={body.radius * 2}
          ry={body.radius * 0.62}
          className="orbital__ring"
          stroke={body.color}
          transform="rotate(-18)"
        />
      ) : null}

      <circle r={body.radius} fill={"url(#grad-" + body.id + ")"} filter="url(#softGlow)" />
      <text y={body.radius + 20} className="orbital__body-label">
        {body.name}
      </text>
    </g>
  );
}
