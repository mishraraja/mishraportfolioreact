
/** One shared contour field, drawn as vectors; no video, canvas or WebGL. */
export function ObservatoryField() {
  return <div className="observatory-field" aria-hidden="true">
    <svg viewBox="0 0 1440 1050" preserveAspectRatio="xMidYMid slice">
      <defs><radialGradient id="field-glow"><stop stopColor="var(--color-accent)" stopOpacity=".12" /><stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" /></radialGradient></defs>
      <ellipse cx="1100" cy="480" rx="480" ry="470" fill="url(#field-glow)" />
      <g fill="none" stroke="var(--color-accent)" strokeWidth=".7" opacity=".2">
        {Array.from({ length: 17 }, (_, i) => <path key={i} d={`M ${480 + i * 24} -60 C ${1380 + i * 13} ${120 + i * 10}, ${530 + i * 34} ${500 + i * 16}, ${1530 + i * 18} ${780 + i * 22}`} />)}
      </g>
    </svg>
  </div>;
}
