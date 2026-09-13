import { useEffect, useRef } from "react";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Makes an element lean toward the cursor while it's nearby, then spring back.
 * Pointer-fine only, and fully disabled under reduced motion.
 *
 * @param {number} strength how far the element travels, as a fraction of the offset
 * @param {number} radius   px around the element that counts as "nearby"
 */
export function useMagnetic(strength = 0.35, radius = 90) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = null;
    let curX = 0, curY = 0, tgtX = 0, tgtY = 0;

    function onMove(e) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const reach = Math.max(r.width, r.height) / 2 + radius;

      if (dist < reach) {
        tgtX = dx * strength;
        tgtY = dy * strength;
      } else {
        tgtX = 0;
        tgtY = 0;
      }
    }

    function tick() {
      curX += (tgtX - curX) * 0.15;
      curY += (tgtY - curY) * 0.15;
      if (Math.abs(curX) < 0.01 && Math.abs(curY) < 0.01) {
        curX = 0;
        curY = 0;
      }
      el.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, [strength, radius, reduced]);

  return ref;
}

/**
 * Tracks the cursor inside an element and writes --mx / --my CSS variables,
 * which the stylesheet uses to place a spotlight. No re-renders.
 */
export function useSpotlight() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onMove(e) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }

    el.addEventListener("pointermove", onMove, { passive: true });
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  return ref;
}
