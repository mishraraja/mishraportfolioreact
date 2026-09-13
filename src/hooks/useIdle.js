import { useEffect, useRef, useState } from "react";

/** True once the visitor has made no input for `ms`. Resets on any activity. */
export function useIdle(ms = 45000) {
  const [idle, setIdle] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    function reset() {
      setIdle(false);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setIdle(true), ms);
    }

    const events = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      clearTimeout(timer.current);
    };
  }, [ms]);

  return idle;
}
