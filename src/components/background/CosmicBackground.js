import { useEffect, useRef } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./CosmicBackground.css";

/** The sky is painted on resize/theme change, never in a scrolling frame loop. */
export function CosmicBackground() {
  const canvasRef = useRef(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext?.("2d");
    if (!ctx) return undefined;
    let frame = null;
    function draw() {
      frame = null;
      const width = window.innerWidth, height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const tokens = getComputedStyle(document.documentElement);
      const colours = ["--color-star", "--color-accent", "--color-accent-3"].map((name) => tokens.getPropertyValue(name).trim());
      const count = Math.min(150, Math.round(width * height / 8000));
      let seed = 131297;
      const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < count; i++) {
        const x = random() * width, y = random() * height;
        const radius = .5 + random() * 1.1;
        ctx.globalAlpha = .18 + random() * .4;
        ctx.fillStyle = colours[i % 11 === 0 ? 2 : i % 7 === 0 ? 1 : 0] || "#c8bddf";
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function schedule() { if (frame === null) frame = requestAnimationFrame(draw); }
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-retro"] });
    draw();
    window.addEventListener("resize", schedule, { passive: true });
    return () => { if (frame !== null) cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", schedule); };
  }, [reduced]);
  return <div className="cosmos" aria-hidden="true">
    <div className="cosmos__nebula" /><div className="cosmos__grid" />
    {!reduced && <canvas className="cosmos__stars" ref={canvasRef} />}
    <div className="cosmos__vignette" />
  </div>;
}
