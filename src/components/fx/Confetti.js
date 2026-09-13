import { useEffect, useRef } from "react";
import { useExperience } from "../../context/ExperienceContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";

/**
 * Dependency-free canvas confetti. Listens to the global burst counter, so
 * anything anywhere can celebrate by calling fireConfetti().
 */
export function Confetti() {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const rafRef = useRef(null);
  const { confettiBurst } = useExperience();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || confettiBurst === 0) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext ? canvas.getContext("2d") : null;
    if (!ctx) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function size() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();

    // Pull the live accent colours so confetti always matches the theme.
    const styles = getComputedStyle(document.documentElement);
    const palette = [
      styles.getPropertyValue("--color-accent").trim() || "#8b7bff",
      styles.getPropertyValue("--color-accent-strong").trim() || "#a597ff",
      styles.getPropertyValue("--color-accent-2").trim() || "#ffb454",
      styles.getPropertyValue("--color-fg").trim() || "#f4f3ee",
    ];

    const count = window.innerWidth < 640 ? 70 : 140;
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.45;

    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 6 + Math.random() * 9;
      particles.current.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        w: 5 + Math.random() * 7,
        h: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        color: palette[Math.floor(Math.random() * palette.length)],
        life: 1,
        decay: 0.008 + Math.random() * 0.01,
      });
    }

    function frame() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let alive = 0;

      for (const p of particles.current) {
        if (p.life <= 0) continue;
        alive += 1;

        p.vy += 0.22; // gravity
        p.vx *= 0.99; // drag
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= p.decay;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (alive > 0) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        particles.current = [];
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    }

    window.addEventListener("resize", size);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("resize", size);
      cancelAnimationFrame(rafRef.current);
    };
  }, [confettiBurst, reduced]);

  if (reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 95 }}
    />
  );
}
