import {
  arr,
  tree,
  forest,
  grid,
  stack,
  queue,
  text,
  buildTree,
  treeToLevel,
  TreeNode,
  yesNo,
  choose,
  pickNumber,
  paint,
  outside,
} from "../../engine/scene";
import { formatValue } from "../../engine/trace";

const valOf = (node) => (node ? String(node.val) : "null");
const fmt = (x) => (x === Infinity ? "∞" : x === -Infinity ? "−∞" : String(x));

function heightOf(node) {
  return node ? 1 + Math.max(heightOf(node.left), heightOf(node.right)) : 0;
}

function paintSubtree(node, tone, out = {}) {
  if (!node) return out;
  out[node.id] = tone;
  paintSubtree(node.left, tone, out);
  paintSubtree(node.right, tone, out);
  return out;
}

function sameTree(a, b) {
  if (!a || !b) return a === b;
  return a.val === b.val && sameTree(a.left, b.left) && sameTree(a.right, b.right);
}

function preorderNodes(node, out = []) {
  if (!node) return out;
  out.push(node);
  preorderNodes(node.left, out);
  preorderNodes(node.right, out);
  return out;
}

function inorderValues(node, out = []) {
  if (!node) return out;
  inorderValues(node.left, out);
  out.push(node.val);
  inorderValues(node.right, out);
  return out;
}

function isBST(level) {
  const ok = (n, lo, hi) => !n || (lo < n.val && n.val < hi && ok(n.left, lo, n.val) && ok(n.right, n.val, hi));
  return ok(buildTree(level), -Infinity, Infinity);
}

const treeInput = (name, extra = {}) => ({ name, kind: "tree", minLen: 0, maxLen: 15, min: -99, max: 99, ...extra });

/** A small trie that knows how to draw itself. */
function makeTrie() {
  let nextId = 0;
  const node = (ch, parent) => ({ id: "n" + nextId++, ch, parent, children: new Map(), end: false, word: null });
  const root = node("•", null);
  return {
    root,
    insert(word) {
      let n = root;
      for (const ch of word) {
        if (!n.children.has(ch)) n.children.set(ch, node(ch, n));
        n = n.children.get(ch);
      }
      n.end = true;
      return n;
    },
    missing(word) {
      let n = root;
      let i = 0;
      while (i < word.length && n.children.has(word[i])) {
        n = n.children.get(word[i]);
        i += 1;
      }
      return word.length - i;
    },
    walk(word) {
      let n = root;
      for (let i = 0; i < word.length; i += 1) {
        if (!n.children.has(word[i])) return { node: n, broken: i };
        n = n.children.get(word[i]);
      }
      return { node: n, broken: null };
    },
    pathTones(word, tone) {
      const out = {};
      let n = root;
      for (const ch of word) {
        if (!n.children.has(ch)) break;
        n = n.children.get(ch);
        out[n.id] = tone;
      }
      return out;
    },
    draw(tones = {}) {
      const nodes = [];
      (function walk(n) {
        nodes.push({ id: n.id, v: n.ch, parent: n.parent ? n.parent.id : null, tone: tones[n.id], sub: n.end ? "★" : undefined });
        [...n.children.keys()].sort().forEach((c) => walk(n.children.get(c)));
      })(root);
      return forest("trie", nodes);
    },
  };
}

export const treeProblems = [
  /* ------------------------------------------------------------------ */
  {
    slug: "maximum-depth-of-binary-tree",
    lc: 104,
    title: "Maximum Depth of Binary Tree",
    world: "trees",
    difficulty: "Easy",
    pattern: "tree-dfs",
    emoji: "📐",
    statement: "Return the maximum depth of a binary tree: the number of nodes on the longest root-to-leaf path.",
    story:
      "A company wants to know how many management levels it has. The CEO doesn't count everyone — she asks her two direct reports how deep their teams go, takes the bigger answer, and adds one for herself. Everyone below does the same.",
    insight: "depth(node) = 1 + max(depth(left), depth(right)), with depth(null) = 0. Trust the recursion to answer for each subtree.",
    complexity: { time: "O(n)", space: "O(h)", why: "Every node is visited once; the call stack is as deep as the tree." },
    inputs: [treeInput("root")],
    examples: [
      { input: { root: [3, 9, 20, null, null, 15, 7] }, output: 3 },
      { input: { root: [1, null, 2] }, output: 2 },
      { input: { root: [] }, output: 0 },
    ],
    trace({ root: level }, T) {
      const root = buildTree(level);
      const tones = {};
      const subs = {};
      const draw = (here) => tree("tree", root, { tones: { ...tones }, subs: { ...subs }, pointers: here ? { here } : {}, empty: "empty tree" });
      if (!root) {
        T.step("The tree is empty, so its depth is **0**.", [draw()]);
        return 0;
      }
      T.step("Ask every node: how many levels hang below you, counting yourself? The answer is 1 + the deeper child's answer. Missing children answer 0.", [draw()]);

      function depth(node, level) {
        if (!node) return 0;
        const leaf = !node.left && !node.right;
        tones[node.id] = "active";
        if (!leaf) {
          T.step(`${node.val} asks its children how deep they go, and waits for their answers.`, [draw(node)], {
            ask: level <= 1 ? pickNumber(`What depth will ${node.val} report?`, heightOf(node)) : undefined,
          });
          tones[node.id] = "cmp";
        }
        const l = depth(node.left, level + 1);
        const r = depth(node.right, level + 1);
        const d = 1 + Math.max(l, r);
        subs[node.id] = "d=" + d;
        tones[node.id] = "good";
        T.step(
          leaf ? `${node.val} is a leaf: both children answer 0, so it reports **1**.` : `${node.val} hears left = ${l}, right = ${r}, and reports 1 + max(${l}, ${r}) = **${d}**.`,
          [draw(node)]
        );
        return d;
      }

      const answer = depth(root, 0);
      tones[root.id] = "found";
      T.step(`The root reports **${answer}** — the maximum depth.`, [draw()]);
      return answer;
    },
    java: `public int maxDepth(TreeNode root) {
    if (root == null) return 0;                                    // no node, no levels
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right)); // me + my deeper side
}`,
    python: `def maxDepth(self, root: Optional[TreeNode]) -> int:
    if not root:
        return 0
    return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))`,
    quiz: {
      q: "What does a null child report as its depth?",
      options: ["0 — an empty tree has no levels", "1", "−1", "It throws an error"],
      answer: 0,
      why: "Choosing 0 makes a leaf's answer come out as 1 + max(0, 0) = 1 with no special case.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "same-tree",
    lc: 100,
    title: "Same Tree",
    world: "trees",
    difficulty: "Easy",
    pattern: "tree-dfs",
    emoji: "👯",
    statement: "Return true if two binary trees have the same structure and the same values at every position.",
    story:
      "Two friends compare their family trees by walking them in perfect lockstep, one generation at a time. The instant one has a relative where the other has an empty spot — or the names differ — the trees aren't the same.",
    insight: "Both null → match. One null → mismatch. Otherwise the values must match and both pairs of subtrees must match.",
    complexity: { time: "O(n)", space: "O(h)", why: "Each pair of nodes is compared at most once." },
    inputs: [treeInput("p", { maxLen: 7 }), treeInput("q", { maxLen: 7 })],
    examples: [
      { input: { p: [1, 2, 3], q: [1, 2, 3] }, output: true },
      { input: { p: [1, 2], q: [1, null, 2] }, output: false },
      { input: { p: [1, 2, 1], q: [1, 1, 2] }, output: false },
    ],
    trace({ p, q }, T) {
      const a = buildTree(p);
      const b = buildTree(q);
      const ta = {};
      const tb = {};
      const draw = (x, y) => [
        tree("p", a, { tones: { ...ta }, pointers: x ? { here: x } : {}, empty: "empty" }),
        tree("q", b, { tones: { ...tb }, pointers: y ? { here: y } : {}, empty: "empty" }),
      ];

      T.step("Walk both trees in lockstep. Both empty is a match, exactly one empty is a mismatch, and otherwise the values must be equal.", draw());

      function same(x, y, px, py, side) {
        if (!x && !y) return true;
        if (!x || !y) {
          if (x) ta[x.id] = "bad";
          if (y) tb[y.id] = "bad";
          if (px) ta[px.id] = "bad";
          if (py) tb[py.id] = "bad";
          T.step(
            px ? `${side} child of ${px.val}: p has ${valOf(x)}, but q has ${valOf(y)}. **Different → false**.` : "One tree is empty and the other isn't. **Different → false**.",
            draw(x, y)
          );
          return false;
        }
        ta[x.id] = "cmp";
        tb[y.id] = "cmp";
        T.step(`Compare ${x.val} with ${y.val}.`, draw(x, y), { ask: yesNo(`Do ${x.val} and ${y.val} match?`, x.val === y.val) });
        if (x.val !== y.val) {
          ta[x.id] = "bad";
          tb[y.id] = "bad";
          T.step(`${x.val} ≠ ${y.val}. **Different → false**.`, draw(x, y));
          return false;
        }
        ta[x.id] = "good";
        tb[y.id] = "good";
        return same(x.left, y.left, x, y, "Left") && same(x.right, y.right, x, y, "Right");
      }

      const answer = same(a, b, null, null, "");
      if (answer) T.step("Every position matched. **Same tree → true**.", draw());
      return answer;
    },
    java: `public boolean isSameTree(TreeNode p, TreeNode q) {
    if (p == null && q == null) return true;  // both empty: match
    if (p == null || q == null) return false; // only one empty: mismatch
    return p.val == q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}`,
    python: `def isSameTree(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
    if not p or not q:
        return p is q
    return p.val == q.val and self.isSameTree(p.left, q.left) and self.isSameTree(p.right, q.right)`,
    quiz: {
      q: "When does the comparison return false straight away?",
      options: [
        "When exactly one of the two nodes is null, or the values differ",
        "When both nodes are null",
        "Whenever it reaches a leaf",
        "Only after comparing the trees' heights",
      ],
      answer: 0,
      why: "Those are the only two ways a single position can disagree. Everything else is delegated to the children.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "invert-binary-tree",
    lc: 226,
    title: "Invert Binary Tree",
    world: "trees",
    difficulty: "Easy",
    pattern: "tree-dfs",
    emoji: "🪞",
    statement: "Invert a binary tree — mirror it left to right — and return its root.",
    story:
      "Hold a family photo up to a mirror. Every parent still has the same two children, just swapped sides. Walk the tree, tell every node to swap its kids, and the whole picture flips.",
    insight: "Swap each node's left and right children, then invert both subtrees. Every node is swapped exactly once.",
    complexity: { time: "O(n)", space: "O(h)", why: "One swap per node; recursion depth is the height." },
    inputs: [treeInput("root")],
    examples: [
      { input: { root: [4, 2, 7, 1, 3, 6, 9] }, output: [4, 7, 2, 9, 6, 3, 1] },
      { input: { root: [2, 1, 3] }, output: [2, 3, 1] },
      { input: { root: [] }, output: [] },
    ],
    trace({ root: level }, T) {
      const root = buildTree(level);
      const tones = {};
      const draw = (here) => tree("tree", root, { tones: { ...tones }, pointers: here ? { here } : {}, empty: "empty tree" });
      if (!root) {
        T.step("An empty tree mirrors to an empty tree: **[]**.", [draw()]);
        return [];
      }
      T.step("Mirror the tree: at every node, swap the left and right children. Each child then mirrors its own subtree the same way.", [draw()]);

      let asked = false;
      function invert(node) {
        if (!node) return;
        if (!node.left && !node.right) {
          tones[node.id] = "good";
          return;
        }
        tones[node.id] = "active";
        const canAsk = !asked && node.left && node.right && node.left.val !== node.right.val;
        T.step(`At ${node.val}: swap its children (${valOf(node.left)} ↔ ${valOf(node.right)}).`, [draw(node)], {
          ask: canAsk
            ? choose(`After the swap, which child sits on ${node.val}'s left?`, [valOf(node.left), valOf(node.right)], 1, "The old right child moves over to the left.")
            : undefined,
        });
        if (canAsk) asked = true;
        [node.left, node.right] = [node.right, node.left];
        tones[node.id] = "good";
        T.step(`Swapped — the subtrees trade places. ${node.val}'s left is now ${valOf(node.left)} and its right is ${valOf(node.right)}.`, [draw(node)]);
        invert(node.left);
        invert(node.right);
      }

      invert(root);
      const result = treeToLevel(root);
      T.step(`Mirrored: **${formatValue(result)}**.`, [draw()]);
      return result;
    },
    java: `public TreeNode invertTree(TreeNode root) {
    if (root == null) return null;
    TreeNode left = root.left;
    root.left = invertTree(root.right); // mirror the right side into the left slot
    root.right = invertTree(left);
    return root;
}`,
    python: `def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
    if root:
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
    return root`,
    quiz: {
      q: "Does it matter whether you swap before or after recursing into the children?",
      options: [
        "No — swapping first or last both mirror every node exactly once",
        "Yes, only post-order works",
        "Yes, only pre-order works",
        "You must use breadth-first search",
      ],
      answer: 0,
      why: "Each node's swap is independent of its descendants' swaps, so any traversal order that visits every node works.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "binary-tree-maximum-path-sum",
    lc: 124,
    title: "Binary Tree Maximum Path Sum",
    world: "trees",
    difficulty: "Hard",
    pattern: "tree-dfs",
    emoji: "🥾",
    statement:
      "A path is any sequence of connected nodes, each used at most once, and it need not pass through the root. Return the maximum sum of any path.",
    story:
      "Hikers score points on a mountain trail network. Each junction asks its two trails how many points they can add, ignoring any trail that would lose points. It records the best hike that bends through itself — but it can only recommend ONE trail to the junction above it.",
    insight: "gain(node) = node + max(0, gain(left), gain(right)) is what a node offers its parent. At each node, also try node + left + right as a candidate answer.",
    complexity: { time: "O(n)", space: "O(h)", why: "One post-order pass." },
    inputs: [treeInput("root", { minLen: 1, maxLen: 11 })],
    examples: [
      { input: { root: [1, 2, 3] }, output: 6 },
      { input: { root: [-10, 9, 20, null, null, 15, 7] }, output: 42 },
      { input: { root: [-3] }, output: -3 },
    ],
    trace({ root: level }, T) {
      const root = buildTree(level);
      const tones = {};
      const subs = {};
      const gains = {};
      const choice = {};
      const draw = (here) => tree("tree", root, { tones: { ...tones }, subs: { ...subs }, pointers: here ? { here } : {} });

      (function pure(n) {
        if (!n) return 0;
        const g = n.val + Math.max(0, pure(n.left), pure(n.right));
        gains[n.id] = g;
        return g;
      })(root);

      let best = -Infinity;
      let bestAt = null;
      T.step("Each node reports upward the best **one-branch** path it can offer. Meanwhile it checks the best path that **bends** through itself using both branches.", [draw()], {
        vars: { best: fmt(best) },
      });

      function gain(node) {
        if (!node) return 0;
        if (node.left || node.right) {
          const child = node.left || node.right;
          const side = node.left ? "left" : "right";
          tones[node.id] = "active";
          T.step(`${node.val} waits for its children's reports.`, [draw(node)], {
            vars: { best: fmt(best) },
            ask: yesNo(`Will ${node.val} use its ${side} branch (is that gain positive)?`, gains[child.id] > 0, "A branch with negative gain is clipped to 0 — no branch beats a losing one."),
          });
          tones[node.id] = "cmp";
        }
        const l = Math.max(0, gain(node.left));
        const r = Math.max(0, gain(node.right));
        const through = node.val + l + r;
        const improved = through > best;
        if (improved) {
          best = through;
          bestAt = { node, l, r };
        }
        const up = node.val + Math.max(l, r);
        choice[node.id] = Math.max(l, r) > 0 ? (l >= r ? "L" : "R") : null;
        subs[node.id] = "↑" + up;
        tones[node.id] = "good";
        T.step(
          `At ${node.val}: left offers ${l}, right offers ${r}. Bending here: ${node.val} + ${l} + ${r} = **${through}**${improved ? " — a new best!" : ""}. Upward it can pass only one branch: ${node.val} + max(${l}, ${r}) = ${up}.`,
          [draw(node)],
          { vars: { best: fmt(best) } }
        );
        return up;
      }

      gain(root);
      const down = (n) => {
        const out = [n];
        if (choice[n.id] === "L") out.push(...down(n.left));
        if (choice[n.id] === "R") out.push(...down(n.right));
        return out;
      };
      const pathNodes = [
        bestAt.node,
        ...(bestAt.l > 0 ? down(bestAt.node.left) : []),
        ...(bestAt.r > 0 ? down(bestAt.node.right) : []),
      ];
      T.step(`The best path bends through ${bestAt.node.val} and sums to **${best}**.`, [
        tree("tree", root, { subs: { ...subs }, tones: Object.fromEntries(pathNodes.map((n) => [n.id, "found"])) }),
      ], { vars: { best } });
      return best;
    },
    java: `private int best = Integer.MIN_VALUE;

public int maxPathSum(TreeNode root) {
    gain(root);
    return best;
}

private int gain(TreeNode node) {
    if (node == null) return 0;
    int left = Math.max(0, gain(node.left));       // a losing branch is worse than no branch
    int right = Math.max(0, gain(node.right));
    best = Math.max(best, node.val + left + right); // a path that bends through this node
    return node.val + Math.max(left, right);        // the parent can only continue one branch
}`,
    python: `def maxPathSum(self, root: Optional[TreeNode]) -> int:
    best = float("-inf")

    def gain(node):
        nonlocal best
        if not node:
            return 0
        left = max(0, gain(node.left))
        right = max(0, gain(node.right))
        best = max(best, node.val + left + right)
        return node.val + max(left, right)

    gain(root)
    return best`,
    quiz: {
      q: "Why does gain() return node + max(left, right) instead of node + left + right?",
      options: [
        "A path continuing up to the parent can only use one branch; bending through both is recorded as a candidate instead",
        "To avoid counting the node twice",
        "Because the right branch is always negative",
        "It's only an optimisation — both work",
      ],
      answer: 0,
      why: "A path can't fork. If it uses both children, it has to end at this node, so it becomes a candidate rather than a report.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "binary-tree-level-order-traversal",
    lc: 102,
    title: "Binary Tree Level Order Traversal",
    world: "trees",
    difficulty: "Medium",
    pattern: "tree-bfs",
    emoji: "🎢",
    statement: "Return the values of a binary tree level by level, from left to right.",
    story:
      "Boarding a plane by rows. A gate agent calls everyone in the current row (however many are waiting right now), and each person who boards sends their children to the back of the line for the next call.",
    insight: "BFS with a queue. Before each level, snapshot the queue's size — exactly that many nodes belong to the current level.",
    complexity: { time: "O(n)", space: "O(w)", why: "Each node is queued once; w is the widest level." },
    inputs: [treeInput("root")],
    examples: [
      { input: { root: [3, 9, 20, null, null, 15, 7] }, output: [[3], [9, 20], [15, 7]] },
      { input: { root: [1] }, output: [[1]] },
      { input: { root: [] }, output: [] },
    ],
    trace({ root: level }, T) {
      const root = buildTree(level);
      const tones = {};
      const out = [];
      const draw = (q, here) => [
        tree("tree", root, { tones: { ...tones }, pointers: here ? { here } : {}, empty: "empty tree" }),
        queue("queue", q.map((n) => n.val)),
        text("levels", formatValue(out)),
      ];
      if (!root) {
        T.step("The tree is empty, so there are no levels: **[]**.", draw([]));
        return [];
      }
      const q = [root];
      T.step("Breadth-first search with a queue: nodes join at the back and leave from the front, so they come out level by level.", draw(q));

      while (q.length) {
        const size = q.length;
        const levelVals = [];
        const nextCount = q.reduce((sum, n) => sum + (n.left ? 1 : 0) + (n.right ? 1 : 0), 0);
        q.forEach((n) => {
          tones[n.id] = "cmp";
        });
        T.step(`The queue holds **${size}** node${size === 1 ? "" : "s"}. Snapshot that number — exactly that many make up this level.`, draw(q), {
          vars: { size },
          ask: pickNumber("How many nodes will the next level have?", nextCount),
        });
        for (let i = 0; i < size; i += 1) {
          const node = q.shift();
          levelVals.push(node.val);
          tones[node.id] = "active";
          const kids = [node.left, node.right].filter(Boolean);
          kids.forEach((k) => q.push(k));
          T.step(
            `Take ${node.val} off the front` + (kids.length ? ` and queue its children (${kids.map((k) => k.val).join(", ")}).` : ". It has no children."),
            draw(q, node),
            { vars: { size, taken: i + 1 } }
          );
          tones[node.id] = "good";
        }
        out.push(levelVals);
        T.step(`Level complete: ${formatValue(levelVals)}.`, draw(q), { vars: { size } });
      }

      T.step(`All levels: **${formatValue(out)}**.`, draw(q));
      return out;
    },
    java: `public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    if (root == null) return out;
    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();               // exactly this many nodes are on this level
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        out.add(level);
    }
    return out;
}`,
    python: `def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
    if not root:
        return []
    out, queue = [], collections.deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):   # len() is read once, before the loop starts
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        out.append(level)
    return out`,
    quiz: {
      q: "Why snapshot queue.size() before the inner loop?",
      options: [
        "Children added during the loop belong to the next level, so the snapshot marks where this level ends",
        "Queues can't report their size mid-loop",
        "It makes the traversal O(1)",
        "To keep each level sorted",
      ],
      answer: 0,
      why: "The queue grows while you process a level. Reading the size once freezes the boundary between levels.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "serialize-and-deserialize-binary-tree",
    lc: 297,
    title: "Serialize and Deserialize Binary Tree",
    world: "trees",
    difficulty: "Hard",
    pattern: "tree-dfs",
    emoji: "📜",
    statement: "Design functions that turn a binary tree into a string and rebuild exactly the same tree from that string.",
    story:
      "You're shipping a bonsai tree through the post, flat-packed. You write assembly instructions while walking the tree: each branch's value, and a '#' wherever a branch is missing. The receiver follows the same walk and rebuilds it exactly.",
    insight: "Preorder with '#' for nulls. The markers pin down the shape, so deserialization can read the tokens back in the same order, recursively.",
    complexity: { time: "O(n)", space: "O(n)", why: "Each node and each null marker is written and read once." },
    inputs: [treeInput("root", { maxLen: 11 })],
    examples: [
      { input: { root: [1, 2, 3, null, null, 4, 5] }, output: [1, 2, 3, null, null, 4, 5] },
      { input: { root: [1, null, 2] }, output: [1, null, 2] },
      { input: { root: [] }, output: [] },
    ],
    trace({ root: level }, T) {
      const root = buildTree(level);
      const tones = {};
      const tokens = [];
      const drawWrite = (here) => [
        tree("original", root, { tones: { ...tones }, pointers: here ? { here } : {}, empty: "empty tree" }),
        text("serialized", tokens.length ? tokens.join(",") : "(nothing yet)"),
      ];

      T.step("Serialize with a preorder walk: write each value, and write '#' wherever a child is missing. Those markers pin down the exact shape.", drawWrite());
      (function write(node) {
        if (!node) {
          tokens.push("#");
          return;
        }
        tokens.push(String(node.val));
        tones[node.id] = "active";
        T.step(`Write ${node.val}, then its left subtree, then its right subtree.`, drawWrite(node));
        tones[node.id] = "visited";
        write(node.left);
        write(node.right);
      })(root);
      T.step(`Serialized: "${tokens.join(",")}". Now rebuild a brand-new tree from nothing but this string.`, drawWrite());

      let i = 0;
      let rebuilt = null;
      const rt = {};
      const drawRead = (node) => [
        arr("tokens", tokens, { pointers: { next: Math.min(i, tokens.length - 1) }, tones: paint(0, i - 1, "dim") }),
        tree("rebuilt", rebuilt, { tones: { ...rt }, pointers: node ? { new: node } : {}, empty: "nothing yet" }),
      ];
      (function read(parent, side) {
        const tok = tokens[i];
        i += 1;
        if (tok === "#") return;
        const node = new TreeNode(Number(tok), "r" + (i - 1));
        if (parent) parent[side] = node;
        else rebuilt = node;
        rt[node.id] = "active";
        T.step(`Read "${tok}" → create ${node.val}` + (parent ? ` as the ${side} child of ${parent.val}.` : " as the root."), drawRead(node), {
          ask: i < tokens.length ? yesNo(`Is the next token '#', meaning ${node.val} has no left child?`, tokens[i] === "#") : undefined,
        });
        rt[node.id] = "good";
        read(node, "left");
        read(node, "right");
      })(null, null);

      const result = treeToLevel(rebuilt);
      T.step(`Rebuilt: **${formatValue(result)}** — identical to the original.`, drawRead());
      return result;
    },
    java: `public String serialize(TreeNode root) {
    StringBuilder sb = new StringBuilder();
    write(root, sb);
    return sb.toString();
}

private void write(TreeNode node, StringBuilder sb) {
    if (node == null) {
        sb.append("#,");                 // mark the missing child
        return;
    }
    sb.append(node.val).append(',');     // preorder: value, then left, then right
    write(node.left, sb);
    write(node.right, sb);
}

public TreeNode deserialize(String data) {
    Deque<String> tokens = new ArrayDeque<>(Arrays.asList(data.split(",")));
    return read(tokens);
}

private TreeNode read(Deque<String> tokens) {
    String token = tokens.poll();
    if (token.equals("#")) return null;
    TreeNode node = new TreeNode(Integer.parseInt(token));
    node.left = read(tokens);            // tokens come back in the order they were written
    node.right = read(tokens);
    return node;
}`,
    python: `class Codec:
    def serialize(self, root: Optional[TreeNode]) -> str:
        out = []

        def write(node):
            if not node:
                out.append("#")
                return
            out.append(str(node.val))
            write(node.left)
            write(node.right)

        write(root)
        return ",".join(out)

    def deserialize(self, data: str) -> Optional[TreeNode]:
        tokens = iter(data.split(","))

        def read():
            token = next(tokens)
            if token == "#":
                return None
            node = TreeNode(int(token))
            node.left = read()
            node.right = read()
            return node

        return read()`,
    quiz: {
      q: "Why are the '#' null markers essential?",
      options: [
        "Without them, preorder values can't show where children are missing, so different trees would serialize identically",
        "They separate the numbers",
        "They mark negative numbers",
        "They make the string shorter",
      ],
      answer: 0,
      why: "[1, 2] and [1, null, 2] both have preorder \"1,2\". With markers they become \"1,2,#,#,#\" and \"1,#,2,#,#\".",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "subtree-of-another-tree",
    lc: 572,
    title: "Subtree of Another Tree",
    world: "trees",
    difficulty: "Easy",
    pattern: "tree-dfs",
    emoji: "🧩",
    statement: "Return true if subRoot appears somewhere inside root as an exact subtree — a node plus all of its descendants.",
    story:
      "You've found a jigsaw piece and want to know where it came from. Hold it against every spot on the finished puzzle. At each spot, check that it matches perfectly — not just the edge you're touching, but every nook all the way down.",
    insight: "For every node in root, check sameTree(node, subRoot). The first full match wins.",
    complexity: { time: "O(m · n)", space: "O(h)", why: "A full comparison may start at each of the m nodes." },
    inputs: [treeInput("root", { minLen: 1, maxLen: 11 }), treeInput("subRoot", { minLen: 1, maxLen: 7 })],
    examples: [
      { input: { root: [3, 4, 5, 1, 2], subRoot: [4, 1, 2] }, output: true },
      { input: { root: [3, 4, 5, 1, 2, null, null, null, null, 0], subRoot: [4, 1, 2] }, output: false },
      { input: { root: [1, 1], subRoot: [1] }, output: true },
    ],
    trace({ root: rl, subRoot: sl }, T) {
      const root = buildTree(rl);
      const sub = buildTree(sl);
      const visited = {};
      const draw = (candidate, tone) => [
        tree("root", root, { tones: { ...visited, ...(candidate ? paintSubtree(candidate, tone) : {}) }, pointers: candidate ? { here: candidate } : {} }),
        tree("subRoot", sub, { tones: tone ? paintSubtree(sub, tone) : {} }),
      ];

      T.step("Visit every node of root. At each one, ask whether the tree hanging from it is identical to subRoot.", draw());
      for (const node of preorderNodes(root)) {
        const match = sameTree(node, sub);
        T.step(`Candidate: the subtree rooted at ${node.val}.`, draw(node, "cmp"), {
          ask: yesNo(`Is the subtree at ${node.val} identical to subRoot?`, match, "Identical means the same values and the same shape, all the way to the leaves."),
        });
        if (match) {
          T.step("A perfect fit. **subRoot is a subtree → true**.", draw(node, "found"));
          return true;
        }
        visited[node.id] = "visited";
      }
      T.step("No candidate matched. **Not a subtree → false**.", draw());
      return false;
    },
    java: `public boolean isSubtree(TreeNode root, TreeNode subRoot) {
    if (root == null) return false;
    return isSame(root, subRoot)                 // does it fit right here?
        || isSubtree(root.left, subRoot)         // ...or somewhere on the left?
        || isSubtree(root.right, subRoot);       // ...or somewhere on the right?
}

private boolean isSame(TreeNode a, TreeNode b) {
    if (a == null || b == null) return a == b;
    return a.val == b.val && isSame(a.left, b.left) && isSame(a.right, b.right);
}`,
    python: `def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:
    def same(a, b):
        if not a or not b:
            return a is b
        return a.val == b.val and same(a.left, b.left) and same(a.right, b.right)

    if not root:
        return False
    return same(root, subRoot) or self.isSubtree(root.left, subRoot) or self.isSubtree(root.right, subRoot)`,
    levelUp: "Serialize both trees (with null markers) and search for one string inside the other with KMP to get O(m + n).",
    quiz: {
      q: "What's the worst-case time of the straightforward approach?",
      options: ["O(m · n) — a full comparison could start at every node", "O(m + n)", "O(log n)", "O(n²)"],
      answer: 0,
      why: "Picture a tree of all 1s: nearly every candidate matches for a long way before failing at the bottom.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "construct-binary-tree-from-preorder-and-inorder-traversal",
    lc: 105,
    title: "Construct Binary Tree from Preorder and Inorder Traversal",
    world: "trees",
    difficulty: "Medium",
    pattern: "tree-dfs",
    emoji: "🏗️",
    statement: "Given the preorder and inorder traversals of a tree with distinct values, rebuild the tree.",
    story:
      "Two witnesses describe the same family. The first always names a parent before their children (preorder), so they tell you who's in charge. The second lists everyone left to right (inorder), so they tell you who stands on which side of that parent.",
    insight: "The next preorder value is the root of the current range. Its position in inorder splits the range into left and right subtrees. Recurse left, then right.",
    complexity: { time: "O(n)", space: "O(n)", why: "A hash map finds each root's inorder position in O(1)." },
    inputs: [
      { name: "preorder", kind: "intArray", minLen: 1, maxLen: 9, min: -99, max: 99 },
      { name: "inorder", kind: "intArray", minLen: 1, maxLen: 9, min: -99, max: 99 },
    ],
    validate: ({ preorder, inorder }) => {
      if (preorder.length !== inorder.length) return "Both orders need the same number of values.";
      if (new Set(preorder).size !== preorder.length) return "Values must be distinct.";
      const index = new Map(inorder.map((v, i) => [v, i]));
      let p = 0;
      const ok = (lo, hi) => {
        if (lo > hi) return true;
        const mid = index.get(preorder[p]);
        p += 1;
        if (mid === undefined || mid < lo || mid > hi) return false;
        return ok(lo, mid - 1) && ok(mid + 1, hi);
      };
      return ok(0, inorder.length - 1) ? undefined : "Those two orders don't describe the same tree.";
    },
    examples: [
      { input: { preorder: [3, 9, 20, 15, 7], inorder: [9, 3, 15, 20, 7] }, output: [3, 9, 20, null, null, 15, 7] },
      { input: { preorder: [-1], inorder: [-1] }, output: [-1] },
      { input: { preorder: [1, 2, 3], inorder: [2, 3, 1] }, output: [1, 2, null, null, 3] },
    ],
    trace({ preorder, inorder }, T) {
      const n = inorder.length;
      const index = new Map(inorder.map((v, i) => [v, i]));
      let p = 0;
      let root = null;
      const tones = {};

      T.step("Preorder names each subtree's root first. Inorder shows what's on its left and right. Use them together.", [
        arr("preorder", preorder),
        arr("inorder", inorder),
        tree("tree", root, { empty: "nothing yet" }),
      ]);

      (function build(lo, hi, parent, side) {
        if (lo > hi) return;
        const val = preorder[p];
        const mid = index.get(val);
        const node = new TreeNode(val, "t" + p);
        p += 1;
        if (parent) parent[side] = node;
        else root = node;
        tones[node.id] = "active";
        T.step(
          `preorder[${p - 1}] = **${val}** is the root of inorder[${lo}…${hi}]. In inorder it sits at index ${mid}: everything left of it is its left subtree, everything right is its right subtree.`,
          [
            arr("preorder", preorder, { pointers: { p: p - 1 }, tones: { ...paint(0, p - 2, "dim"), [p - 1]: "active" } }),
            arr("inorder", inorder, { window: [lo, hi], tones: outside(lo, hi, n, { ...paint(lo, mid - 1, "cmp"), [mid]: "active", ...paint(mid + 1, hi, "good") }) }),
            tree("tree", root, { tones: { ...tones }, pointers: { new: node } }),
          ],
          { ask: p < n ? yesNo(`Will the next preorder value, ${preorder[p]}, go into ${val}'s left subtree?`, mid > lo, "If the left range isn't empty, preorder visits it next.") : undefined }
        );
        tones[node.id] = "good";
        build(lo, mid - 1, node, "left");
        build(mid + 1, hi, node, "right");
      })(0, n - 1, null, null);

      const result = treeToLevel(root);
      T.step(`Rebuilt: **${formatValue(result)}**.`, [arr("preorder", preorder), arr("inorder", inorder), tree("tree", root, { tones: { ...tones } })]);
      return result;
    },
    java: `private int p = 0;
private final Map<Integer, Integer> inIndex = new HashMap<>();

public TreeNode buildTree(int[] preorder, int[] inorder) {
    for (int i = 0; i < inorder.length; i++) inIndex.put(inorder[i], i);
    return build(preorder, 0, inorder.length - 1);
}

private TreeNode build(int[] preorder, int lo, int hi) {
    if (lo > hi) return null;
    TreeNode node = new TreeNode(preorder[p++]); // preorder always hands us the next root
    int mid = inIndex.get(node.val);             // inorder splits left from right
    node.left = build(preorder, lo, mid - 1);
    node.right = build(preorder, mid + 1, hi);
    return node;
}`,
    python: `def buildTree(self, preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:
    in_index = {v: i for i, v in enumerate(inorder)}
    roots = iter(preorder)

    def build(lo, hi):
        if lo > hi:
            return None
        node = TreeNode(next(roots))
        mid = in_index[node.val]
        node.left = build(lo, mid - 1)
        node.right = build(mid + 1, hi)
        return node

    return build(0, len(inorder) - 1)`,
    quiz: {
      q: "What does the preorder array tell you that inorder doesn't?",
      options: ["Which value is the root of the current subtree", "Which values are on the left", "The tree's height", "Nothing extra"],
      answer: 0,
      why: "Preorder always lists a root before its descendants. Inorder alone could come from many differently rooted trees.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "validate-binary-search-tree",
    lc: 98,
    title: "Validate Binary Search Tree",
    world: "trees",
    difficulty: "Medium",
    pattern: "bst",
    emoji: "🚦",
    statement: "Decide whether a binary tree is a valid BST: every left subtree holds smaller values and every right subtree holds larger values.",
    story:
      "Every node gets a permission slip from its ancestors: “you must be bigger than this and smaller than that.” Going left lowers the ceiling to the parent's value; going right raises the floor. A node outside its slip breaks the rules.",
    insight: "Pass down an open range (lo, hi). Each node must satisfy lo < val < hi; its left child gets (lo, val) and its right child gets (val, hi).",
    complexity: { time: "O(n)", space: "O(h)", why: "Each node is checked once against its range." },
    inputs: [treeInput("root", { minLen: 1 })],
    examples: [
      { input: { root: [2, 1, 3] }, output: true },
      { input: { root: [5, 1, 4, null, null, 3, 6] }, output: false },
      { input: { root: [5, 4, 6, null, null, 3, 7] }, output: false },
    ],
    trace({ root: level }, T) {
      const root = buildTree(level);
      const tones = {};
      const subs = {};
      const draw = (here) => tree("tree", root, { tones: { ...tones }, subs: { ...subs }, pointers: here ? { here } : {} });

      T.step("Each node gets an allowed range from its ancestors. Going left lowers the ceiling to the node's value; going right raises the floor.", [draw()]);

      function valid(node, lo, hi) {
        if (!node) return true;
        subs[node.id] = `(${fmt(lo)}, ${fmt(hi)})`;
        tones[node.id] = "active";
        const ok = lo < node.val && node.val < hi;
        T.step(`${node.val} must be strictly between ${fmt(lo)} and ${fmt(hi)}.`, [draw(node)], {
          ask: yesNo(`Is ${node.val} inside (${fmt(lo)}, ${fmt(hi)})?`, ok),
        });
        if (!ok) {
          tones[node.id] = "bad";
          T.step(`${node.val} breaks its permission slip. **Not a valid BST → false**.`, [draw(node)]);
          return false;
        }
        tones[node.id] = "good";
        return valid(node.left, lo, node.val) && valid(node.right, node.val, hi);
      }

      const answer = valid(root, -Infinity, Infinity);
      if (answer) T.step("Every node stayed inside its range. **Valid BST → true**.", [draw()]);
      return answer;
    },
    java: `public boolean isValidBST(TreeNode root) {
    return valid(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private boolean valid(TreeNode node, long lo, long hi) { // long: values may equal Integer.MIN/MAX
    if (node == null) return true;
    if (node.val <= lo || node.val >= hi) return false;
    return valid(node.left, lo, node.val) && valid(node.right, node.val, hi);
}`,
    python: `def isValidBST(self, root: Optional[TreeNode]) -> bool:
    def valid(node, lo, hi):
        if not node:
            return True
        if not lo < node.val < hi:
            return False
        return valid(node.left, lo, node.val) and valid(node.right, node.val, hi)

    return valid(root, float("-inf"), float("inf"))`,
    levelUp: "An inorder traversal of a valid BST is strictly increasing — checking that each value beats the previous one is an equally good solution.",
    quiz: {
      q: "Why isn't checking left.val < node.val < right.val at each node enough?",
      options: [
        "A value deep in a subtree must respect every ancestor — e.g. a 3 hiding in the right subtree of 5",
        "It is enough",
        "Because values can repeat",
        "It only fails on empty trees",
      ],
      answer: 0,
      why: "In [5, 4, 6, null, null, 3, 7], node 6's children look fine locally, but 3 is on the right side of 5.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "kth-smallest-element-in-a-bst",
    lc: 230,
    title: "Kth Smallest Element in a BST",
    world: "trees",
    difficulty: "Medium",
    pattern: "bst",
    emoji: "🥉",
    statement: "Return the k-th smallest value (1-indexed) in a binary search tree.",
    story:
      "A BST is a library shelf wearing a disguise: read it left, middle, right and the books come out in sorted order. Walk that route and count the books until you reach number k.",
    insight: "An inorder traversal visits BST values in ascending order. Do it iteratively with a stack and stop at the k-th visit.",
    complexity: { time: "O(h + k)", space: "O(h)", why: "Slide down to the minimum, then take k steps." },
    inputs: [
      { name: "root", kind: "tree", minLen: 1, maxLen: 15, min: 0, max: 99 },
      { name: "k", kind: "int", min: 1, max: 15 },
    ],
    validate: ({ root, k }) => {
      if (!isBST(root)) return "The tree must be a valid BST with distinct values.";
      const count = root.filter((v) => v !== null).length;
      return k <= count ? undefined : `k must be between 1 and ${count}.`;
    },
    examples: [
      { input: { root: [3, 1, 4, null, 2], k: 1 }, output: 1 },
      { input: { root: [5, 3, 6, 2, 4, null, null, 1], k: 3 }, output: 3 },
    ],
    trace({ root: level, k }, T) {
      const root = buildTree(level);
      const order = inorderValues(root);
      const tones = {};
      const subs = {};
      const st = [];
      const draw = (here) => [
        tree("BST", root, { tones: { ...tones }, subs: { ...subs }, pointers: here ? { curr: here } : {} }),
        stack("stack", st.map((n) => n.val)),
      ];

      T.step(`Inorder (left, node, right) reads a BST in sorted order. Walk it and stop at visit #${k}.`, draw());
      let node = root;
      let count = 0;
      while (node || st.length) {
        while (node) {
          st.push(node);
          tones[node.id] = "cmp";
          T.step(`Slide left: push ${node.val} — it has to wait until everything smaller is visited.`, draw(node));
          node = node.left;
        }
        node = st.pop();
        count += 1;
        subs[node.id] = "#" + count;
        const hit = count === k;
        tones[node.id] = hit ? "found" : "visited";
        T.step(
          `Nothing smaller is left, so pop ${node.val}: visit #${count}.` + (hit ? ` That's visit #${k} — the answer is **${node.val}**.` : " Now try its right subtree."),
          draw(node),
          { ask: hit ? undefined : pickNumber(`Which value will be visit #${count + 1}?`, order[count]) }
        );
        if (hit) return node.val;
        node = node.right;
      }
      return -1;
    },
    java: `public int kthSmallest(TreeNode root, int k) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode node = root;
    while (true) {
        while (node != null) {    // slide down to the smallest unvisited value
            stack.push(node);
            node = node.left;
        }
        node = stack.pop();       // visits happen in ascending order
        if (--k == 0) return node.val;
        node = node.right;
    }
}`,
    python: `def kthSmallest(self, root: Optional[TreeNode], k: int) -> int:
    stack, node = [], root
    while True:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        k -= 1
        if k == 0:
            return node.val
        node = node.right`,
    quiz: {
      q: "Why does an inorder traversal help here?",
      options: ["It visits a BST's values in ascending order", "It's the fastest traversal", "It visits the root first", "It uses no extra memory"],
      answer: 0,
      why: "Left subtree (all smaller), then the node, then the right subtree (all bigger): sorted by construction.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "lowest-common-ancestor-of-a-binary-search-tree",
    lc: 235,
    title: "Lowest Common Ancestor of a BST",
    world: "trees",
    difficulty: "Medium",
    pattern: "bst",
    emoji: "🧭",
    statement: "Given a BST and two of its nodes p and q, return their lowest common ancestor — the deepest node that has both as descendants (a node counts as its own descendant).",
    story:
      "Two friends live somewhere in a city laid out like a BST. You start at the town square. If both addresses are west, go west; if both are east, go east. The first corner where their directions split is where their routes last shared the road.",
    insight: "From the root: if p and q are both smaller, go left; both larger, go right. Otherwise the current node is the split point — the LCA.",
    complexity: { time: "O(h)", space: "O(1)", why: "One root-to-node walk, no recursion needed." },
    inputs: [
      { name: "root", kind: "tree", minLen: 2, maxLen: 15, min: 0, max: 99 },
      { name: "p", kind: "int", min: 0, max: 99 },
      { name: "q", kind: "int", min: 0, max: 99 },
    ],
    validate: ({ root, p, q }) => {
      if (!isBST(root)) return "The tree must be a valid BST with distinct values.";
      if (p === q) return "p and q must be different values.";
      return root.includes(p) && root.includes(q) ? undefined : "Both p and q must be values in the tree.";
    },
    examples: [
      { input: { root: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 8 }, output: 6 },
      { input: { root: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 4 }, output: 2 },
      { input: { root: [2, 1], p: 2, q: 1 }, output: 2 },
    ],
    trace({ root: level, p, q }, T) {
      const root = buildTree(level);
      const targets = {};
      preorderNodes(root).forEach((n) => {
        if (n.val === p || n.val === q) targets[n.id] = "cmp";
      });
      const tones = {};
      const draw = (here) => tree("BST", root, { tones: { ...targets, ...tones }, pointers: here ? { here } : {} });

      T.step(`Find where the routes to ${p} and ${q} split. Start at the root and let the BST ordering steer.`, [draw()]);
      let node = root;
      while (node) {
        const dir = p < node.val && q < node.val ? 0 : p > node.val && q > node.val ? 1 : 2;
        tones[node.id] = "active";
        T.step(`At ${node.val}.`, [draw(node)], {
          ask: choose(
            `Compare ${p} and ${q} with ${node.val}. What now?`,
            ["Go left", "Go right", "Stop — this is the LCA"],
            dir,
            "Both smaller → left. Both bigger → right. Anything else means the routes split here."
          ),
        });
        if (dir === 2) {
          tones[node.id] = "found";
          T.step(
            node.val === p || node.val === q
              ? `${node.val} is one of the targets, and the other lives below it. **LCA = ${node.val}**.`
              : `${p} and ${q} are on different sides of ${node.val}. **LCA = ${node.val}**.`,
            [draw(node)]
          );
          return node.val;
        }
        tones[node.id] = "visited";
        node = dir === 0 ? node.left : node.right;
      }
      return null;
    },
    java: `public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    TreeNode node = root;
    while (node != null) {
        if (p.val < node.val && q.val < node.val) node = node.left;       // both smaller: go left
        else if (p.val > node.val && q.val > node.val) node = node.right; // both bigger: go right
        else return node;                                                  // the routes split here
    }
    return null;
}`,
    python: `def lowestCommonAncestor(self, root: TreeNode, p: TreeNode, q: TreeNode) -> TreeNode:
    node = root
    while node:
        if p.val < node.val and q.val < node.val:
            node = node.left
        elif p.val > node.val and q.val > node.val:
            node = node.right
        else:
            return node`,
    quiz: {
      q: "When have you found the LCA?",
      options: [
        "When p and q are not both on the same side of the current node",
        "When you reach a leaf",
        "Only when the current node equals p",
        "After you've visited both p and q",
      ],
      answer: 0,
      why: "Going any deeper would leave one of them behind. So the first node where they don't agree on a direction is the answer.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "implement-trie-prefix-tree",
    lc: 208,
    title: "Implement Trie (Prefix Tree)",
    world: "trees",
    difficulty: "Medium",
    pattern: "trie",
    emoji: "🌲",
    statement: "Implement a trie with insert(word), search(word) and startsWith(prefix). (In the playground, each line is one operation.)",
    story:
      "Think of a phone's autocomplete as a tree of letters. Typing “c-a” walks two steps down from the root, and every word below that spot starts with “ca”. A ★ on a node means a whole word ends right there.",
    insight: "Each node maps a letter to a child and has an end-of-word flag. Words sharing a prefix share the path. search needs the flag; startsWith doesn't.",
    complexity: { time: "O(L) per operation", space: "O(total letters)", why: "L is the word length; each letter is one step." },
    inputs: [
      {
        name: "ops",
        kind: "stringArray",
        minLen: 1,
        maxLen: 8,
        maxItemLen: 20,
        pattern: /^(insert|search|startsWith) [a-z]{1,8}$/,
        patternHint: 'Each item looks like "insert apple", "search app" or "startsWith ap".',
      },
    ],
    examples: [
      {
        input: { ops: ["insert apple", "search apple", "search app", "startsWith app", "insert app", "search app"] },
        output: [null, true, false, true, null, true],
      },
      {
        input: { ops: ["insert car", "insert cat", "startsWith ca", "search ca", "search cat"] },
        output: [null, null, true, false, true],
      },
    ],
    trace({ ops }, T) {
      const trie = makeTrie();
      const out = [];
      const results = () => text("results", formatValue(out));

      T.step("A trie spells words along paths from the root. Words sharing a prefix share the path. A ★ marks where a whole word ends.", [trie.draw(), results()]);

      ops.forEach((op) => {
        const [cmd, word] = op.split(" ");
        if (cmd === "insert") {
          const fresh = trie.missing(word);
          T.step(`insert("${word}")`, [trie.draw(trie.pathTones(word, "cmp")), results()], {
            ask: pickNumber(`How many new nodes will inserting "${word}" create?`, fresh, "Only the letters past the longest existing prefix need new nodes."),
          });
          const end = trie.insert(word);
          out.push(null);
          T.step(
            fresh
              ? `Follow the letters that already exist, create ${fresh} new node${fresh === 1 ? "" : "s"}, and put a ★ on the last letter.`
              : "Every letter already exists, so just put a ★ on the last one.",
            [trie.draw({ ...trie.pathTones(word, "good"), [end.id]: "found" }), results()]
          );
          return;
        }

        const { node, broken } = trie.walk(word);
        const result = broken !== null ? false : cmd === "search" ? node.end : true;
        T.step(`${cmd}("${word}"): walk the letters down from the root.`, [trie.draw(trie.pathTones(word, "cmp")), results()], {
          ask: yesNo(
            `Will ${cmd}("${word}") return true?`,
            result,
            cmd === "search" ? "search needs the whole path AND a ★ on the last letter." : "startsWith only needs the path to exist."
          ),
        });
        out.push(result);
        let say;
        if (broken !== null) say = `There's no '${word[broken]}' where we need one, so the path breaks. **false**.`;
        else if (cmd === "startsWith") say = "The whole path exists. **true**.";
        else say = node.end ? "The path exists and ends on a ★. **true**." : `The path exists, but "${word}" was never inserted as a whole word (no ★). **false**.`;
        T.step(say, [
          trie.draw({ ...trie.pathTones(word, result ? "good" : "cmp"), ...(broken === null ? { [node.id]: result ? "found" : "bad" } : {}) }),
          results(),
        ]);
      });

      T.step(`Results: **${formatValue(out)}**.`, [trie.draw(), results()]);
      return out;
    },
    java: `class Trie {
    private final Trie[] next = new Trie[26];
    private boolean end;                    // does a word finish at this node?

    public void insert(String word) {
        Trie node = this;
        for (char c : word.toCharArray()) {
            if (node.next[c - 'a'] == null) node.next[c - 'a'] = new Trie();
            node = node.next[c - 'a'];
        }
        node.end = true;
    }

    public boolean search(String word) {
        Trie node = walk(word);
        return node != null && node.end;    // the whole word, not just a prefix
    }

    public boolean startsWith(String prefix) {
        return walk(prefix) != null;
    }

    private Trie walk(String s) {
        Trie node = this;
        for (char c : s.toCharArray()) {
            node = node.next[c - 'a'];
            if (node == null) return null;
        }
        return node;
    }
}`,
    python: `class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word: str) -> None:
        node = self.root
        for c in word:
            node = node.setdefault(c, {})
        node["$"] = True            # marks the end of a whole word

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and "$" in node

    def startsWith(self, prefix: str) -> bool:
        return self._walk(prefix) is not None

    def _walk(self, s):
        node = self.root
        for c in s:
            if c not in node:
                return None
            node = node[c]
        return node`,
    quiz: {
      q: "What's the difference between search and startsWith?",
      options: [
        "search also requires an end-of-word mark on the last node",
        "startsWith walks faster",
        "search walks the tree from the leaves up",
        "They're the same operation",
      ],
      answer: 0,
      why: "After inserting \"apple\", the path for \"app\" exists — so startsWith(\"app\") is true but search(\"app\") is false.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "design-add-and-search-words-data-structure",
    lc: 211,
    title: "Design Add and Search Words Data Structure",
    world: "trees",
    difficulty: "Medium",
    pattern: "trie",
    emoji: "🃏",
    statement:
      "Support addWord(word) and search(word), where '.' in a search matches any one letter. (In the playground, each line is one operation.)",
    story:
      "A crossword solver's dictionary. When a clue says “b _ _”, you can't take a single path down the letter tree — at every blank, you try each branch in turn, backing out of dead ends until one route spells a real word.",
    insight: "Store words in a trie. Search recursively: a letter follows one child, while '.' tries every child. Succeed only at a word-end mark.",
    complexity: { time: "O(L) add, up to O(26^L) search", space: "O(total letters)", why: "Dots can force the search to branch at every position." },
    inputs: [
      {
        name: "ops",
        kind: "stringArray",
        minLen: 1,
        maxLen: 8,
        maxItemLen: 14,
        pattern: /^(add [a-z]{1,6}|search [a-z.]{1,6})$/,
        patternHint: 'Each item looks like "add bad" or "search .ad".',
      },
    ],
    examples: [
      {
        input: { ops: ["add bad", "add dad", "add mad", "search pad", "search bad", "search .ad", "search b.."] },
        output: [null, null, null, false, true, true, true],
      },
      { input: { ops: ["add at", "add and", "search a.", "search .t", "search a.d", "search ..."] }, output: [null, null, true, true, true, true] },
    ],
    trace({ ops }, T) {
      const trie = makeTrie();
      const out = [];
      const results = () => text("results", formatValue(out));

      T.step("Words live in a trie. A normal letter follows one branch; a '.' must try every branch.", [trie.draw(), results()]);

      ops.forEach((op) => {
        const [cmd, word] = op.split(" ");
        if (cmd === "add") {
          const end = trie.insert(word);
          out.push(null);
          T.step(`addWord("${word}") — an ordinary trie insert.`, [trie.draw({ ...trie.pathTones(word, "good"), [end.id]: "found" }), results()]);
          return;
        }

        const explored = {};
        const dfs = (n, i) => {
          if (i === word.length) return n.end;
          const ch = word[i];
          const kids =
            ch === "."
              ? [...n.children.keys()].sort().map((c) => n.children.get(c))
              : n.children.has(ch)
              ? [n.children.get(ch)]
              : [];
          for (const kid of kids) {
            explored[kid.id] = "bad";
            if (dfs(kid, i + 1)) {
              explored[kid.id] = "found";
              return true;
            }
          }
          return false;
        };
        const result = dfs(trie.root, 0);

        T.step(`search("${word}")` + (word.includes(".") ? " — every '.' may branch into every child." : "."), [trie.draw(), results()], {
          ask: yesNo(`Will search("${word}") find a match?`, result),
        });
        out.push(result);
        T.step(
          result
            ? "Found one. The winning path is gold; branches that dead-ended are red."
            : Object.keys(explored).length
            ? "Every branch dead-ended (red). **false**."
            : `Not even the first letter exists. **false**.`,
          [trie.draw(explored), results()]
        );
      });

      T.step(`Results: **${formatValue(out)}**.`, [trie.draw(), results()]);
      return out;
    },
    java: `class WordDictionary {
    private final WordDictionary[] next = new WordDictionary[26];
    private boolean end;

    public void addWord(String word) {
        WordDictionary node = this;
        for (char c : word.toCharArray()) {
            if (node.next[c - 'a'] == null) node.next[c - 'a'] = new WordDictionary();
            node = node.next[c - 'a'];
        }
        node.end = true;
    }

    public boolean search(String word) {
        return search(word, 0, this);
    }

    private boolean search(String word, int i, WordDictionary node) {
        if (i == word.length()) return node.end;
        char c = word.charAt(i);
        if (c != '.') {
            WordDictionary child = node.next[c - 'a'];
            return child != null && search(word, i + 1, child);
        }
        for (WordDictionary child : node.next) {          // '.' tries every branch
            if (child != null && search(word, i + 1, child)) return true;
        }
        return false;
    }
}`,
    python: `class WordDictionary:
    def __init__(self):
        self.root = {}

    def addWord(self, word: str) -> None:
        node = self.root
        for c in word:
            node = node.setdefault(c, {})
        node["$"] = True

    def search(self, word: str) -> bool:
        def dfs(node, i):
            if i == len(word):
                return "$" in node
            if word[i] == ".":
                return any(dfs(child, i + 1) for c, child in node.items() if c != "$")
            return word[i] in node and dfs(node[word[i]], i + 1)

        return dfs(self.root, 0)`,
    quiz: {
      q: "What makes '.' expensive?",
      options: [
        "It has to try every child at that position, so the search can branch",
        "It forces the trie to be rebuilt",
        "It only matches vowels",
        "It requires scanning every stored word in a list",
      ],
      answer: 0,
      why: "A plain letter is one step. A dot can fan out to 26 branches, and several dots multiply that.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "word-search-ii",
    lc: 212,
    title: "Word Search II",
    world: "trees",
    difficulty: "Hard",
    pattern: "trie",
    emoji: "🔍",
    statement: "Given a letter grid and a list of words, return every word that can be traced through adjacent cells without reusing a cell.",
    story:
      "It's a word-search puzzle with a whole list of words. Instead of hunting for each word separately, you carry one pocket dictionary shaped like a letter tree. As your finger slides across the grid, the dictionary tells you instantly whether any word could still continue that way.",
    insight: "Build a trie of the words, then DFS from every cell, moving through the trie in step. Abandon a path the moment the trie has no matching child.",
    complexity: { time: "O(cells · 4 · 3^(L−1))", space: "O(total letters)", why: "Each DFS branches to at most 3 unvisited neighbours; the trie prunes most paths early." },
    unordered: true,
    inputs: [
      { name: "board", kind: "charGrid", maxRows: 4, maxCols: 4, pattern: /^[a-z]$/, patternHint: "Use lowercase letters a–z." },
      { name: "words", kind: "stringArray", minLen: 1, maxLen: 5, maxItemLen: 6, pattern: /^[a-z]+$/, patternHint: "Words use lowercase letters only." },
    ],
    examples: [
      {
        input: {
          board: [
            ["o", "a", "a", "n"],
            ["e", "t", "a", "e"],
            ["i", "h", "k", "r"],
            ["i", "f", "l", "v"],
          ],
          words: ["oath", "pea", "eat", "rain"],
        },
        output: ["eat", "oath"],
      },
      { input: { board: [["a", "b"], ["c", "d"]], words: ["abcb"] }, output: [] },
    ],
    trace({ board, words }, T) {
      const trie = makeTrie();
      words.forEach((w) => {
        trie.insert(w).word = w;
      });
      const R = board.length;
      const C = board[0].length;
      const found = [];
      const foundIds = {};
      const path = [];
      const onPath = new Set();
      const pathTones = (tone, extra = {}) => ({ ...Object.fromEntries(path.map(([r, c]) => [r + "," + c, tone])), ...extra });
      const draw = (gridTones, trieTones = {}) => [
        grid("board", board, { tones: gridTones }),
        trie.draw({ ...foundIds, ...trieTones }),
        text("found", formatValue(found)),
      ];

      T.step("Load every word into a trie. Then search from each cell, walking the board and the trie together. When the trie has no matching child, the path dies instantly.", draw({}));

      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      function dfs(r, c, parent) {
        const node = parent.children.get(board[r][c]);
        if (!node) return;
        path.push([r, c]);
        onPath.add(r + "," + c);
        const prefix = path.map(([a, b]) => board[a][b]).join("");
        T.step(`Step onto '${board[r][c]}' at (${r}, ${c}). The trie still has the prefix "${prefix}".`, draw(pathTones("good", { [r + "," + c]: "active" }), trie.pathTones(prefix, "cmp")), {
          ask: yesNo(`Is "${prefix}" a complete word from the list?`, Boolean(node.word)),
        });
        if (node.word) {
          found.push(node.word);
          foundIds[node.id] = "found";
          T.step(`"${node.word}" is complete! Record it, and clear its mark so it can't be reported twice.`, draw(pathTones("found"), trie.pathTones(prefix, "found")));
          node.word = null;
        }
        dirs.forEach(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nc >= 0 && nr < R && nc < C && !onPath.has(nr + "," + nc)) dfs(nr, nc, node);
        });
        path.pop();
        onPath.delete(r + "," + c);
      }

      for (let r = 0; r < R; r += 1) {
        for (let c = 0; c < C; c += 1) dfs(r, c, trie.root);
      }

      T.step(found.length ? `Search complete. Found **${formatValue(found)}**.` : "Search complete. **No words found.**", draw({}));
      return found;
    },
    java: `public List<String> findWords(char[][] board, String[] words) {
    TrieNode root = new TrieNode();
    for (String w : words) {                                // 1. every word goes into a trie
        TrieNode node = root;
        for (char c : w.toCharArray()) {
            if (node.next[c - 'a'] == null) node.next[c - 'a'] = new TrieNode();
            node = node.next[c - 'a'];
        }
        node.word = w;
    }
    List<String> found = new ArrayList<>();
    for (int r = 0; r < board.length; r++)                  // 2. search from every cell
        for (int c = 0; c < board[0].length; c++)
            dfs(board, r, c, root, found);
    return found;
}

private void dfs(char[][] board, int r, int c, TrieNode node, List<String> found) {
    if (r < 0 || c < 0 || r >= board.length || c >= board[0].length) return;
    char ch = board[r][c];
    if (ch == '#' || node.next[ch - 'a'] == null) return;  // used cell, or no word continues this way
    node = node.next[ch - 'a'];
    if (node.word != null) {
        found.add(node.word);
        node.word = null;                                   // never report a word twice
    }
    board[r][c] = '#';                                      // mark as used
    dfs(board, r + 1, c, node, found);
    dfs(board, r - 1, c, node, found);
    dfs(board, r, c + 1, node, found);
    dfs(board, r, c - 1, node, found);
    board[r][c] = ch;                                       // backtrack
}

private static class TrieNode {
    TrieNode[] next = new TrieNode[26];
    String word;                                            // set where a word ends
}`,
    python: `def findWords(self, board: List[List[str]], words: List[str]) -> List[str]:
    root = {}
    for w in words:
        node = root
        for c in w:
            node = node.setdefault(c, {})
        node["$"] = w
    rows, cols, found = len(board), len(board[0]), []

    def dfs(r, c, parent):
        ch = board[r][c]
        node = parent.get(ch)
        if not node:
            return
        if "$" in node:
            found.append(node.pop("$"))   # pop: never report a word twice
        board[r][c] = "#"
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != "#":
                dfs(nr, nc, node)
        board[r][c] = ch

    for r in range(rows):
        for c in range(cols):
            dfs(r, c, root)
    return found`,
    quiz: {
      q: "Why build a trie instead of running Word Search once per word?",
      options: [
        "All words are searched in one pass, and a path dies as soon as no word shares its prefix",
        "A trie uses less memory than the board",
        "Word Search can't find more than one word",
        "The trie sorts the answers",
      ],
      answer: 0,
      why: "With many words sharing prefixes, one combined walk avoids repeating the same exploration for each word.",
    },
  },
];
