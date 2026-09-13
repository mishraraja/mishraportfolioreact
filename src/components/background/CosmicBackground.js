import { useEffect, useRef } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./CosmicBackground.css";

/**
 * The sky the whole site sits in.
 *
 * Three parallax star layers drift at different depths, brighten near the
 * cursor, and stretch into streaks when you scroll fast — the further a layer
 * is, the less it reacts, which is what sells the depth. A shooting star
 * crosses now and then. Nebula clouds are CSS underneath; only the stars need
 * a canvas.
 */
export function CosmicBackground() {
  const canvasRef = useRef(null);
  const nebulaRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext ? canvas.getContext("2d") : null;
    if (!ctx) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = null;
    let running = true;

    // Depth 0 is furthest away: small, dim, barely moves.
    const LAYERS = [
      { count: 0, depth: 0.18, size: [0.4, 0.9], alpha: [0.18, 0.42], speed: 0.012 },
      { count: 0, depth: 0.45, size: [0.7, 1.5], alpha: [0.3, 0.68], speed: 0.03 },
      { count: 0, depth: 1.0, size: [1.0, 2.2], alpha: [0.5, 1.0], speed: 0.06 },
    ];

    let stars = [];
    let shootingStars = [];

    const pointer = { x: -9999, y: -9999 };
    let scrollY = window.scrollY;
    let scrollVelocity = 0;
    let smoothVelocity = 0;

    function palette() {
      const s = getComputedStyle(document.documentElement);
      return {
        star: s.getPropertyValue("--color-star").trim() || "#fff6e0",
        accent: s.getPropertyValue("--color-accent").trim() || "#8b7bff",
        cyan: s.getPropertyValue("--color-accent-3").trim() || "#48dbe0",
        gold: s.getPropertyValue("--color-accent-2").trim() || "#ffb454",
      };
    }
    let colors = palette();

    function hexToRgb(hex) {
      const c = hex.replace("#", "");
      const full =
        c.length === 3
          ? c
              .split("")
              .map((x) => x + x)
              .join("")
          : c;
      const n = parseInt(full, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

    function build() {
      // Density follows the viewport but stays bounded so phones stay smooth.
      const area = w * h;
      const base = Math.min(Math.round(area / 5200), 420);
      LAYERS[0].count = Math.round(base * 0.5);
      LAYERS[1].count = Math.round(base * 0.33);
      LAYERS[2].count = Math.round(base * 0.17);

      stars = [];
      LAYERS.forEach((layer, li) => {
        for (let i = 0; i < layer.count; i += 1) {
          // A few stars take on the nebula's colours instead of starlight.
          const roll = Math.random();
          const tint =
            roll > 0.93 ? colors.cyan : roll > 0.86 ? colors.accent : roll > 0.8 ? colors.gold : colors.star;

          stars.push({
            layer: li,
            x: Math.random() * w,
            y: Math.random() * h,
            r: rand(layer.size[0], layer.size[1]),
            a: rand(layer.alpha[0], layer.alpha[1]),
            rgb: hexToRgb(tint),
            // Each star twinkles on its own clock.
            phase: Math.random() * Math.PI * 2,
            twinkle: rand(0.6, 2.2),
            drift: rand(-0.06, 0.06),
          });
        }
      });
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function spawnShootingStar() {
      // Enter from the top edge, travel down-right at a shallow angle.
      const startX = rand(-0.1, 0.85) * w;
      const startY = rand(-0.05, 0.35) * h;
      const angle = rand(Math.PI * 0.12, Math.PI * 0.28);
      const speed = rand(9, 16);
      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: rand(0.008, 0.016),
        len: rand(90, 210),
      });
    }

    let lastFrame = performance.now();
    let shootTimer = rand(2600, 7000);

    function frame(now) {
      if (!running) return;
      const dt = Math.min(now - lastFrame, 60);
      lastFrame = now;

      // Scroll velocity drives the warp; it decays back to rest on its own.
      const nextScroll = window.scrollY;
      scrollVelocity = nextScroll - scrollY;
      scrollY = nextScroll;
      smoothVelocity += (scrollVelocity - smoothVelocity) * 0.12;
      const warp = Math.min(Math.abs(smoothVelocity) / 55, 1);

      ctx.clearRect(0, 0, w, h);

      const t = now / 1000;

      for (const s of stars) {
        const layer = LAYERS[s.layer];

        // Parallax: near layers slide further per pixel scrolled.
        const offsetY = -(scrollY * layer.speed) % (h + 40);
        let y = s.y + offsetY;
        if (y < -20) y += h + 40;
        if (y > h + 20) y -= h + 40;

        const x = s.x + Math.sin(t * 0.06 + s.phase) * s.drift * 40 * layer.depth;

        // Cursor proximity lifts nearby stars — the sky notices you.
        const d = Math.hypot(x - pointer.x, y - pointer.y);
        const near = Math.max(0, 1 - d / 260) * layer.depth;

        const tw = 0.72 + Math.sin(t * s.twinkle + s.phase) * 0.28;
        const alpha = Math.min(s.a * tw + near * 0.5, 1);
        const [r, g, b] = s.rgb;

        if (warp > 0.22 && layer.depth > 0.25) {
          // Stretch into a motion streak while scrolling quickly.
          const streak = warp * 20 * layer.depth * Math.sign(smoothVelocity);
          const grad = ctx.createLinearGradient(x, y, x, y - streak);
          grad.addColorStop(0, "rgba(" + r + "," + g + "," + b + "," + alpha + ")");
          grad.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = s.r * 1.4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y - streak);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, s.r + near * 1.4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
          ctx.fill();

          // The brightest stars get a soft bloom.
          if (s.r > 1.6) {
            ctx.beginPath();
            ctx.arc(x, y, s.r * 3.2, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + alpha * 0.09 + ")";
            ctx.fill();
          }
        }
      }

      /* ---- shooting stars ---- */
      shootTimer -= dt;
      if (shootTimer <= 0 && shootingStars.length < 2) {
        spawnShootingStar();
        shootTimer = rand(4200, 11000);
      }

      const [sr, sg, sb] = hexToRgb(colors.star);
      shootingStars = shootingStars.filter((m) => m.life > 0);
      for (const m of shootingStars) {
        m.x += m.vx;
        m.y += m.vy;
        m.life -= m.decay;

        const mag = Math.hypot(m.vx, m.vy) || 1;
        const tailX = m.x - (m.vx / mag) * m.len;
        const tailY = m.y - (m.vy / mag) * m.len;

        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        const a = Math.max(m.life, 0);
        grad.addColorStop(0, "rgba(" + sr + "," + sg + "," + sb + "," + a + ")");
        grad.addColorStop(0.4, "rgba(" + sr + "," + sg + "," + sb + "," + a * 0.3 + ")");
        grad.addColorStop(1, "rgba(" + sr + "," + sg + "," + sb + ",0)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(m.x, m.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + sr + "," + sg + "," + sb + "," + a + ")";
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    /* ---- nebula parallax (CSS layer) ---- */
    function moveNebula(e) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      if (nebulaRef.current) {
        nebulaRef.current.style.setProperty("--nx", (nx * 18).toFixed(2) + "px");
        nebulaRef.current.style.setProperty("--ny", (ny * 18).toFixed(2) + "px");
      }
    }

    function onLeave() {
      pointer.x = -9999;
      pointer.y = -9999;
    }

    function onVisibility() {
      running = !document.hidden;
      if (running) {
        lastFrame = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (raf) {
        cancelAnimationFrame(raf);
      }
    }

    const observer = new MutationObserver(() => {
      colors = palette();
      build();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-retro"],
    });

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", moveNebula, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", moveNebula);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  return (
    <div className="cosmos" aria-hidden="true">
      <div className="cosmos__nebula" ref={nebulaRef} />
      <div className="cosmos__grid" />
      {reduced ? null : <canvas className="cosmos__stars" ref={canvasRef} />}
      <div className="cosmos__vignette" />
    </div>
  );
}
