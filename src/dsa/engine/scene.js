/**
 * Scene builders for the step player.
 *
 * A tracer runs the real algorithm and, at every moment worth seeing, hands the
 * recorder a list of panels describing what is on screen. Every builder copies
 * its data at call time, so the tracer can keep mutating its own structures
 * without rewriting frames it has already recorded.
 *
 * Tones are the shared visual vocabulary across every panel type:
 *   active  — the thing being looked at right now
 *   cmp     — something it is being compared against
 *   good    — a match, a valid state, a chosen value
 *   bad     — a conflict, a rejected value
 *   found   — part of the answer
 *   visited — already handled, still relevant
 *   dim     — out of play
 */

function copy(value) {
  if (Array.isArray(value)) return value.map(copy);
  if (value && typeof value === "object") return { ...value };
  return value;
}

function snap(opts) {
  const out = {};
  Object.keys(opts).forEach((key) => {
    out[key] = copy(opts[key]);
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Linear structures                                                   */
/* ------------------------------------------------------------------ */

/**
 * A row of cells.
 * opts: pointers {name: index}, tones {index: tone}, window [l, r],
 *       sub [label per cell], bars (draw heights), water {l, r, h},
 *       indices (false hides the index row), start (first index label)
 */
export function arr(label, values, opts = {}) {
  return { type: "array", label, values: copy(values), ...snap(opts) };
}

/** A 2D table. opts: tones {"r,c": tone}, rowLabels, colLabels, cursor [r, c] */
export function grid(label, cells, opts = {}) {
  return { type: "grid", label, cells: copy(cells), ...snap(opts) };
}

/** Key → value pairs. Accepts a Map or an array of [key, value]. opts: hot, tone */
export function kv(label, entries, opts = {}) {
  return {
    type: "map",
    label,
    entries: Array.from(entries, ([k, v]) => [k, copy(v)]),
    ...snap(opts),
  };
}

/** A set of values, drawn as chips. opts: hot, tone */
export function set(label, values, opts = {}) {
  return { type: "map", label, set: true, entries: Array.from(values, (v) => [v]), ...snap(opts) };
}

/** Bottom → top. opts: tone (applied to the top item) */
export function stack(label, items, opts = {}) {
  return { type: "stack", label, items: copy(items), ...snap(opts) };
}

/** Front → back. opts: tone (applied to the front item) */
export function queue(label, items, opts = {}) {
  return { type: "stack", kind: "queue", label, items: copy(items), ...snap(opts) };
}

export function text(label, value, opts = {}) {
  return { type: "text", label, value: String(value), ...snap(opts) };
}

/** rows: [{ name, value, width, tones: {bitIndex: tone} }] — bit 0 is the rightmost */
export function bits(label, rows) {
  return { type: "bits", label, rows: rows.map((r) => ({ ...r, tones: { ...(r.tones || {}) } })) };
}

/** items: [{ id, s, e, tone, row, tag }]. opts: min, max, marker */
export function spans(label, items, opts = {}) {
  return { type: "intervals", label, items: items.map((i) => ({ ...i })), ...snap(opts) };
}

/* ------------------------------------------------------------------ */
/* Trees                                                               */
/* ------------------------------------------------------------------ */

export class TreeNode {
  constructor(val, id) {
    this.val = val;
    this.id = id;
    this.left = null;
    this.right = null;
  }
}

/** LeetCode level-order array → tree. Node ids come from their array slot. */
export function buildTree(level) {
  if (!level || level.length === 0 || level[0] === null) return null;
  const root = new TreeNode(level[0], "t0");
  const queue = [root];
  let i = 1;
  while (queue.length && i < level.length) {
    const node = queue.shift();
    if (i < level.length && level[i] !== null) {
      node.left = new TreeNode(level[i], "t" + i);
      queue.push(node.left);
    }
    i += 1;
    if (i < level.length && level[i] !== null) {
      node.right = new TreeNode(level[i], "t" + i);
      queue.push(node.right);
    }
    i += 1;
  }
  return root;
}

/** Tree → LeetCode level-order array with trailing nulls trimmed. */
export function treeToLevel(root) {
  const out = [];
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (node) {
      out.push(node.val);
      queue.push(node.left, node.right);
    } else {
      out.push(null);
    }
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

/** A binary tree panel. opts: tones {nodeId: tone}, subs {nodeId: text}, pointers {name: node} */
export function tree(label, root, opts = {}) {
  const { tones = {}, subs = {}, pointers = {}, ...rest } = opts;
  const nodes = [];
  (function walk(node, parent, side) {
    if (!node) return;
    nodes.push({ id: node.id, v: node.val, parent, side, tone: tones[node.id], sub: subs[node.id] });
    walk(node.left, node.id, "L");
    walk(node.right, node.id, "R");
  })(root, null, null);

  const ptrs = {};
  Object.keys(pointers).forEach((name) => {
    if (pointers[name]) ptrs[name] = pointers[name].id;
  });

  return { type: "tree", label, binary: true, nodes, pointers: ptrs, ...snap(rest) };
}

/** A general tree (tries). nodes: [{ id, v, parent, tone, sub }] in child order. */
export function forest(label, nodes, opts = {}) {
  return { type: "tree", label, binary: false, nodes: nodes.map((n) => ({ ...n })), pointers: {}, ...snap(opts) };
}

/* ------------------------------------------------------------------ */
/* Heaps                                                               */
/* ------------------------------------------------------------------ */

export class Heap {
  constructor(compare = (a, b) => a - b) {
    this.data = [];
    this.compare = compare;
  }

  get size() {
    return this.data.length;
  }

  peek() {
    return this.data[0];
  }

  push(value) {
    const d = this.data;
    d.push(value);
    let i = d.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.compare(d[i], d[p]) >= 0) break;
      [d[i], d[p]] = [d[p], d[i]];
      i = p;
    }
  }

  pop() {
    const d = this.data;
    const top = d[0];
    const last = d.pop();
    if (d.length) {
      d[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < d.length && this.compare(d[l], d[m]) < 0) m = l;
        if (r < d.length && this.compare(d[r], d[m]) < 0) m = r;
        if (m === i) break;
        [d[i], d[m]] = [d[m], d[i]];
        i = m;
      }
    }
    return top;
  }
}

/** Draws a heap's backing array as the tree it really is. opts: format, tones {index: tone} */
export function heapTree(label, data, opts = {}) {
  const { format = (x) => x, tones = {}, ...rest } = opts;
  const nodes = data.map((x, i) => ({
    id: "h" + i,
    v: format(x),
    parent: i === 0 ? null : "h" + ((i - 1) >> 1),
    side: i === 0 ? null : i % 2 === 1 ? "L" : "R",
    tone: tones[i],
  }));
  return { type: "tree", label, binary: true, nodes, pointers: {}, ...snap(rest) };
}

/* ------------------------------------------------------------------ */
/* Linked lists                                                        */
/* ------------------------------------------------------------------ */

export class ListNode {
  constructor(val, id) {
    this.val = val;
    this.id = id;
    this.next = null;
  }
}

/** values → array of chained nodes (the head is nodes[0]). */
export function buildList(values, prefix = "n") {
  const nodes = values.map((v, i) => new ListNode(v, prefix + i));
  nodes.forEach((node, i) => {
    node.next = nodes[i + 1] || null;
  });
  return nodes;
}

export function listToArray(head, limit = 500) {
  const out = [];
  let node = head;
  while (node && out.length < limit) {
    out.push(node.val);
    node = node.next;
  }
  return out;
}

/**
 * A list panel. Nodes are drawn in the order given, and arrows follow the real
 * `next` pointers — so reversing a list visibly flips its arrows.
 * opts: pointers {name: node | null}, tones {nodeId: tone}
 */
export function list(label, nodes, opts = {}) {
  const { pointers = {}, tones = {}, ...rest } = opts;
  const ids = new Set(nodes.map((n) => n.id));
  const ptrs = {};
  Object.keys(pointers).forEach((name) => {
    const target = pointers[name];
    if (target === undefined) return;
    ptrs[name] = target ? target.id : null;
  });
  return {
    type: "list",
    label,
    nodes: nodes.map((n) => ({ id: n.id, v: n.val, tone: tones[n.id] })),
    edges: nodes.filter((n) => n.next && ids.has(n.next.id)).map((n) => [n.id, n.next.id]),
    pointers: ptrs,
    ...snap(rest),
  };
}

/* ------------------------------------------------------------------ */
/* Graphs                                                              */
/* ------------------------------------------------------------------ */

/** Places ids evenly on an ellipse inside a 100 × 64 canvas. */
export function circleLayout(ids, { cx = 50, cy = 32, rx = 36, ry = 24 } = {}) {
  const out = {};
  const n = ids.length;
  ids.forEach((id, i) => {
    const angle = -Math.PI / 2 + (i / Math.max(n, 1)) * Math.PI * 2;
    out[id] = n === 1 ? { x: cx, y: cy } : { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
  });
  return out;
}

/** nodes: [{ id, v, x, y, tone, sub }], edges: [{ a, b, directed, tone }] */
export function graph(label, nodes, edges, opts = {}) {
  return {
    type: "graph",
    label,
    nodes: nodes.map((n) => ({ ...n })),
    edges: edges.map((e) => ({ ...e })),
    ...snap(opts),
  };
}

/* ------------------------------------------------------------------ */
/* Predict-the-next-step questions                                     */
/* ------------------------------------------------------------------ */

export function yesNo(q, yes, why) {
  return { q, options: ["Yes", "No"], answer: yes ? 0 : 1, why };
}

export function choose(q, options, answer, why) {
  return { q, options, answer, why };
}

/** Three nearby non-negative numbers, one of them right. */
export function pickNumber(q, correct, why) {
  const values = new Set([correct]);
  let d = 1;
  while (values.size < 3) {
    if (correct - d >= 0) values.add(correct - d);
    if (values.size < 3) values.add(correct + d);
    d += 1;
  }
  const options = [...values].sort((a, b) => a - b);
  return { q, options: options.map(String), answer: options.indexOf(correct), why };
}

/* ------------------------------------------------------------------ */
/* Tone shortcuts                                                      */
/* ------------------------------------------------------------------ */

/** {from..to: tone} merged over `base`. An empty range returns base unchanged. */
export function paint(from, to, tone, base = {}) {
  const out = { ...base };
  for (let i = from; i <= to; i += 1) out[i] = tone;
  return out;
}

/** Everything outside [l, r] dimmed. */
export function outside(l, r, length, base = {}) {
  return paint(r + 1, length - 1, "dim", paint(0, l - 1, "dim", base));
}
