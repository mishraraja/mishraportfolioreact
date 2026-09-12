import { useEffect, useRef } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./AuroraBackground.css";

/**
 * Full-viewport, fixed, mouse-reactive gradient field. Pure CSS custom
 * properties updated via a rAF-throttled pointer listener — no canvas,
 * no WebGL, negligible CPU/GPU cost. Never intercepts pointer events.
 */
export function AuroraBackground() {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    let frame = null;
    let targetX = 50;
    let targetY = 35;
    let currentX = 50;
    let currentY = 35;

    function onPointerMove(e) {
      targetX = (e.clientX / window.innerWidth) * 100;
      targetY = (e.clientY / window.innerHeight) * 100;
    }

    function tick() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      el.style.setProperty("--mx", `${currentX}%`);
      el.style.setProperty("--my", `${currentY}%`);
      frame = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <div className="aurora" ref={ref} aria-hidden="true">
      <div className="aurora__grid" />
      <div className="aurora__glow" />
    </div>
  );
}
