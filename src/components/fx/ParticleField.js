import { useEffect, useRef } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./ParticleField.css";

/**
 * A slow constellation drifting behind the whole page. Nodes near the cursor
 * link up and brighten, so the background quietly responds to the visitor
 * without ever asking for attention.
 */
export function ParticleField() {
  const canvasRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    // getContext returns null when canvas is unavailable (disabled, jsdom,
    // out of memory). Bail out rather than throw — the page works without it.
    const ctx = canvas.getContext ? canvas.getContext("2d", { alpha: true }) : null;
    if (!ctx) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let nodes = [];
    let raf = null;
    let running = true;
    const mouse = { x: -9999, y: -9999 };

    function accent() {
      const s = getComputedStyle(document.documentElement);
      return {
        main: s.getPropertyValue("--color-accent").trim() || "#8b7bff",
        second: s.getPropertyValue("--color-accent-2").trim() || "#ffb454",
      };
    }
    let colors = accent();

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density scales with viewport, capped so phones stay smooth.
      const target = Math.min(Math.round((w * h) / 26000), 90);
      nodes = Array.from({ length: target }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 0.8 + Math.random() * 1.6,
      }));
    }

    function hexToRgb(hex) {
      const clean = hex.replace("#", "");
      const full =
        clean.length === 3
          ? clean
              .split("")
              .map((c) => c + c)
              .join("")
          : clean;
      const int = parseInt(full, 16);
      return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      const [mr, mg, mb] = hexToRgb(colors.main);
      const [sr, sg, sb] = hexToRgb(colors.second);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;

        // Wrap around the edges rather than bouncing - feels calmer.
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;

        const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        const near = Math.max(0, 1 - d / 220);

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + near * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + mr + "," + mg + "," + mb + "," + (0.18 + near * 0.55) + ")";
        ctx.fill();

        // Thread a line to the cursor when it is close enough to matter.
        if (d < 180) {
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = "rgba(" + sr + "," + sg + "," + sb + "," + (1 - d / 180) * 0.22 + ")";
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }

      // Link neighbouring nodes into a loose lattice.
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "rgba(" + mr + "," + mg + "," + mb + "," + (1 - dist / 120) * 0.1 + ")";
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(frame);
    }

    function onMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    function onLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }
    function onVisibility() {
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(frame);
      else cancelAnimationFrame(raf);
    }

    // Themes change the palette; pick it up without a full remount.
    const observer = new MutationObserver(() => {
      colors = accent();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-retro"],
    });

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  if (reduced) return null;
  return <canvas className="particle-field" ref={canvasRef} aria-hidden="true" />;
}
