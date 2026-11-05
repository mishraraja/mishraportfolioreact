import { useId } from "react";

/** Original, static SVG terrain inspired by Haikei's layered wave generators.
 * Theme colours are inherited; no bitmap download or animation loop is needed.
 */
export function SignalTerrain() {
  const id = useId();
  return (
    <svg className="signal-terrain" viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--color-accent)" stopOpacity=".13" />
          <stop offset="1" stopColor="var(--color-accent-3)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 245C180 245 225 100 420 130S685 345 910 230 1190 70 1440 150V400H0Z" fill={`url(#${id})`} />
      <g fill="none" stroke="var(--color-accent-3)" strokeWidth=".8">
        {[0, 22, 44, 66, 88, 110].map((y, i) => (
          <path key={y} opacity={.24 - i * .03} transform={`translate(0 ${y})`} d="M-20 230C180 230 225 85 420 115S685 330 910 215 1190 55 1460 135" />
        ))}
      </g>
    </svg>
  );
}
