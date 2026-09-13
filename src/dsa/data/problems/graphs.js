import { arr, grid, graph, kv, queue, text, circleLayout, yesNo, choose, pickNumber } from "../../engine/scene";
import { formatValue } from "../../engine/trace";

const cellKey = (r, c) => r + "," + c;
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Union-Find with path halving, plus a read-only find for labels. */
function makeDSU(n) {
  const parent = Array.from({ length: n }, (_, i) => i);
  return {
    parent,
    find(x) {
      let y = x;
      while (parent[y] !== y) {
        parent[y] = parent[parent[y]];
        y = parent[y];
      }
      return y;
    },
    peek(x) {
      let y = x;
      while (parent[y] !== y) y = parent[y];
      return y;
    },
  };
}

function validateEdges(n, edges) {
  for (const [a, b] of edges) {
    if (a >= n || b >= n) return `Node numbers must be between 0 and ${n - 1}.`;
    if (a === b) return "An edge can't connect a node to itself.";
  }
  return undefined;
}

function unionFindDraw(n, edges, dsu, edgeTones) {
  const ids = Array.from({ length: n }, (_, i) => String(i));
  const pos = circleLayout(ids);
  return (hi = {}, parentTones = {}) => [
    graph(
      "graph",
      ids.map((id, i) => ({ id: "v" + i, v: i, ...pos[id], sub: "club " + dsu.peek(i), tone: hi[i] })),
      edges.map(([a, b], k) => ({ a: "v" + a, b: "v" + b, tone: edgeTones[k] }))
    ),
    arr("parent (who each node reports to)", dsu.parent, { tones: parentTones }),
  ];
}

export const graphProblems = [
  /* ------------------------------------------------------------------ */
  {
    slug: "clone-graph",
    lc: 133,
    title: "Clone Graph",
    world: "graphs",
    difficulty: "Medium",
    pattern: "graph-traversal",
    emoji: "🧬",
    statement:
      "Return a deep copy of a connected undirected graph. (In the playground, the graph is an adjacency list: entry i lists the neighbours of node i + 1.)",
    story:
      "You're photocopying a friendship network. Each time you meet someone new, you make their twin first, and only then copy their friendships. A register of who already has a twin stops you from copying the same person twice, even when friendships loop back around.",
    insight: "DFS with a map from original → clone. Create and register a node's clone before visiting its neighbours; if a neighbour is already registered, reuse its clone.",
    complexity: { time: "O(V + E)", space: "O(V)", why: "Each node is cloned once and each edge is copied once per direction." },
    inputs: [{ name: "adjList", kind: "intLists", minLen: 0, maxLen: 6, maxItemLen: 5, min: 1, max: 6 }],
    validate: ({ adjList }) => {
      const n = adjList.length;
      for (let i = 0; i < n; i += 1) {
        const u = i + 1;
        if (new Set(adjList[i]).size !== adjList[i].length) return `Node ${u} lists a neighbour twice.`;
        for (const v of adjList[i]) {
          if (v > n) return `Node ${u} points to ${v}, but there are only ${n} nodes.`;
          if (v === u) return `Node ${u} can't be its own neighbour.`;
          if (!adjList[v - 1].includes(u)) return `The graph is undirected: if ${u} lists ${v}, then ${v} must list ${u}.`;
        }
      }
      if (n > 0) {
        const seen = new Set([1]);
        const stack = [1];
        while (stack.length) {
          const u = stack.pop();
          adjList[u - 1].forEach((v) => {
            if (!seen.has(v)) {
              seen.add(v);
              stack.push(v);
            }
          });
        }
        if (seen.size !== n) return "The graph must be connected.";
      }
      return undefined;
    },
    examples: [
      { input: { adjList: [[2, 4], [1, 3], [2, 4], [1, 3]] }, output: [[2, 4], [1, 3], [2, 4], [1, 3]] },
      { input: { adjList: [[]] }, output: [[]] },
      { input: { adjList: [] }, output: [] },
    ],
    trace({ adjList }, T) {
      const n = adjList.length;
      if (n === 0) {
        T.step("There are no nodes, so the clone is empty too: **[]**.", [text("graph", "(empty)")]);
        return [];
      }
      const ids = adjList.map((_, i) => i + 1);
      const pos = circleLayout(ids.map(String));
      const pairKey = (a, b) => Math.min(a, b) + "-" + Math.max(a, b);
      const pairs = [];
      const seenPairs = new Set();
      adjList.forEach((nbrs, i) =>
        nbrs.forEach((v) => {
          const k = pairKey(i + 1, v);
          if (!seenPairs.has(k)) {
            seenPairs.add(k);
            pairs.push([i + 1, v]);
          }
        })
      );
      const twins = new Map();
      const copied = new Set();

      const draw = (u, v) => [
        graph(
          "original",
          ids.map((i) => ({ id: "o" + i, v: i, ...pos[i], tone: i === u ? "active" : i === v ? "cmp" : twins.has(i) ? "visited" : undefined })),
          pairs.map(([a, b]) => ({ a: "o" + a, b: "o" + b, tone: u && v && pairKey(u, v) === pairKey(a, b) ? "active" : undefined }))
        ),
        graph(
          "clone",
          [...twins.keys()].map((i) => ({ id: "c" + i, v: i + "′", ...pos[i], tone: i === u ? "active" : i === v ? "cmp" : "good" })),
          pairs
            .filter(([a, b]) => copied.has(a + ">" + b) || copied.has(b + ">" + a))
            .map(([a, b]) => ({ a: "c" + a, b: "c" + b, tone: copied.has(a + ">" + b) && copied.has(b + ">" + a) ? "good" : "cmp" })),
          { empty: "no twins yet" }
        ),
        kv("original → twin", [...twins.keys()].map((i) => [i, i + "′"]), { hot: v ?? u }),
      ];

      T.step("Copy a friendship network. Meet someone new → make their twin first → then copy each friendship. The map remembers who already has a twin.", draw());

      function clone(u) {
        twins.set(u, []);
        T.step(`Meet node ${u} for the first time. Create twin ${u}′ and register it in the map *before* copying any friendships.`, draw(u));
        adjList[u - 1].forEach((v) => {
          const has = twins.has(v);
          T.step(`${u} is friends with ${v}.`, draw(u, v), {
            ask: yesNo(`Does ${v} already have a twin?`, has, "If it does, reuse it — making a second twin would break the copy, and cycles would loop forever."),
          });
          if (!has) clone(v);
          twins.get(u).push(v);
          copied.add(u + ">" + v);
          T.step(has ? `${v}′ already exists, so just link ${u}′ → ${v}′.` : `Back at ${u}: link ${u}′ → ${v}′.`, draw(u, v));
        });
      }

      clone(1);
      const result = ids.map((i) => twins.get(i));
      T.step(`Every node and every friendship copied: **${formatValue(result)}**.`, draw());
      return result;
    },
    java: `private final Map<Node, Node> twins = new HashMap<>();

public Node cloneGraph(Node node) {
    if (node == null) return null;
    if (twins.containsKey(node)) return twins.get(node); // already copied: reuse the twin
    Node twin = new Node(node.val);
    twins.put(node, twin);                                // register BEFORE recursing, or cycles loop forever
    for (Node friend : node.neighbors) {
        twin.neighbors.add(cloneGraph(friend));
    }
    return twin;
}`,
    python: `def cloneGraph(self, node: Optional["Node"]) -> Optional["Node"]:
    twins = {}

    def clone(n):
        if n in twins:
            return twins[n]
        twin = twins[n] = Node(n.val)   # register before recursing
        twin.neighbors = [clone(friend) for friend in n.neighbors]
        return twin

    return clone(node) if node else None`,
    quiz: {
      q: "Why register a node's twin in the map before copying its neighbours?",
      options: [
        "A cycle leads back to the node, and the map entry stops the recursion from looping forever",
        "Maps have to be filled in order",
        "It halves the memory used",
        "It keeps the neighbours sorted",
      ],
      answer: 0,
      why: "In a 4-node ring, node 1's neighbour 2 eventually reaches 1 again. Finding 1 in the map is what ends that loop.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "course-schedule",
    lc: 207,
    title: "Course Schedule",
    world: "graphs",
    difficulty: "Medium",
    pattern: "topo-sort",
    emoji: "🎓",
    statement:
      "There are numCourses courses and pairs [a, b] meaning course b must be taken before course a. Decide whether it's possible to finish every course.",
    story:
      "Courses are dominoes. You can only push over a domino once every domino leaning on it has fallen. Start with the ones nothing leans on. If some dominoes never fall, they're propping each other up in a circle.",
    insight: "Kahn's algorithm: count each course's unmet prerequisites (in-degree). Repeatedly take a course with none, and remove its outgoing arrows. If every course gets taken, there's no cycle.",
    complexity: { time: "O(V + E)", space: "O(V + E)", why: "Every course and every prerequisite arrow is handled once." },
    inputs: [
      { name: "numCourses", kind: "int", min: 1, max: 7 },
      { name: "prerequisites", kind: "pairs", minLen: 0, maxLen: 9, min: 0, max: 6 },
    ],
    validate: ({ numCourses, prerequisites }) => validateEdges(numCourses, prerequisites),
    examples: [
      { input: { numCourses: 2, prerequisites: [[1, 0]] }, output: true },
      { input: { numCourses: 2, prerequisites: [[1, 0], [0, 1]] }, output: false },
      { input: { numCourses: 4, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2]] }, output: true },
    ],
    trace({ numCourses: n, prerequisites }, T) {
      const indeg = new Array(n).fill(0);
      const outgoing = Array.from({ length: n }, () => []);
      prerequisites.forEach(([a, b], k) => {
        outgoing[b].push(k);
        indeg[a] += 1;
      });
      const ids = Array.from({ length: n }, (_, i) => String(i));
      const pos = circleLayout(ids);
      const status = {};
      const removed = new Set();
      const q = [];
      const order = [];
      const draw = (focus = {}, edge = -1) => [
        graph(
          "courses (b → a: take b before a)",
          ids.map((id, i) => ({ id: "c" + i, v: i, ...pos[id], sub: "waits " + indeg[i], tone: focus[i] || status[i] })),
          prerequisites.map(([a, b], k) => ({ a: "c" + b, b: "c" + a, directed: true, tone: k === edge ? "active" : removed.has(k) ? "dim" : undefined }))
        ),
        queue("ready to take", q),
      ];

      T.step("Each arrow b → a means course b must come before course a. The number under each course is how many prerequisites it still waits for.", draw());
      for (let i = 0; i < n; i += 1) {
        if (indeg[i] === 0) {
          q.push(i);
          status[i] = "cmp";
        }
      }
      T.step(q.length ? `Courses waiting for nothing can start right away: ${q.join(", ")}.` : "Every course waits for another — nothing can even start.", draw());

      while (q.length) {
        const u = q.shift();
        order.push(u);
        status[u] = "good";
        T.step(`Take course ${u}. Every arrow leaving it removes one prerequisite from another course.`, draw({ [u]: "active" }), { vars: { taken: order.length } });
        outgoing[u].forEach((k) => {
          const v = prerequisites[k][0];
          T.step(`Arrow ${u} → ${v}: course ${v} is waiting on ${indeg[v]} course${indeg[v] === 1 ? "" : "s"}.`, draw({ [u]: "active", [v]: "cmp" }, k), {
            vars: { taken: order.length },
            ask: yesNo(`Will course ${v} be ready once this arrow is gone?`, indeg[v] - 1 === 0),
          });
          indeg[v] -= 1;
          removed.add(k);
          if (indeg[v] === 0) {
            q.push(v);
            status[v] = "cmp";
          }
          T.step(indeg[v] === 0 ? `Course ${v} has no prerequisites left — it joins the ready queue.` : `Course ${v} still waits for ${indeg[v]} more.`, draw({ [u]: "active" }), {
            vars: { taken: order.length },
          });
        });
      }

      const ok = order.length === n;
      if (!ok) {
        ids.forEach((_, i) => {
          if (!status[i]) status[i] = "bad";
        });
      }
      T.step(
        ok
          ? `All ${n} courses taken, in the order ${order.join(" → ")}. **Possible → true**.`
          : `Only ${order.length} of ${n} courses could be taken. The red ones are waiting on each other in a cycle. **Impossible → false**.`,
        draw(),
        { vars: { taken: order.length } }
      );
      return ok;
    },
    java: `public boolean canFinish(int numCourses, int[][] prerequisites) {
    List<List<Integer>> unlocks = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) unlocks.add(new ArrayList<>());
    int[] waiting = new int[numCourses];                // in-degree: prerequisites still missing
    for (int[] p : prerequisites) {
        unlocks.get(p[1]).add(p[0]);
        waiting[p[0]]++;
    }
    Queue<Integer> ready = new ArrayDeque<>();
    for (int i = 0; i < numCourses; i++) if (waiting[i] == 0) ready.offer(i);
    int taken = 0;
    while (!ready.isEmpty()) {
        int course = ready.poll();
        taken++;
        for (int next : unlocks.get(course)) {
            if (--waiting[next] == 0) ready.offer(next); // its last prerequisite just fell
        }
    }
    return taken == numCourses;                         // anything left is stuck in a cycle
}`,
    python: `def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
    unlocks = [[] for _ in range(numCourses)]
    waiting = [0] * numCourses
    for a, b in prerequisites:
        unlocks[b].append(a)
        waiting[a] += 1
    ready = collections.deque(i for i in range(numCourses) if waiting[i] == 0)
    taken = 0
    while ready:
        course = ready.popleft()
        taken += 1
        for nxt in unlocks[course]:
            waiting[nxt] -= 1
            if waiting[nxt] == 0:
                ready.append(nxt)
    return taken == numCourses`,
    levelUp: "Course Schedule II (LC 210) asks for the order itself — it's the exact same algorithm, just return the order you took the courses in.",
    quiz: {
      q: "What does it mean if some courses never reach zero prerequisites?",
      options: [
        "They're in (or depend on) a cycle, so no valid order exists",
        "They have no prerequisites at all",
        "The queue was too small",
        "They must be taken first",
      ],
      answer: 0,
      why: "In a cycle, every course waits for another course in the same cycle, so none of them can ever be first.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "pacific-atlantic-water-flow",
    lc: 417,
    title: "Pacific Atlantic Water Flow",
    world: "graphs",
    difficulty: "Medium",
    pattern: "graph-traversal",
    emoji: "🌊",
    statement:
      "Rain falls on an island of heights. Water flows to neighbours of equal or lower height. The Pacific touches the top and left edges; the Atlantic touches the bottom and right. Return every cell whose water can reach both oceans.",
    story:
      "Pouring water from every single cell and watching where it goes is slow. Flip it around: let each ocean climb uphill from its own coast. Any cell both oceans can climb to can drain into both.",
    insight: "Run one search from all Pacific border cells and one from all Atlantic border cells, moving only to neighbours at least as high. Answer = cells reached by both.",
    complexity: { time: "O(m · n)", space: "O(m · n)", why: "Each search visits each cell at most once." },
    inputs: [{ name: "heights", kind: "matrix", maxRows: 5, maxCols: 5, min: 0, max: 9 }],
    examples: [
      {
        input: { heights: [[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]] },
        output: [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]],
      },
      { input: { heights: [[1]] }, output: [[0, 0]] },
      { input: { heights: [[2, 1], [1, 2]] }, output: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    ],
    trace({ heights }, T) {
      const R = heights.length;
      const C = heights[0].length;

      const layersFrom = (starts) => {
        const seen = new Set();
        let frontier = [];
        starts.forEach(([r, c]) => {
          if (!seen.has(cellKey(r, c))) {
            seen.add(cellKey(r, c));
            frontier.push([r, c]);
          }
        });
        const layers = [frontier];
        for (;;) {
          const next = [];
          frontier.forEach(([r, c]) =>
            DIRS.forEach(([dr, dc]) => {
              const nr = r + dr;
              const nc = c + dc;
              if (nr < 0 || nc < 0 || nr >= R || nc >= C || seen.has(cellKey(nr, nc))) return;
              if (heights[nr][nc] < heights[r][c]) return;
              seen.add(cellKey(nr, nc));
              next.push([nr, nc]);
            })
          );
          if (!next.length) break;
          layers.push(next);
          frontier = next;
        }
        return layers;
      };

      const pacificStarts = [...Array.from({ length: C }, (_, c) => [0, c]), ...Array.from({ length: R }, (_, r) => [r, 0])];
      const atlanticStarts = [...Array.from({ length: C }, (_, c) => [R - 1, c]), ...Array.from({ length: R }, (_, r) => [r, C - 1])];
      const pac = new Set();
      const atl = new Set();
      const tones = () => {
        const t = {};
        for (let r = 0; r < R; r += 1) {
          for (let c = 0; c < C; c += 1) {
            const k = cellKey(r, c);
            if (pac.has(k) && atl.has(k)) t[k] = "good";
            else if (pac.has(k)) t[k] = "cmp";
            else if (atl.has(k)) t[k] = "active";
          }
        }
        return t;
      };

      T.step("Let the oceans climb uphill instead. Water moves to equal-or-lower cells, so an ocean can climb to equal-or-higher cells. Cyan = Pacific, violet = Atlantic, green = both.", [
        grid("heights", heights),
      ]);

      [
        { name: "Pacific", set: pac, layers: layersFrom(pacificStarts), edge: "top and left" },
        { name: "Atlantic", set: atl, layers: layersFrom(atlanticStarts), edge: "bottom and right" },
      ].forEach(({ name, set, layers, edge }) => {
        layers.forEach((layer, i) => {
          layer.forEach(([r, c]) => set.add(cellKey(r, c)));
          const next = layers[i + 1];
          T.step(
            i === 0
              ? `${name}: the ${layer.length} cells on the ${edge} edges drain straight into it.`
              : `The ${name} climbs one layer uphill: ${layer.length} more cell${layer.length === 1 ? "" : "s"}.`,
            [grid("heights", heights, { tones: tones() })],
            { ask: pickNumber("How many cells will the next uphill layer add?", next ? next.length : 0) }
          );
        });
      });

      const result = [];
      const finalTones = {};
      for (let r = 0; r < R; r += 1) {
        for (let c = 0; c < C; c += 1) {
          const k = cellKey(r, c);
          if (pac.has(k) && atl.has(k)) {
            result.push([r, c]);
            finalTones[k] = "found";
          } else {
            finalTones[k] = "dim";
          }
        }
      }
      T.step(`Cells that reach both oceans: **${formatValue(result)}**.`, [grid("heights", heights, { tones: finalTones })]);
      return result;
    },
    java: `public List<List<Integer>> pacificAtlantic(int[][] heights) {
    int rows = heights.length, cols = heights[0].length;
    boolean[][] pacific = new boolean[rows][cols], atlantic = new boolean[rows][cols];
    for (int r = 0; r < rows; r++) {
        climb(heights, r, 0, pacific);         // left edge touches the Pacific
        climb(heights, r, cols - 1, atlantic); // right edge touches the Atlantic
    }
    for (int c = 0; c < cols; c++) {
        climb(heights, 0, c, pacific);         // top edge
        climb(heights, rows - 1, c, atlantic); // bottom edge
    }
    List<List<Integer>> out = new ArrayList<>();
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++)
            if (pacific[r][c] && atlantic[r][c]) out.add(List.of(r, c));
    return out;
}

private void climb(int[][] h, int r, int c, boolean[][] seen) {
    if (seen[r][c]) return;
    seen[r][c] = true;
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    for (int[] d : dirs) {
        int nr = r + d[0], nc = c + d[1];
        if (nr >= 0 && nc >= 0 && nr < h.length && nc < h[0].length
                && !seen[nr][nc] && h[nr][nc] >= h[r][c]) { // water flows down, so we climb up
            climb(h, nr, nc, seen);
        }
    }
}`,
    python: `def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:
    rows, cols = len(heights), len(heights[0])

    def climb(starts):
        seen, stack = set(starts), list(starts)
        while stack:
            r, c = stack.pop()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if (0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen
                        and heights[nr][nc] >= heights[r][c]):
                    seen.add((nr, nc))
                    stack.append((nr, nc))
        return seen

    pacific = climb([(0, c) for c in range(cols)] + [(r, 0) for r in range(rows)])
    atlantic = climb([(rows - 1, c) for c in range(cols)] + [(r, cols - 1) for r in range(rows)])
    return [[r, c] for r in range(rows) for c in range(cols) if (r, c) in pacific and (r, c) in atlantic]`,
    levelUp: "The animation spreads in breadth-first layers so you can watch the water climb. The depth-first code marks exactly the same cells.",
    quiz: {
      q: "Why search from the oceans instead of from every cell?",
      options: [
        "Two searches from the coasts cover every cell once, instead of one search per cell",
        "Oceans are always lower than the land",
        "Water can't flow downhill",
        "It finds shorter paths",
      ],
      answer: 0,
      why: "Searching from each cell repeats the same work up to m·n times. Reversing the flow shares it.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "number-of-islands",
    lc: 200,
    title: "Number of Islands",
    world: "graphs",
    difficulty: "Medium",
    pattern: "graph-traversal",
    emoji: "🏝️",
    statement: "Given a grid of '1' (land) and '0' (water), count the islands. An island is land connected horizontally or vertically.",
    story:
      "You're a pilot mapping an archipelago. Fly over row by row. Whenever you spot land nobody has claimed, plant a flag, then send a flood of explorers across every connected patch so that island can never be counted again.",
    insight: "Scan every cell. On unvisited land, add one to the count and flood-fill (DFS/BFS) the whole island, marking it visited.",
    complexity: { time: "O(m · n)", space: "O(m · n)", why: "Each cell is flooded at most once." },
    inputs: [{ name: "grid", kind: "charGrid", maxRows: 5, maxCols: 6, pattern: /^[01]$/, patternHint: "Use only '1' for land and '0' for water." }],
    examples: [
      { input: { grid: [["1", "1", "1", "1", "0"], ["1", "1", "0", "1", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "0", "0", "0"]] }, output: 1 },
      { input: { grid: [["1", "1", "0", "0", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "1", "0", "0"], ["0", "0", "0", "1", "1"]] }, output: 3 },
      { input: { grid: [["1", "0", "1"], ["0", "1", "0"], ["1", "0", "1"]] }, output: 5 },
    ],
    trace({ grid: g }, T) {
      const R = g.length;
      const C = g[0].length;
      const cells = g.map((row) => row.slice());
      const claimed = {};
      const seen = new Set();
      let count = 0;
      const labelOf = (k) => String.fromCharCode(65 + ((k - 1) % 26));
      const tones = (extra = {}) => {
        const t = {};
        for (let r = 0; r < R; r += 1) {
          for (let c = 0; c < C; c += 1) if (g[r][c] === "0") t[cellKey(r, c)] = "dim";
        }
        return { ...t, ...claimed, ...extra };
      };

      T.step("Fly over the map row by row. Unclaimed land means a new island: plant a flag and flood the whole island so it's never counted twice.", [
        grid("map", cells, { tones: tones() }),
      ], { vars: { islands: 0 } });

      for (let r = 0; r < R; r += 1) {
        for (let c = 0; c < C; c += 1) {
          if (g[r][c] !== "1" || seen.has(cellKey(r, c))) continue;
          count += 1;
          const label = labelOf(count);
          const layers = [];
          let frontier = [[r, c]];
          seen.add(cellKey(r, c));
          while (frontier.length) {
            layers.push(frontier);
            const next = [];
            frontier.forEach(([a, b]) =>
              DIRS.forEach(([dr, dc]) => {
                const nr = a + dr;
                const nc = b + dc;
                if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr][nc] !== "1" || seen.has(cellKey(nr, nc))) return;
                seen.add(cellKey(nr, nc));
                next.push([nr, nc]);
              })
            );
            frontier = next;
          }
          const size = layers.flat().length;

          T.step(`Unclaimed land at (${r}, ${c}). Plant flag **${label}** — island #${count}.`, [grid("map", cells, { tones: tones({ [cellKey(r, c)]: "active" }), cursor: [r, c] })], {
            vars: { islands: count },
            ask: pickNumber(`How many cells will island ${label} cover?`, size),
          });
          for (let li = 0; li < layers.length; li += 1) {
            for (const [a, b] of layers[li]) {
              cells[a][b] = label;
              claimed[cellKey(a, b)] = "active";
            }
            if (li > 0) {
              const spread = layers[li].length;
              T.step(`The flood spreads to ${spread} more connected land cell${spread === 1 ? "" : "s"}.`, [grid("map", cells, { tones: tones() })], {
                vars: { islands: count },
              });
            }
          }
          layers.flat().forEach(([a, b]) => {
            claimed[cellKey(a, b)] = "good";
          });
          T.step(`Island ${label} is fully claimed: ${size} cell${size === 1 ? "" : "s"}. Keep scanning.`, [grid("map", cells, { tones: tones() })], {
            vars: { islands: count },
          });
        }
      }

      T.step(`The whole map is scanned: **${count}** island${count === 1 ? "" : "s"}.`, [grid("map", cells, { tones: tones() })], { vars: { islands: count } });
      return count;
    },
    java: `public int numIslands(char[][] grid) {
    int islands = 0;
    for (int r = 0; r < grid.length; r++)
        for (int c = 0; c < grid[0].length; c++)
            if (grid[r][c] == '1') {
                islands++;           // plant a flag on new land...
                sink(grid, r, c);    // ...then flood the whole island so it's never recounted
            }
    return islands;
}

private void sink(char[][] grid, int r, int c) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] != '1') return;
    grid[r][c] = '0';
    sink(grid, r + 1, c);
    sink(grid, r - 1, c);
    sink(grid, r, c + 1);
    sink(grid, r, c - 1);
}`,
    python: `def numIslands(self, grid: List[List[str]]) -> int:
    rows, cols = len(grid), len(grid[0])

    def sink(r, c):
        if 0 <= r < rows and 0 <= c < cols and grid[r][c] == "1":
            grid[r][c] = "0"
            sink(r + 1, c)
            sink(r - 1, c)
            sink(r, c + 1)
            sink(r, c - 1)

    islands = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                islands += 1
                sink(r, c)
    return islands`,
    quiz: {
      q: "Why flood-fill an island right after counting it?",
      options: [
        "So the rest of its cells are marked and never counted as new islands",
        "To measure its perimeter",
        "To sort the grid",
        "The loop can't finish otherwise",
      ],
      answer: 0,
      why: "The scan will reach the island's other cells later. They must already be marked, or each one would look like a new island.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "longest-consecutive-sequence",
    lc: 128,
    title: "Longest Consecutive Sequence",
    world: "graphs",
    difficulty: "Medium",
    pattern: "hashing",
    emoji: "🪜",
    statement: "Return the length of the longest run of consecutive integers in an unsorted array, in O(n) time.",
    story:
      "Numbers are rungs scattered around a building site. Sorting them would be slow. Instead, throw them all in a bucket you can search instantly, and only start climbing from a rung that has nothing directly below it.",
    insight: "Put everything in a HashSet. Only start counting at x when x − 1 is missing, then walk x + 1, x + 2… Each run is walked exactly once.",
    complexity: { time: "O(n)", space: "O(n)", why: "Every number is part of exactly one run, and each run is walked once from its start." },
    inputs: [{ name: "nums", kind: "intArray", minLen: 0, maxLen: 12, min: -20, max: 200 }],
    examples: [
      { input: { nums: [100, 4, 200, 1, 3, 2] }, output: 4 },
      { input: { nums: [0, 3, 7, 2, 5, 8, 4, 6, 0, 1] }, output: 9 },
      { input: { nums: [] }, output: 0 },
    ],
    trace({ nums }, T) {
      const s = new Set(nums);
      const sorted = [...s].sort((a, b) => a - b);
      const idx = new Map(sorted.map((v, i) => [v, i]));
      const status = {};
      let best = 0;
      let bestRun = [];
      const label = "set (drawn sorted so runs are easy to spot)";
      const view = (extra = {}) => arr(label, sorted, { tones: { ...status, ...extra } });

      T.step("Put every number in a set for O(1) lookups. Only start counting at numbers that begin a run — the ones whose x − 1 is missing.", [arr("nums", nums), view()], {
        vars: { best },
      });

      for (const x of s) {
        const start = !s.has(x - 1);
        T.step(`Look at ${x}. Is ${x - 1} in the set?`, [arr("nums", nums), view({ [idx.get(x)]: "active", ...(s.has(x - 1) ? { [idx.get(x - 1)]: "cmp" } : {}) })], {
          vars: { best },
          ask: yesNo(`Does a run start at ${x}?`, start, "A run starts at x only when x − 1 is missing."),
        });
        if (!start) {
          if (!status[idx.get(x)]) status[idx.get(x)] = "dim";
          T.step(`${x - 1} exists, so ${x} is in the middle of a run. Skip it — that run gets counted from its start.`, [arr("nums", nums), view()], { vars: { best } });
          continue;
        }
        const run = [x];
        while (s.has(x + run.length)) run.push(x + run.length);
        const improved = run.length > best;
        if (improved) {
          best = run.length;
          bestRun = run;
        }
        const runTones = Object.fromEntries(run.map((v) => [idx.get(v), "good"]));
        T.step(`${x} starts a run: ${run.join(" → ")} (length ${run.length}).` + (improved ? " New best!" : ""), [arr("nums", nums), view(runTones)], { vars: { best } });
        run.forEach((v) => {
          status[idx.get(v)] = "visited";
        });
      }

      T.step(best ? `The longest run is ${bestRun.join(" → ")}: length **${best}**.` : "The array is empty, so the answer is **0**.", [
        arr("nums", nums),
        view(Object.fromEntries(bestRun.map((v) => [idx.get(v), "found"]))),
      ], { vars: { best } });
      return best;
    },
    java: `public int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int x : nums) set.add(x);
    int best = 0;
    for (int x : set) {
        if (set.contains(x - 1)) continue;   // not the start of a run: skip
        int len = 1;
        while (set.contains(x + len)) len++; // walk the run once, from its start
        best = Math.max(best, len);
    }
    return best;
}`,
    python: `def longestConsecutive(self, nums: List[int]) -> int:
    s = set(nums)
    best = 0
    for x in s:
        if x - 1 not in s:          # only start at the bottom rung
            length = 1
            while x + length in s:
                length += 1
            best = max(best, length)
    return best`,
    quiz: {
      q: "Why is this O(n) even with a while loop inside a for loop?",
      options: [
        "The inner loop only runs from run starts, so each number is walked at most once overall",
        "The while loop runs at most twice",
        "Sets are kept sorted",
        "It isn't — it's really O(n²)",
      ],
      answer: 0,
      why: "Middle-of-run numbers skip instantly. The total work of all inner loops adds up to the number of elements.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "alien-dictionary",
    lc: 269,
    title: "Alien Dictionary",
    world: "graphs",
    difficulty: "Hard",
    pattern: "topo-sort",
    emoji: "👽",
    statement:
      "Words from an alien language are sorted by its unknown alphabet. Return one valid ordering of its letters, or \"\" if the order is contradictory.",
    story:
      "You find an alien dictionary and want its alphabet. Two neighbouring entries only tell you one thing: at the first letter where they differ, the upper word's letter comes first. Gather every clue, then line up the letters so no clue is broken.",
    insight: "Each adjacent pair of words gives at most one edge (first differing letter). Topologically sort the letters; a cycle — or a word before its own prefix — means no valid order.",
    complexity: { time: "O(total letters)", space: "O(unique letters + rules)", why: "Each pair of words is compared once, then Kahn's algorithm runs on at most 26 letters." },
    inputs: [{ name: "words", kind: "stringArray", minLen: 1, maxLen: 6, maxItemLen: 5, pattern: /^[a-z]+$/, patternHint: "Use lowercase letters a–z only." }],
    examples: [
      { input: { words: ["wrt", "wrf", "er", "ett", "rftt"] }, output: "wertf" },
      { input: { words: ["z", "x"] }, output: "zx" },
      { input: { words: ["z", "x", "z"] }, output: "" },
    ],
    trace({ words }, T) {
      const letters = [];
      words.forEach((w) =>
        [...w].forEach((c) => {
          if (!letters.includes(c)) letters.push(c);
        })
      );
      const after = new Map(letters.map((c) => [c, []]));
      const indeg = new Map(letters.map((c) => [c, 0]));
      const pos = circleLayout(letters);
      const rules = [];
      const status = {};

      const lettersGraph = (hi = {}, edgeHi) =>
        graph(
          "letter rules (x → y: x comes first)",
          letters.map((c) => ({ id: c, v: c, ...pos[c], sub: "in " + indeg.get(c), tone: hi[c] || status[c] })),
          rules.map(([x, y]) => ({ a: x, b: y, directed: true, tone: edgeHi === x + y ? "active" : undefined }))
        );

      T.step("The dictionary is sorted in an alien alphabet. Compare neighbouring words: the first position where they differ reveals one rule.", [
        arr("dictionary", words),
        lettersGraph(),
      ]);

      for (let i = 0; i + 1 < words.length; i += 1) {
        const a = words[i];
        const b = words[i + 1];
        const pair = { [i]: "cmp", [i + 1]: "cmp" };
        let j = 0;
        while (j < Math.min(a.length, b.length) && a[j] === b[j]) j += 1;

        if (j === Math.min(a.length, b.length)) {
          if (a.length > b.length) {
            T.step(`"${a}" comes before "${b}", but "${b}" is a prefix of it. No alphabet sorts a word before its own prefix → **""**.`, [
              arr("dictionary", words, { tones: { [i]: "bad", [i + 1]: "bad" } }),
              lettersGraph(),
            ]);
            return "";
          }
          T.step(`"${a}" is a prefix of "${b}" — that fits any alphabet, so no new rule.`, [arr("dictionary", words, { tones: pair }), lettersGraph()]);
          continue;
        }

        const x = a[j];
        const y = b[j];
        const swap = i % 2 === 1;
        const options = swap ? [`'${y}' before '${x}'`, `'${x}' before '${y}'`] : [`'${x}' before '${y}'`, `'${y}' before '${x}'`];
        T.step(`Compare "${a}" with "${b}".`, [arr("dictionary", words, { tones: pair }), lettersGraph()], {
          ask: choose("Which rule do these two words reveal?", options, swap ? 1 : 0, "Only the first differing letter matters — everything after it is unconstrained."),
        });
        const isNew = !after.get(x).includes(y);
        if (isNew) {
          after.get(x).push(y);
          indeg.set(y, indeg.get(y) + 1);
          rules.push([x, y]);
        }
        T.step(`They first differ at position ${j}: '${x}' vs '${y}'. So **'${x}' comes before '${y}'**.` + (isNew ? "" : " We already knew that one."), [
          arr("dictionary", words, { tones: pair }),
          lettersGraph({ [x]: "active", [y]: "cmp" }, x + y),
        ]);
      }

      const q = letters.filter((c) => indeg.get(c) === 0);
      q.forEach((c) => {
        status[c] = "cmp";
      });
      let order = "";
      const drawKahn = (hi = {}) => [lettersGraph(hi), queue("ready", q), text("alphabet so far", order || "(empty)")];
      T.step(q.length ? `Letters with nothing that must come before them: ${q.join(", ")}. They can go first.` : "Every letter has something before it — there's a cycle.", drawKahn());

      while (q.length) {
        const c = q.shift();
        order += c;
        status[c] = "good";
        const freed = [];
        after.get(c).forEach((d) => {
          indeg.set(d, indeg.get(d) - 1);
          if (indeg.get(d) === 0) {
            q.push(d);
            status[d] = "cmp";
            freed.push(d);
          }
        });
        T.step(`Write '${c}'.` + (freed.length ? ` That frees ${freed.map((d) => `'${d}'`).join(", ")}.` : ""), drawKahn({ [c]: "active" }));
      }

      if (order.length < letters.length) {
        letters.forEach((c) => {
          if (!status[c]) status[c] = "bad";
        });
        T.step(`Only ${order.length} of ${letters.length} letters could be placed. The red ones form a cycle of rules. **Invalid → ""**.`, drawKahn());
        return "";
      }
      T.step(`The alien alphabet: **"${order}"**.`, drawKahn());
      return order;
    },
    java: `public String alienOrder(String[] words) {
    Map<Character, Set<Character>> after = new LinkedHashMap<>();
    Map<Character, Integer> waiting = new LinkedHashMap<>();   // in-degree per letter
    for (String w : words)
        for (char c : w.toCharArray()) {
            after.putIfAbsent(c, new LinkedHashSet<>());
            waiting.putIfAbsent(c, 0);
        }
    for (int i = 0; i + 1 < words.length; i++) {
        String a = words[i], b = words[i + 1];
        if (a.length() > b.length() && a.startsWith(b)) return ""; // a word before its own prefix
        for (int j = 0; j < Math.min(a.length(), b.length()); j++) {
            if (a.charAt(j) != b.charAt(j)) {                     // the first difference is one rule
                if (after.get(a.charAt(j)).add(b.charAt(j))) waiting.merge(b.charAt(j), 1, Integer::sum);
                break;
            }
        }
    }
    Queue<Character> ready = new ArrayDeque<>();
    waiting.forEach((c, n) -> { if (n == 0) ready.offer(c); });
    StringBuilder order = new StringBuilder();
    while (!ready.isEmpty()) {
        char c = ready.poll();
        order.append(c);
        for (char next : after.get(c)) {
            if (waiting.merge(next, -1, Integer::sum) == 0) ready.offer(next);
        }
    }
    return order.length() == waiting.size() ? order.toString() : ""; // leftovers mean a cycle
}`,
    python: `def alienOrder(self, words: List[str]) -> str:
    after = {c: [] for w in words for c in w}
    waiting = {c: 0 for c in after}
    for a, b in zip(words, words[1:]):
        for x, y in zip(a, b):
            if x != y:
                if y not in after[x]:
                    after[x].append(y)
                    waiting[y] += 1
                break
        else:
            if len(a) > len(b):          # a word before its own prefix
                return ""
    ready = collections.deque(c for c in waiting if waiting[c] == 0)
    order = []
    while ready:
        c = ready.popleft()
        order.append(c)
        for d in after[c]:
            waiting[d] -= 1
            if waiting[d] == 0:
                ready.append(d)
    return "".join(order) if len(order) == len(waiting) else ""`,
    quiz: {
      q: "When is an alien dictionary invalid even without a cycle?",
      options: [
        "When a longer word appears before its own prefix, like \"abc\" before \"ab\"",
        "When a word repeats a letter",
        "When two words share a first letter",
        "When there are more than 26 letters",
      ],
      answer: 0,
      why: "In every alphabet, a prefix sorts before the longer word. Seeing the reverse is a contradiction no rule can fix.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "graph-valid-tree",
    lc: 261,
    title: "Graph Valid Tree",
    world: "graphs",
    difficulty: "Medium",
    pattern: "union-find",
    emoji: "🌴",
    statement: "Given n nodes labelled 0 to n − 1 and a list of undirected edges, decide whether they form a valid tree.",
    story:
      "Union-Find is a club membership desk. Everyone starts in their own club. Each edge merges two clubs. But if an edge tries to join two people who are already in the same club, it's building a second road between them — a loop — and trees don't have loops.",
    insight: "A tree has exactly n − 1 edges and no cycle. Check the count, then union every edge; if two endpoints already share a root, there's a cycle.",
    complexity: { time: "O(n · α(n))", space: "O(n)", why: "Near-constant time per union/find with path compression." },
    inputs: [
      { name: "n", kind: "int", min: 1, max: 7 },
      { name: "edges", kind: "pairs", minLen: 0, maxLen: 8, min: 0, max: 6 },
    ],
    validate: ({ n, edges }) => validateEdges(n, edges),
    examples: [
      { input: { n: 5, edges: [[0, 1], [0, 2], [0, 3], [1, 4]] }, output: true },
      { input: { n: 5, edges: [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]] }, output: false },
      { input: { n: 4, edges: [[0, 1], [2, 3]] }, output: false },
    ],
    trace({ n, edges }, T) {
      const dsu = makeDSU(n);
      const edgeTones = {};
      const draw = unionFindDraw(n, edges, dsu, edgeTones);

      if (edges.length !== n - 1) {
        T.step(
          `A tree on ${n} node${n === 1 ? "" : "s"} has exactly ${n - 1} edge${n - 1 === 1 ? "" : "s"}, but this graph has ${edges.length}. **Not a tree → false**.`,
          draw()
        );
        return false;
      }

      T.step(`Exactly ${n - 1} edges — promising. Now make sure none of them closes a loop. Everyone starts as the leader of their own club.`, draw());
      for (let k = 0; k < edges.length; k += 1) {
        const [a, b] = edges[k];
        const ra = dsu.find(a);
        const rb = dsu.find(b);
        edgeTones[k] = "active";
        T.step(`Edge ${a} — ${b}: ${a}'s club leader is ${ra}, and ${b}'s is ${rb}.`, draw({ [a]: "cmp", [b]: "cmp" }, { [ra]: "cmp", [rb]: "cmp" }), {
          ask: yesNo(`Are ${a} and ${b} already in the same club?`, ra === rb, "If they are, this edge adds a second route between them — a loop."),
        });
        if (ra === rb) {
          edgeTones[k] = "bad";
          T.step("Same club already, so this edge closes a loop. **Not a tree → false**.", draw({ [a]: "bad", [b]: "bad" }));
          return false;
        }
        dsu.parent[ra] = rb;
        edgeTones[k] = "good";
        T.step(`Different clubs, so merge them: leader ${ra} now reports to ${rb}.`, draw({}, { [ra]: "good" }));
      }
      T.step(`${n - 1} edges and no loops means everything is connected. **Valid tree → true**.`, draw());
      return true;
    },
    java: `public boolean validTree(int n, int[][] edges) {
    if (edges.length != n - 1) return false;  // a tree has exactly n - 1 edges
    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i; // everyone starts in their own club
    for (int[] e : edges) {
        int a = find(parent, e[0]), b = find(parent, e[1]);
        if (a == b) return false;              // already connected: this edge makes a loop
        parent[a] = b;                         // merge the two clubs
    }
    return true;
}

private int find(int[] parent, int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];         // path halving keeps the clubs flat
        x = parent[x];
    }
    return x;
}`,
    python: `def validTree(self, n: int, edges: List[List[int]]) -> bool:
    if len(edges) != n - 1:
        return False
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb:
            return False
        parent[ra] = rb
    return True`,
    quiz: {
      q: "Why check that there are exactly n − 1 edges first?",
      options: [
        "A tree has exactly n − 1 edges; with that count, having no cycle also guarantees everything is connected",
        "Union-Find needs it to initialise",
        "It's faster than reading the edges",
        "It detects self-loops",
      ],
      answer: 0,
      why: "n − 1 edges with no cycle must connect everything — any disconnected forest would need fewer edges.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "number-of-connected-components-in-an-undirected-graph",
    lc: 323,
    title: "Number of Connected Components in an Undirected Graph",
    world: "graphs",
    difficulty: "Medium",
    pattern: "union-find",
    emoji: "🫧",
    statement: "Given n nodes labelled 0 to n − 1 and a list of undirected edges, return the number of connected components.",
    story:
      "A room full of strangers, each their own group of one. Every handshake between two different groups merges them into one bigger group. Count the groups that are left when the handshakes stop.",
    insight: "Start with n components. For each edge, union the endpoints; every union that actually merges two different roots removes one component.",
    complexity: { time: "O((n + E) · α(n))", space: "O(n)", why: "Near-constant time per union/find." },
    inputs: [
      { name: "n", kind: "int", min: 1, max: 7 },
      { name: "edges", kind: "pairs", minLen: 0, maxLen: 8, min: 0, max: 6 },
    ],
    validate: ({ n, edges }) => validateEdges(n, edges),
    examples: [
      { input: { n: 5, edges: [[0, 1], [1, 2], [3, 4]] }, output: 2 },
      { input: { n: 5, edges: [[0, 1], [1, 2], [2, 3], [3, 4]] }, output: 1 },
      { input: { n: 4, edges: [] }, output: 4 },
    ],
    trace({ n, edges }, T) {
      const dsu = makeDSU(n);
      const edgeTones = {};
      const draw = unionFindDraw(n, edges, dsu, edgeTones);
      let components = n;

      T.step(`Start with ${n} separate groups. Every edge that joins two different groups merges them, and the count drops by one.`, draw(), { vars: { components } });
      for (let k = 0; k < edges.length; k += 1) {
        const [a, b] = edges[k];
        const ra = dsu.find(a);
        const rb = dsu.find(b);
        edgeTones[k] = "active";
        T.step(`Edge ${a} — ${b}: leaders ${ra} and ${rb}.`, draw({ [a]: "cmp", [b]: "cmp" }, { [ra]: "cmp", [rb]: "cmp" }), {
          vars: { components },
          ask: yesNo(`Will this edge merge two groups (are ${a} and ${b} in different groups)?`, ra !== rb),
        });
        if (ra === rb) {
          edgeTones[k] = "dim";
          T.step(`${a} and ${b} are already in the same group. Nothing changes.`, draw(), { vars: { components } });
          continue;
        }
        dsu.parent[ra] = rb;
        components -= 1;
        edgeTones[k] = "good";
        T.step(`Merge: leader ${ra} now reports to ${rb}. Groups left: **${components}**.`, draw({}, { [ra]: "good" }), { vars: { components } });
      }
      T.step(`**${components}** connected component${components === 1 ? "" : "s"}.`, draw(), { vars: { components } });
      return components;
    },
    java: `public int countComponents(int n, int[][] edges) {
    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    int components = n;                        // everyone starts alone
    for (int[] e : edges) {
        int a = find(parent, e[0]), b = find(parent, e[1]);
        if (a != b) {
            parent[a] = b;                     // merge two groups...
            components--;                      // ...so there is one fewer
        }
    }
    return components;
}

private int find(int[] parent, int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
    }
    return x;
}`,
    python: `def countComponents(self, n: int, edges: List[List[int]]) -> int:
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    components = n
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            components -= 1
    return components`,
    quiz: {
      q: "What does a successful union tell you?",
      options: [
        "Two separate components just became one, so the count drops by one",
        "A cycle was found",
        "The graph is a tree",
        "Nothing — only finds matter",
      ],
      answer: 0,
      why: "A union that finds the same root merges nothing. One that finds different roots glues two components together.",
    },
  },
];
