import { useMemo } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { cellText, toneClass } from "./format";

const NODE_H = 30;

/**
 * Binary trees use in-order position for x, so a lone left child still leans
 * left. General trees (tries) centre each parent over its children.
 */
function layoutTree(nodes, binary) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const kids = new Map(nodes.map((n) => [n.id, []]));
  let root = null;
  nodes.forEach((n) => {
    if (n.parent === null || n.parent === undefined || !byId.has(n.parent)) {
      if (!root) root = n;
    } else {
      kids.get(n.parent).push(n);
    }
  });

  const pos = {};
  let counter = 0;
  let maxDepth = 0;

  if (binary) {
    const walk = (n, depth) => {
      maxDepth = Math.max(maxDepth, depth);
      const children = kids.get(n.id);
      const left = children.find((c) => c.side === "L");
      const right = children.find((c) => c.side === "R");
      if (left) walk(left, depth + 1);
      pos[n.id] = { x: counter, y: depth };
      counter += 1;
      if (right) walk(right, depth + 1);
    };
    walk(root, 0);
  } else {
    const walk = (n, depth) => {
      maxDepth = Math.max(maxDepth, depth);
      const children = kids.get(n.id);
      if (!children.length) {
        pos[n.id] = { x: counter, y: depth };
        counter += 1;
        return;
      }
      children.forEach((c) => walk(c, depth + 1));
      pos[n.id] = { x: (pos[children[0].id].x + pos[children[children.length - 1].id].x) / 2, y: depth };
    };
    walk(root, 0);
  }

  return { pos, width: Math.max(counter, 1), depth: maxDepth + 1 };
}

export function TreeView({ panel }) {
  const reduced = useReducedMotion();
  const { nodes, pointers = {}, binary, empty } = panel;
  const layout = useMemo(() => (nodes.length ? layoutTree(nodes, binary) : null), [nodes, binary]);
  if (!layout) return <p className="view-empty">{empty || "empty"}</p>;

  const { pos, width, depth } = layout;
  const xStep = width > 12 ? 40 : 54;
  const yStep = 62;
  const pad = 32;
  const hasSub = nodes.some((n) => n.sub !== undefined);
  const svgW = Math.max(140, (width - 1) * xStep + pad * 2);
  const svgH = (depth - 1) * yStep + pad * 2 + (hasSub ? 12 : 0);
  const at = (id) => ({ x: pad + pos[id].x * xStep, y: pad + pos[id].y * yStep });
  const transition = reduced ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 24 };

  const pointerNames = {};
  Object.keys(pointers).forEach((name) => {
    const id = pointers[name];
    if (!pos[id]) return;
    (pointerNames[id] = pointerNames[id] || []).push(name);
  });

  return (
    <div className="tvw-scroll">
      <svg className="tvw" viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} role="img" aria-label={`Tree with ${nodes.length} nodes`}>
        <g>
          {nodes
            .filter((n) => n.parent !== null && n.parent !== undefined && pos[n.parent])
            .map((n) => {
              const a = at(n.parent);
              const b = at(n.id);
              return (
                <motion.line
                  key={"e" + n.id}
                  className={"tvw__edge" + (n.tone === "found" || n.tone === "good" ? toneClass(n.tone) : "")}
                  initial={false}
                  animate={{ x1: a.x, y1: a.y, x2: b.x, y2: b.y }}
                  transition={transition}
                />
              );
            })}
        </g>
        {nodes.map((n) => {
          const p = at(n.id);
          const label = cellText(n.v);
          const w = Math.max(30, 14 + [...label].length * 8);
          return (
            <motion.g key={n.id} className={"tvw__node" + toneClass(n.tone)} initial={false} animate={{ x: p.x, y: p.y }} transition={transition}>
              <motion.g initial={reduced ? false : { scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.28 }}>
                <rect x={-w / 2} y={-NODE_H / 2} width={w} height={NODE_H} rx={NODE_H / 2} className="tvw__shape" />
                <text className="tvw__val" dy="0.35em">
                  {label}
                </text>
                {n.sub !== undefined ? (
                  <text className="tvw__sub" y={NODE_H / 2 + 12}>
                    {n.sub}
                  </text>
                ) : null}
                {pointerNames[n.id] ? (
                  <text className="tvw__ptr" y={-NODE_H / 2 - 7}>
                    {pointerNames[n.id].join(", ")}
                  </text>
                ) : null}
              </motion.g>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
