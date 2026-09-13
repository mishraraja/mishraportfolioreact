import { useId } from "react";
import { cellText, toneClass } from "./format";

const SCALE = 5;
const R = 17;

/** Nodes at fixed positions (0–100 × 0–64 space), edges trimmed to the circles. */
export function GraphView({ panel }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { nodes, edges, empty } = panel;
  if (!nodes.length) return <p className="view-empty">{empty || "empty"}</p>;

  const W = 100 * SCALE;
  const H = 64 * SCALE;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const directedKeys = new Set(edges.filter((e) => e.directed).map((e) => e.a + ">" + e.b));

  return (
    <div className="gw-scroll">
      <svg className="gw" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Graph with ${nodes.length} nodes and ${edges.length} edges`}>
        <defs>
          <marker id={"ga" + uid} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="gw__head" />
          </marker>
        </defs>

        {edges.map((e, k) => {
          const a = byId.get(e.a);
          const b = byId.get(e.b);
          if (!a || !b) return null;
          let ax = a.x * SCALE;
          let ay = a.y * SCALE;
          let bx = b.x * SCALE;
          let by = b.y * SCALE;
          const len = Math.hypot(bx - ax, by - ay) || 1;
          const ux = (bx - ax) / len;
          const uy = (by - ay) / len;
          // Two arrows in opposite directions sit side by side instead of on top of each other.
          if (e.directed && directedKeys.has(e.b + ">" + e.a)) {
            ax += -uy * 5;
            ay += ux * 5;
            bx += -uy * 5;
            by += ux * 5;
          }
          const tail = R + (e.directed ? 5 : 0);
          return (
            <line
              key={k + ":" + e.a + ":" + e.b}
              x1={ax + ux * R}
              y1={ay + uy * R}
              x2={bx - ux * tail}
              y2={by - uy * tail}
              className={"gw__edge" + toneClass(e.tone)}
              markerEnd={e.directed ? `url(#ga${uid})` : undefined}
            />
          );
        })}

        {nodes.map((n) => (
          <g key={n.id} transform={`translate(${n.x * SCALE} ${n.y * SCALE})`} className={"gw__node" + toneClass(n.tone)}>
            <circle r={R} className="gw__shape" />
            <text dy="0.35em" className="gw__val">
              {cellText(n.v)}
            </text>
            {n.sub !== undefined ? (
              <text y={R + 14} className="gw__sub">
                {n.sub}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </div>
  );
}
