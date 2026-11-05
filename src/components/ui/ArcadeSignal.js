import "./ArcadeSignal.css";

export function ArcadeSignal({ kind }) {
  const backend = kind === "backend";
  const nodes = backend ? ["REQUEST", "SERVICE", "DATA", "RESPONSE"] : ["INPUT", "TRACE", "PREDICT", "SOLVE"];
  return (
    <div className="arcade-signal" aria-hidden="true">
      <span className="arcade-signal__label">{backend ? "02 / BACKEND SYSTEMS" : "01 / ALGORITHM ENGINE"}</span>
      <svg viewBox="0 0 340 80" fill="none" focusable="false">
        <path d="M0 40H340M0 10H340M0 70H340" stroke="var(--color-border)" />
        <path d={backend ? "M0 50H45V22H105V58H166V16H230V40H340" : "M0 60H30L65 40H100L140 12 180 55 215 30H250L290 10H340"} stroke="var(--color-accent-3)" strokeWidth="2" />
        <path d="M0 65C80 65 85 10 150 30S240 80 340 15" stroke="var(--color-accent)" strokeWidth="1.5" strokeDasharray="3 6" />
      </svg>
      <div className="arcade-signal__nodes">{nodes.map((node, i) => <span key={node}><b>{String(i + 1).padStart(2, "0")}</b>{node}</span>)}</div>
    </div>
  );
}
