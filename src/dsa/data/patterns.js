/**
 * The Pattern Playbook. Interviews rarely test whether you've seen a problem;
 * they test whether you can recognise which tool it wants. Each pattern lists
 * the signals in a problem statement that point to it.
 */
export const PATTERNS = [
  {
    id: "hashing",
    name: "Hash Map & Set",
    emoji: "🗝️",
    tagline: "Trade memory for instant lookups.",
    signals: [
      "“Have I seen this before?” or “find the partner / complement”",
      "Counting frequencies, grouping by a shared key",
      "A brute force that searches the array again inside a loop",
    ],
    idea: "Store what you've already seen so the question you'd otherwise answer with a second loop becomes an O(1) lookup.",
    template: `Map<Integer, Integer> seen = new HashMap<>();
for (int i = 0; i < nums.length; i++) {
    int want = target - nums[i];     // what would complete the answer?
    if (seen.containsKey(want)) {
        // found it: seen.get(want) and i
    }
    seen.put(nums[i], i);            // remember what you've seen
}`,
    pitfalls: [
      "Inserting before checking lets an element pair with itself.",
      "Comparing boxed Integers with == works up to 127 and then silently breaks. Use equals().",
      "Mutable objects as keys: change them after inserting and the map can't find them.",
    ],
  },
  {
    id: "two-pointers",
    name: "Two Pointers",
    emoji: "👉👈",
    tagline: "Two indices that squeeze the search space.",
    signals: ["Sorted array (or you're allowed to sort) and a pair/triplet target", "Palindromes, reversing in place", "“Maximum area / width” between two ends"],
    idea: "Put pointers at both ends (or both at the start). Each comparison tells you which pointer can move without skipping the answer.",
    template: `Arrays.sort(nums);
int l = 0, r = nums.length - 1;
while (l < r) {
    int sum = nums[l] + nums[r];
    if (sum == target) {
        // record the pair, then move both
        l++;
        r--;
    } else if (sum < target) {
        l++;                         // need something bigger
    } else {
        r--;                         // need something smaller
    }
}`,
    pitfalls: ["Forgetting to skip duplicates produces repeated answers.", "Moving the wrong pointer (e.g. the taller wall) discards the answer.", "Sorting destroys original indices — copy them first if you need them."],
  },
  {
    id: "sliding-window",
    name: "Sliding Window",
    emoji: "🪟",
    tagline: "Grow the right edge, shrink the left edge.",
    signals: ["“Longest / shortest substring or subarray that…”", "A contiguous range with a condition (at most k, no repeats, contains all of…)", "A brute force over every start and end"],
    idea: "Keep a window [L, R] that satisfies the rule. Expand R to include more; when the rule breaks, advance L until it holds again. Both pointers only move forward.",
    template: `Map<Character, Integer> window = new HashMap<>();
int l = 0, best = 0;
for (int r = 0; r < s.length(); r++) {
    window.merge(s.charAt(r), 1, Integer::sum);     // grow on the right
    while (windowIsInvalid(window)) {
        window.merge(s.charAt(l), -1, Integer::sum);
        l++;                                        // shrink from the left
    }
    best = Math.max(best, r - l + 1);
}`,
    pitfalls: ["Updating the best answer before the window is valid again.", "Fixed-size windows need an if, not a while.", "Negative numbers break “shrink when the sum is too big” — use prefix sums instead."],
  },
  {
    id: "prefix-suffix",
    name: "Prefix & Suffix",
    emoji: "🧺",
    tagline: "Precompute running totals from both sides.",
    signals: ["“Everything except i” or “everything to the left/right of i”", "Many range-sum queries", "Division is forbidden"],
    idea: "A single pass builds a running product or sum. The answer for i combines the part before i with the part after i.",
    template: `int[] prefix = new int[n + 1];
for (int i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
}
// sum of nums[l..r] = prefix[r + 1] - prefix[l]`,
    pitfalls: ["Off-by-one: prefix arrays of length n + 1 avoid special-casing index 0.", "Integer overflow on large sums — use long.", "Zeros break “total product ÷ nums[i]”."],
  },
  {
    id: "greedy",
    name: "Greedy",
    emoji: "🎯",
    tagline: "Take the locally best choice — when you can prove it's safe.",
    signals: ["“Minimum number of…” / “maximum number of…” with a natural ordering", "Scheduling, intervals, reachability", "An exchange argument: swapping to the greedy choice never hurts"],
    idea: "Sort or scan in the right order so the best choice right now can never block a better overall answer.",
    template: `Arrays.sort(items, (a, b) -> Integer.compare(a[1], b[1])); // pick the ordering that makes greed safe
int count = 0, end = Integer.MIN_VALUE;
for (int[] item : items) {
    if (item[0] >= end) {
        count++;                     // take it
        end = item[1];
    }
}`,
    pitfalls: ["Greedy that “feels right” but has a counterexample (coin change with [1, 3, 4]).", "Sorting by the wrong key (start instead of end).", "Not being able to explain WHY it works — interviewers will ask."],
  },
  {
    id: "binary-search",
    name: "Binary Search",
    emoji: "🔍",
    tagline: "Halve the search space every step.",
    signals: ["Sorted or rotated-sorted input", "“Find the first / last position where…”", "An O(log n) requirement, or a monotonic yes/no condition on the answer"],
    idea: "Find a condition that is false, false, …, true, true. Look at the middle, and throw away the half that can't contain the boundary.",
    template: `int lo = 0, hi = nums.length - 1;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;    // never (lo + hi) / 2 — it can overflow
    if (condition(mid)) hi = mid;    // the answer is at mid or to its left
    else lo = mid + 1;               // the answer is to the right
}
return lo;                           // first index where condition is true`,
    pitfalls: ["Infinite loops from mid rounding the wrong way.", "Mixing up lo < hi and lo <= hi templates.", "(lo + hi) / 2 overflows for large indices."],
  },
  {
    id: "bit-manipulation",
    name: "Bit Manipulation",
    emoji: "💡",
    tagline: "Treat numbers as rows of switches.",
    signals: ["“Without using + / −” or “in O(1) extra space”", "Pairs that cancel, a single missing or unique number", "Counting 1 bits, powers of two"],
    idea: "A handful of identities do most of the work: XOR cancels pairs, AND with n − 1 clears the lowest set bit, and shifts move bits around.",
    template: `x & 1           // the lowest bit
x >> 1          // drop the lowest bit
x & (x - 1)     // clear the lowest set bit
x & -x          // isolate the lowest set bit
a ^ a           // 0 — pairs cancel
a ^ 0           // a`,
    pitfalls: ["Java >> keeps the sign bit; use >>> for unsigned shifts.", "Operator precedence: x & 1 == 0 means x & (1 == 0). Add parentheses.", "Python ints are unbounded — mask with 0xFFFFFFFF to simulate 32 bits."],
  },
  {
    id: "dp-1d",
    name: "1-D Dynamic Programming",
    emoji: "🧩",
    tagline: "Build each answer from smaller answers you already have.",
    signals: ["“How many ways…” or “minimum / maximum cost to reach…”", "Choices at each step that affect what comes next", "A recursive brute force that recomputes the same subproblems"],
    idea: "Define dp[i] in one plain sentence, write the recurrence from the last decision, set the base cases, and fill the table in an order where dependencies come first.",
    template: `int[] dp = new int[n + 1];
dp[0] = BASE;                                 // the smallest answer you know for sure
for (int i = 1; i <= n; i++) {
    dp[i] = combine(dp[i - 1], dp[i - 2]);    // built only from answers you already have
}
return dp[n];`,
    pitfalls: ["An unclear definition of dp[i] — write it as a sentence first.", "Wrong base cases (ways(0) = 1, not 0).", "Keeping the whole table when two variables would do."],
  },
  {
    id: "dp-2d",
    name: "2-D Dynamic Programming",
    emoji: "🧮",
    tagline: "A table indexed by two things at once.",
    signals: ["Two strings or sequences being compared", "Grid paths with right/down moves", "dp[i][j] naturally means “the first i of this and the first j of that”"],
    idea: "Each cell depends on its neighbours above, left and diagonal. Fill row by row, then read the answer from a corner.",
    template: `int[][] dp = new int[m + 1][n + 1];          // row 0 and column 0: empty-prefix base cases
for (int i = 1; i <= m; i++)
    for (int j = 1; j <= n; j++)
        dp[i][j] = a[i - 1] == b[j - 1]
            ? dp[i - 1][j - 1] + 1
            : Math.max(dp[i - 1][j], dp[i][j - 1]);
return dp[m][n];`,
    pitfalls: ["Off-by-one between string index i − 1 and table index i.", "Filling in an order where a dependency isn't ready yet.", "O(m·n) memory when one rolling row is enough."],
  },
  {
    id: "stack",
    name: "Stack",
    emoji: "🥞",
    tagline: "The most recent thing is the first thing to resolve.",
    signals: ["Matching brackets or nested structure", "“Next greater / smaller element”", "Undo, backtracking a path, evaluating expressions"],
    idea: "Push things that are waiting for an answer. When a new item resolves them, pop — most recent first.",
    template: `Deque<Integer> stack = new ArrayDeque<>();
for (int i = 0; i < n; i++) {
    while (!stack.isEmpty() && resolves(i, stack.peek())) {
        int waiting = stack.pop();    // i is the answer for 'waiting'
    }
    stack.push(i);
}`,
    pitfalls: ["Popping from an empty stack.", "Using java.util.Stack (synchronised, legacy) instead of ArrayDeque.", "Forgetting leftovers in the stack at the end."],
  },
  {
    id: "graph-traversal",
    name: "BFS / DFS on Graphs & Grids",
    emoji: "🕸️",
    tagline: "Visit everything reachable, exactly once.",
    signals: ["Islands, regions, connected cells", "“Can water / fire / a signal reach…”", "Shortest path in an unweighted graph (BFS)"],
    idea: "Start somewhere, mark it seen, and explore its neighbours with a queue (BFS, by distance) or recursion/stack (DFS, by depth).",
    template: `Deque<int[]> queue = new ArrayDeque<>();
boolean[][] seen = new boolean[rows][cols];
queue.offer(new int[]{sr, sc});
seen[sr][sc] = true;
while (!queue.isEmpty()) {
    int[] cell = queue.poll();
    for (int[] d : new int[][]{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}) {
        int r = cell[0] + d[0], c = cell[1] + d[1];
        if (r >= 0 && c >= 0 && r < rows && c < cols && !seen[r][c] && canEnter(r, c)) {
            seen[r][c] = true;       // mark when you ENQUEUE, not when you dequeue
            queue.offer(new int[]{r, c});
        }
    }
}`,
    pitfalls: ["Marking visited on dequeue lets a cell be queued many times.", "Deep recursion on big grids overflows the stack — prefer BFS.", "Forgetting disconnected parts: loop over every start."],
  },
  {
    id: "topo-sort",
    name: "Topological Sort",
    emoji: "🎓",
    tagline: "Order tasks so every prerequisite comes first.",
    signals: ["Prerequisites, dependencies, build order", "“Is there a valid order?” (cycle detection in a directed graph)", "Deriving an order from pairwise rules"],
    idea: "Kahn's algorithm: start with nodes that have no incoming edges. Taking one removes its outgoing edges; nodes whose in-degree hits zero become available.",
    template: `int[] indegree = new int[n];
for (int[] e : edges) {
    graph.get(e[0]).add(e[1]);
    indegree[e[1]]++;
}
Queue<Integer> ready = new ArrayDeque<>();
for (int i = 0; i < n; i++) if (indegree[i] == 0) ready.offer(i);
List<Integer> order = new ArrayList<>();
while (!ready.isEmpty()) {
    int u = ready.poll();
    order.add(u);
    for (int v : graph.get(u)) if (--indegree[v] == 0) ready.offer(v);
}
// order.size() < n  means there is a cycle`,
    pitfalls: ["Getting the edge direction backwards ([a, b] means b before a).", "Counting duplicate edges twice in the in-degree.", "Forgetting nodes that appear in no edges at all."],
  },
  {
    id: "union-find",
    name: "Union-Find",
    emoji: "🫂",
    tagline: "Merge groups and ask “same group?” almost instantly.",
    signals: ["Connected components, merging sets", "“Does adding this edge create a cycle?”", "Grouping with dynamic, incremental connections"],
    idea: "Every element points to a parent; the root names its group. union merges two roots, and find walks up with path compression to keep trees flat.",
    template: `int[] parent = new int[n];
for (int i = 0; i < n; i++) parent[i] = i;

int find(int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];   // path halving
        x = parent[x];
    }
    return x;
}

boolean union(int a, int b) {
    int ra = find(a), rb = find(b);
    if (ra == rb) return false;          // already connected
    parent[ra] = rb;
    return true;
}`,
    pitfalls: ["Linking a to b instead of root(a) to root(b).", "Skipping path compression and getting O(n) finds.", "Using it for directed graphs — it only understands undirected connectivity."],
  },
  {
    id: "intervals",
    name: "Intervals",
    emoji: "📅",
    tagline: "Sort by an endpoint, then sweep.",
    signals: ["Meetings, bookings, time ranges", "“Merge / insert / overlap”", "Pairs of [start, end]"],
    idea: "After sorting by start, overlaps can only happen between neighbours. Walk once, comparing each interval with the last one you kept.",
    template: `Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
List<int[]> out = new ArrayList<>();
for (int[] cur : intervals) {
    int[] last = out.isEmpty() ? null : out.get(out.size() - 1);
    if (last != null && cur[0] <= last[1]) {
        last[1] = Math.max(last[1], cur[1]);    // overlap: stretch
    } else {
        out.add(cur);                            // gap: start a new one
    }
}`,
    pitfalls: ["Touching endpoints: decide whether [1, 2] and [2, 3] overlap.", "Comparator (a, b) -> a[0] - b[0] can overflow; use Integer.compare.", "Sorting by start when the greedy needs end."],
  },
  {
    id: "fast-slow",
    name: "Fast & Slow Pointers",
    emoji: "🐢🐇",
    tagline: "Two runners at different speeds reveal the shape of a list.",
    signals: ["Linked list cycle detection", "Find the middle of a list in one pass", "“n-th from the end” in one pass"],
    idea: "Move one pointer twice as fast (or n steps ahead). Their meeting point or gap answers the question without extra memory.",
    template: `ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow == fast) {
        // there's a cycle
    }
}
// no cycle: slow is now at the middle`,
    pitfalls: ["Checking fast.next.next without checking fast.next first.", "Even-length lists: decide which of the two middles you need.", "Using equals() instead of == for node identity."],
  },
  {
    id: "list-rewire",
    name: "In-place List Rewiring",
    emoji: "🔗",
    tagline: "Save, rewire, advance — never drop the chain.",
    signals: ["Reverse, merge, reorder, or splice linked lists", "“Do it in place / O(1) extra space”", "Special cases around the head node"],
    idea: "Before changing a next pointer, save what it pointed to. A dummy head removes almost every edge case.",
    template: `ListNode dummy = new ListNode(0, head);   // a dummy removes head special cases
ListNode prev = null, curr = head;
while (curr != null) {
    ListNode next = curr.next;           // 1. save
    curr.next = prev;                    // 2. rewire
    prev = curr;                         // 3. advance
    curr = next;
}`,
    pitfalls: ["Overwriting next before saving it.", "Forgetting to null-terminate the new tail (creating a cycle).", "Returning head when the new head is dummy.next or prev."],
  },
  {
    id: "heap",
    name: "Heap / Priority Queue",
    emoji: "⛰️",
    tagline: "Always know the smallest (or largest) thing, fast.",
    signals: ["“Top k”, “k-th largest / smallest”", "Merging k sorted streams", "A running median, or scheduling by earliest end"],
    idea: "A heap gives O(1) peek and O(log n) push/pop of the extreme element. Keep only as many items as the question needs.",
    template: `PriorityQueue<Integer> heap = new PriorityQueue<>();  // min-heap holding the k largest
for (int x : nums) {
    heap.offer(x);
    if (heap.size() > k) heap.poll();                  // evict the smallest
}
return heap.peek();                                    // the k-th largest`,
    pitfalls: ["(a, b) -> a - b overflows for extreme values; use Integer.compare.", "Java's PriorityQueue is a min-heap; pass Collections.reverseOrder() for max.", "Iterating a PriorityQueue does NOT give sorted order."],
  },
  {
    id: "matrix",
    name: "Matrix Traversal",
    emoji: "🧊",
    tagline: "Boundaries, directions and in-place tricks for 2-D grids.",
    signals: ["Spiral, diagonal or layer-by-layer order", "Rotate or transform a grid in place", "“O(1) extra space” on a matrix"],
    idea: "Track explicit boundaries (top, bottom, left, right) or direction vectors, and look for identities like rotate = transpose + reverse.",
    template: `int top = 0, bottom = m - 1, left = 0, right = n - 1;
while (top <= bottom && left <= right) {
    for (int j = left; j <= right; j++) visit(top, j);
    top++;
    for (int i = top; i <= bottom; i++) visit(i, right);
    right--;
    if (top <= bottom) { for (int j = right; j >= left; j--) visit(bottom, j); bottom--; }
    if (left <= right) { for (int i = bottom; i >= top; i--) visit(i, left); left++; }
}`,
    pitfalls: ["Reading a row or column twice when boundaries cross.", "Overwriting values you still need (use markers or a second pass).", "Mixing up (row, col) with (x, y)."],
  },
  {
    id: "backtracking",
    name: "Backtracking",
    emoji: "🧗",
    tagline: "Choose, explore, un-choose.",
    signals: ["“All combinations / permutations / subsets”", "Paths through a grid that can't reuse cells", "Constraint puzzles (Sudoku, N-Queens)"],
    idea: "Build a candidate step by step. If a partial candidate can't lead anywhere, abandon it and undo the last choice.",
    template: `void backtrack(List<Integer> path, int start) {
    if (isComplete(path)) {
        results.add(new ArrayList<>(path));   // copy — path keeps changing
        return;
    }
    for (int i = start; i < choices.length; i++) {
        if (!isValid(choices[i])) continue;
        path.add(choices[i]);                 // choose
        backtrack(path, i + 1);               // explore
        path.remove(path.size() - 1);         // un-choose
    }
}`,
    pitfalls: ["Adding path itself instead of a copy.", "Forgetting to undo the choice (or the visited mark).", "No pruning — exploring branches that can't possibly succeed."],
  },
  {
    id: "tree-dfs",
    name: "Tree DFS (Recursion)",
    emoji: "🌳",
    tagline: "Trust the recursion for each subtree.",
    signals: ["Anything about height, depth, paths or subtrees", "Comparing or transforming two trees", "An answer at a node that depends on its children's answers"],
    idea: "Decide what a function should return for one subtree, handle null, then combine the left and right results at the current node.",
    template: `int solve(TreeNode node) {
    if (node == null) return BASE;          // the empty tree's answer
    int left = solve(node.left);            // trust the recursion
    int right = solve(node.right);
    return combine(node.val, left, right);  // this node's answer from its children's
}`,
    pitfalls: ["Returning one thing but needing two (use a field or return a pair).", "Deep skewed trees overflowing the call stack.", "Forgetting the null base case."],
  },
  {
    id: "tree-bfs",
    name: "Tree BFS (Level Order)",
    emoji: "🎢",
    tagline: "Process a tree one level at a time.",
    signals: ["“Level by level”, “right side view”, “zigzag”", "Minimum depth or nearest leaf", "Connecting nodes on the same level"],
    idea: "Use a queue. Snapshot its size before each level — exactly that many nodes belong to the current level.",
    template: `if (root == null) return;
Queue<TreeNode> queue = new ArrayDeque<>();
queue.offer(root);
while (!queue.isEmpty()) {
    int size = queue.size();                // nodes on the current level
    for (int i = 0; i < size; i++) {
        TreeNode node = queue.poll();
        if (node.left != null) queue.offer(node.left);
        if (node.right != null) queue.offer(node.right);
    }
}`,
    pitfalls: ["Reading queue.size() inside the loop condition as it changes.", "Queuing null children.", "Using a list's remove(0) (O(n)) instead of a real queue."],
  },
  {
    id: "bst",
    name: "Binary Search Tree",
    emoji: "🚦",
    tagline: "Left is smaller, right is bigger — use it.",
    signals: ["The input is explicitly a BST", "k-th smallest, successor, range queries", "Validating ordering constraints"],
    idea: "Every comparison tells you which subtree to ignore, and an inorder traversal visits values in sorted order.",
    template: `TreeNode node = root;
while (node != null) {
    if (target < node.val) node = node.left;        // smaller values live on the left
    else if (target > node.val) node = node.right;
    else return node;
}
// inorder (left, node, right) visits a BST in sorted order`,
    pitfalls: ["Only checking a node against its direct children when validating.", "Integer.MIN_VALUE / MAX_VALUE as bounds when node values can equal them.", "Assuming the BST is balanced — worst case is O(n) height."],
  },
  {
    id: "trie",
    name: "Trie (Prefix Tree)",
    emoji: "🌲",
    tagline: "Share prefixes, search letter by letter.",
    signals: ["Autocomplete, “starts with”", "Many words searched at once (word search in a grid)", "Wildcards in word lookups"],
    idea: "Each node maps a character to a child and flags where words end. Words with a common prefix share the path.",
    template: `class TrieNode {
    TrieNode[] next = new TrieNode[26];
    boolean end;
}

void insert(TrieNode root, String word) {
    TrieNode node = root;
    for (char c : word.toCharArray()) {
        if (node.next[c - 'a'] == null) node.next[c - 'a'] = new TrieNode();
        node = node.next[c - 'a'];
    }
    node.end = true;
}`,
    pitfalls: ["Treating “the path exists” as “the word exists” (check the end flag).", "Using a 26-slot array when the alphabet is wider.", "Not removing found words in multi-word searches, so duplicates appear."],
  },
  {
    id: "design",
    name: "Design & Encoding",
    emoji: "📦",
    tagline: "Make formats unambiguous and interfaces clean.",
    signals: ["“Design a class that supports…”", "Serialize / deserialize, encode / decode", "Arbitrary characters that could collide with a delimiter"],
    idea: "Pick a representation that can't be misread — length prefixes, escape sequences, explicit null markers — and keep invariants inside the class.",
    template: `String encode(List<String> parts) {
    StringBuilder sb = new StringBuilder();
    for (String p : parts) {
        sb.append(p.length()).append('#').append(p);   // length-prefix every piece
    }
    return sb.toString();
}`,
    pitfalls: ["Delimiters that can appear in the data.", "Forgetting empty strings and nulls.", "Leaking internal state through getters in design questions."],
  },
];

export function getPattern(id) {
  return PATTERNS.find((p) => p.id === id);
}
