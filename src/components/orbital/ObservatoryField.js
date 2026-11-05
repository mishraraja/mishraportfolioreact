import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";

/** One shared contour field, drawn as vectors; no video, canvas or WebGL. */
export function ObservatoryField() {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 90]);
  return <div ref={ref} className="observatory-field" aria-hidden="true">
    <motion.svg viewBox="0 0 1440 1050" preserveAspectRatio="xMidYMid slice" style={{ y: reduced ? 0 : y }}>
      <defs><radialGradient id="field-glow"><stop stopColor="var(--color-accent)" stopOpacity=".12" /><stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" /></radialGradient></defs>
      <ellipse cx="1100" cy="480" rx="480" ry="470" fill="url(#field-glow)" />
      <g fill="none" stroke="var(--color-accent)" strokeWidth=".7" opacity=".2">
        {Array.from({ length: 17 }, (_, i) => <path key={i} d={`M ${480 + i * 24} -60 C ${1380 + i * 13} ${120 + i * 10}, ${530 + i * 34} ${500 + i * 16}, ${1530 + i * 18} ${780 + i * 22}`} />)}
      </g>
      <g stroke="var(--color-border-strong)" strokeWidth=".8" opacity=".65">
        <path d="M900 0V1050M0 750H1440" strokeDasharray="2 12" />
        {[[900, 150], [900, 750], [1320, 750], [260, 750]].map(([x, yy]) => <path key={x + ":" + yy} d={`M${x - 7} ${yy}h14M${x} ${yy - 7}v14`} />)}
      </g>
      <motion.path d="M900 80V750H1340" fill="none" stroke="var(--color-accent-3)" strokeWidth="1.2" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.5, ease: "easeInOut" }} opacity=".3" />
    </motion.svg>
  </div>;
}
