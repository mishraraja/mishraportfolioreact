import { useId } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { cellText, toneClass } from "./format";

const BOX_H = 34;
const TOP = 34;
const GAP = 34;
const PTR_ROW = 17;

/**
 * Nodes sit in the order given; arrows follow the real next pointers. Forward
 * neighbours get a straight arrow, longer jumps arc above, and anything that
 * points backwards (a reversal, a cycle) arcs underneath.
 */
export function ListView({ panel }) {
  const reduced = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { nodes, edges, pointers = {} } = panel;
  const nullPointers = Object.keys(pointers).filter((name) => pointers[name] === null);

  const nullChips = nullPointers.length ? (
    <div className="lvw__nulls">
      {nullPointers.map((name) => (
        <span key={name} className="lvw__null">
          {name} → null
        </span>
      ))}
    </div>
  ) : null;

  if (!nodes.length) {
    return (
      <div>
        <p className="view-empty">empty list</p>
        {nullChips}
      </div>
    );
  }

  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const labels = nodes.map((n) => cellText(n.v));
  const boxW = Math.max(42, 16 + Math.max(...labels.map((l) => [...l].length)) * 8);
  const step = boxW + GAP;
  const x0 = 12;
  const midY = TOP + BOX_H / 2;
  const cx = (i) => x0 + i * step + boxW / 2;

  const levels = {};
  const placed = [];
  Object.keys(pointers).forEach((name) => {
    const id = pointers[name];
    if (id === null || !index.has(id)) return;
    const i = index.get(id);
    const level = levels[i] || 0;
    levels[i] = level + 1;
    placed.push({ name, i, level });
  });

  const hasBack = edges.some(([a, b]) => index.get(b) <= index.get(a));
  const below = hasBack ? 42 : 10;
  const pointerRows = Math.max(0, ...Object.values(levels));
  const width = nodes.length * step - GAP + x0 * 2;
  const height = TOP + BOX_H + below + pointerRows * PTR_ROW + 8;
  const transition = reduced ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 24 };

  // Every path uses the same "M … C … , … , …" shape so framer can morph between them.
  const pathFor = (a, b) => {
    const i = index.get(a);
    const j = index.get(b);
    if (j === i + 1) {
      const x1 = x0 + i * step + boxW;
      const x2 = x0 + j * step - 5;
      return `M ${x1} ${midY} C ${x1 + 8} ${midY}, ${x2 - 8} ${midY}, ${x2} ${midY}`;
    }
    if (j > i) {
      const x1 = cx(i);
      const x2 = cx(j);
      const lift = Math.min(30, 12 + (j - i) * 5);
      return `M ${x1} ${TOP} C ${x1} ${TOP - lift}, ${x2} ${TOP - lift}, ${x2} ${TOP - 5}`;
    }
    const x1 = j === i ? cx(i) + 10 : cx(i);
    const x2 = j === i ? cx(j) - 10 : cx(j);
    const drop = Math.min(38, 16 + (i - j) * 5);
    const y = TOP + BOX_H;
    return `M ${x1} ${y} C ${x1} ${y + drop}, ${x2} ${y + drop}, ${x2} ${y + 5}`;
  };

  return (
    <div className="lvw-scroll">
      <svg className="lvw" viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={`Linked list with ${nodes.length} nodes`}>
        <defs>
          <marker id={"la" + uid} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="lvw__head" />
          </marker>
        </defs>

        {edges.map(([a, b]) => (
          <motion.path
            key={a + ">" + b}
            className="lvw__edge"
            markerEnd={`url(#la${uid})`}
            initial={false}
            animate={{ d: pathFor(a, b) }}
            transition={transition}
          />
        ))}

        {nodes.map((n, i) => (
          <motion.g key={n.id} className={"lvw__node" + toneClass(n.tone)} initial={false} animate={{ x: x0 + i * step, y: TOP }} transition={transition}>
            <rect width={boxW} height={BOX_H} rx={9} className="lvw__shape" />
            <text x={boxW / 2} y={BOX_H / 2} dy="0.35em" className="lvw__val">
              {labels[i]}
            </text>
          </motion.g>
        ))}

        {placed.map((p) => (
          <motion.text
            key={"p" + p.name}
            className="lvw__ptr"
            initial={false}
            animate={{ x: cx(p.i), y: TOP + BOX_H + below + p.level * PTR_ROW + 4 }}
            transition={transition}
          >
            ▲ {p.name}
          </motion.text>
        ))}
      </svg>
      {nullChips}
    </div>
  );
}
