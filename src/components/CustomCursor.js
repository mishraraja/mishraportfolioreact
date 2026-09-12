import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import "./CustomCursor.css";

/** Desktop-only premium cursor. Disabled on touch devices and reduced motion. */
export function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState("");
  const reduced = useReducedMotion();

  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const shouldEnable = isFinePointer && !reduced;
    setEnabled(shouldEnable);
    document.body.classList.toggle("cursor-none", shouldEnable);
    return () => document.body.classList.remove("cursor-none");
  }, [reduced]);

  useEffect(() => {
    if (!enabled) return;

    let ringX = window.innerWidth / 2;
    let ringY = window.innerHeight / 2;
    let dotX = ringX;
    let dotY = ringY;
    let frame;

    function onMove(e) {
      dotX = e.clientX;
      dotY = e.clientY;

      const target = e.target;
      const cursorEl = target.closest?.("[data-cursor]");
      setLabel(cursorEl?.dataset.cursor || "");
    }

    function tick() {
      ringX += (dotX - ringX) * 0.18;
      ringY += (dotY - ringY) * 0.18;
      if (dotRef.current) dotRef.current.style.transform = `translate(${dotX}px, ${dotY}px)`;
      if (ringRef.current) ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px)`;
      frame = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
      <div className={`cursor-ring ${label ? "cursor-ring--label" : ""}`} ref={ringRef} aria-hidden="true">
        {label ? <span className="cursor-ring__text">{label}</span> : null}
      </div>
    </>
  );
}
