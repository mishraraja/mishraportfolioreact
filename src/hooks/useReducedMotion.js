import { useContext, useEffect, useState } from "react";
import { MotionPreferenceContext } from "../context/MotionPreferenceContext";

export function useReducedMotion() {
  const paused = useContext(MotionPreferenceContext);
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced || paused;
}
