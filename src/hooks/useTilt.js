import { useRef } from "react";
import { useReducedMotion } from "./useReducedMotion";

/** Lightweight pointer-driven tilt — replaces the react-parallax-tilt dependency. */
export function useTilt(strength = 8) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  function onMouseMove(e) {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(800px) rotateX(${-y * strength}deg) rotateY(${
      x * strength
    }deg) scale3d(1.02, 1.02, 1.02)`;
  }

  function onMouseLeave() {
    if (!ref.current) return;
    ref.current.style.transform =
      "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  }

  return { ref, onMouseMove, onMouseLeave };
}
