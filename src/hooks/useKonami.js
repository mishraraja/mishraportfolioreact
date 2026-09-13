import { useEffect, useRef } from "react";

const SEQUENCE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

/** Fires `onUnlock` when the Konami code is typed anywhere on the page. */
export function useKonami(onUnlock) {
  const pos = useRef(0);
  const cb = useRef(onUnlock);
  cb.current = onUnlock;

  useEffect(() => {
    function onKey(e) {
      // Don't swallow arrow keys while someone is typing in a field.
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;

      const expected = SEQUENCE[pos.current];
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (key === expected) {
        pos.current += 1;
        if (pos.current === SEQUENCE.length) {
          pos.current = 0;
          cb.current?.();
        }
      } else {
        // Restart, but allow the wrong key to be a valid first key.
        pos.current = key === SEQUENCE[0] ? 1 : 0;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/** Watches for a word typed anywhere on the page. Great for hidden triggers. */
export function useTypedWord(word, onMatch) {
  const buf = useRef("");
  const cb = useRef(onMatch);
  cb.current = onMatch;

  useEffect(() => {
    function onKey(e) {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      if (e.key.length !== 1) return;

      buf.current = (buf.current + e.key.toLowerCase()).slice(-word.length);
      if (buf.current === word.toLowerCase()) {
        buf.current = "";
        cb.current?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [word]);
}
