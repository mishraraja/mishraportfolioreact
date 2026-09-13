import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!<>-_/[]{}=+*^?#________";

/**
 * Decrypts text into place, character by character, like a terminal resolving
 * a transmission. Returns the text to render.
 *
 * @param {string} text   the final string
 * @param {object} opts
 * @param {boolean} [opts.start] begin the animation
 * @param {number} [opts.speed]  frames each character stays scrambled
 */
export function useScramble(text, { start = true, speed = 1.6 } = {}) {
  const reduced = useReducedMotion();
  const [output, setOutput] = useState(reduced ? text : "");
  const frameRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (reduced || !start) {
      setOutput(text);
      return;
    }

    const queue = [...text].map((char, i) => ({
      char,
      start: Math.floor(i * speed),
      end: Math.floor(i * speed + 8 + Math.random() * 12),
    }));

    frameRef.current = 0;

    function tick() {
      const frame = frameRef.current;
      let done = 0;
      let out = "";

      for (const item of queue) {
        if (frame >= item.end) {
          done += 1;
          out += item.char;
        } else if (frame >= item.start) {
          // Keep whitespace intact so the line never reflows mid-animation.
          out += item.char === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        } else {
          out += item.char === " " ? " " : "";
        }
      }

      setOutput(out);
      if (done < queue.length) {
        frameRef.current += 1;
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [text, start, speed, reduced]);

  return output;
}
