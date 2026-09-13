import { arr, kv, heapTree, Heap, yesNo, choose, pickNumber, paint } from "../../engine/scene";
import { formatValue } from "../../engine/trace";

export const heapProblems = [
  /* ------------------------------------------------------------------ */
  {
    slug: "merge-k-sorted-lists",
    lc: 23,
    title: "Merge k Sorted Lists",
    world: "heaps",
    difficulty: "Hard",
    pattern: "heap",
    emoji: "🏁",
    statement: "Merge k sorted linked lists into one sorted list and return it.",
    story:
      "k races are finishing at once, each with runners already in finishing order. A referee keeps only the front runner of each race on a podium that always shows the fastest person on top. Crown the top one, and their teammate steps up to replace them.",
    insight: "Push every list's head into a min-heap. Pop the smallest, append it, and push that node's successor. The heap never holds more than k nodes.",
    complexity: { time: "O(N log k)", space: "O(k)", why: "N total nodes, each costing one heap push and one pop on a heap of size ≤ k." },
    inputs: [{ name: "lists", kind: "intLists", minLen: 0, maxLen: 4, maxItemLen: 4, min: -20, max: 20 }],
    validate: ({ lists }) =>
      lists.every((l) => l.every((v, i) => i === 0 || l[i - 1] <= v)) ? undefined : "Every list must be sorted in ascending order.",
    examples: [
      { input: { lists: [[1, 4, 5], [1, 3, 4], [2, 6]] }, output: [1, 1, 2, 3, 4, 4, 5, 6] },
      { input: { lists: [] }, output: [] },
      { input: { lists: [[]] }, output: [] },
    ],
    trace({ lists }, T) {
      const heap = new Heap((x, y) => x.val - y.val || x.li - y.li);
      const taken = lists.map(() => 0);
      const out = [];
      const draw = (focus, heapTones = {}) => [
        ...lists.map((values, li) =>
          arr(`list ${li}`, values, {
            pointers: taken[li] < values.length ? { front: taken[li] } : {},
            tones: { ...paint(0, taken[li] - 1, "dim"), ...(focus && focus.li === li ? { [focus.i]: "active" } : {}) },
          })
        ),
        heapTree("min-heap (value · list)", heap.data, { format: (x) => `${x.val}·L${x.li}`, tones: heapTones, empty: "empty" }),
        arr("merged", out),
      ];

      T.step("Only the front runner of each list competes. A min-heap always keeps the smallest front runner on top.", draw());
      lists.forEach((values, li) => {
        if (values.length) heap.push({ val: values[0], li, i: 0 });
      });
      T.step(
        heap.size ? `Every non-empty list sends its front runner: the heap holds ${heap.size}.` : "Every list is empty, so there's nothing to merge.",
        draw()
      );

      while (heap.size) {
        const top = heap.peek();
        const hasMore = top.i + 1 < lists[top.li].length;
        T.step(`The heap's top is **${top.val}**, from list ${top.li}.`, draw(top, { 0: "active" }), {
          ask: yesNo(`Does list ${top.li} have another runner to send up?`, hasMore),
        });
        heap.pop();
        out.push(top.val);
        taken[top.li] += 1;
        if (hasMore) heap.push({ val: lists[top.li][top.i + 1], li: top.li, i: top.i + 1 });
        T.step(
          `${top.val} goes into the merged list.` +
            (hasMore ? ` List ${top.li}'s next runner, ${lists[top.li][top.i + 1]}, joins the heap.` : ` List ${top.li} is used up.`),
          [...draw().slice(0, -1), arr("merged", out, { tones: { [out.length - 1]: "good" } })]
        );
      }

      T.step(`Merged: **${formatValue(out)}**.`, [...draw().slice(0, -1), arr("merged", out, { tones: paint(0, out.length - 1, "found") })]);
      return out;
    },
    java: `public ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> heap = new PriorityQueue<>((a, b) -> Integer.compare(a.val, b.val));
    for (ListNode head : lists) if (head != null) heap.offer(head); // every list's front runner
    ListNode dummy = new ListNode(0), tail = dummy;
    while (!heap.isEmpty()) {
        ListNode smallest = heap.poll();
        tail.next = smallest;
        tail = smallest;
        if (smallest.next != null) heap.offer(smallest.next);        // its teammate steps up
    }
    return dummy.next;
}`,
    python: `def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:
    # the list index breaks ties so two ListNodes are never compared directly
    heap = [(head.val, i, head) for i, head in enumerate(lists) if head]
    heapq.heapify(heap)
    dummy = tail = ListNode()
    while heap:
        _, i, node = heapq.heappop(heap)
        tail.next = tail = node
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    return dummy.next`,
    levelUp: "Divide and conquer — merge lists in pairs, like merge sort — also runs in O(N log k) and needs no heap at all.",
    quiz: {
      q: "Why use a heap instead of scanning all k fronts each time?",
      options: [
        "The heap finds the smallest front in O(log k) instead of O(k)",
        "Heaps sort the lists in place",
        "It uses less memory than the lists themselves",
        "Scanning the fronts gives the wrong order",
      ],
      answer: 0,
      why: "Scanning is O(N·k) overall. The heap cuts each pick to O(log k), which matters a lot when k is large.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "top-k-frequent-elements",
    lc: 347,
    title: "Top K Frequent Elements",
    world: "heaps",
    difficulty: "Medium",
    pattern: "heap",
    emoji: "🏆",
    statement: "Return the k most frequent elements of an array, in any order.",
    story:
      "It's a talent-show vote count. First, tally everyone's votes. Then, instead of sorting all the contestants, drop each one into a bucket labelled with their vote count. Read the buckets from most votes down until you have k winners.",
    insight: "Count frequencies, then bucket-sort by frequency (bucket index = count). Walk the buckets from high to low, collecting k values.",
    complexity: { time: "O(n)", space: "O(n)", why: "A frequency can't exceed n, so there are only n + 1 buckets." },
    unordered: true,
    inputs: [
      { name: "nums", kind: "intArray", minLen: 1, maxLen: 12, min: -9, max: 9 },
      { name: "k", kind: "int", min: 1, max: 12 },
    ],
    validate: ({ nums, k }) => {
      const distinct = new Set(nums).size;
      return k <= distinct ? undefined : `k can be at most ${distinct} — that's how many different numbers there are.`;
    },
    examples: [
      { input: { nums: [1, 1, 1, 2, 2, 3], k: 2 }, output: [1, 2] },
      { input: { nums: [1], k: 1 }, output: [1] },
      { input: { nums: [4, 4, 5, 5, 5, 6], k: 2 }, output: [5, 4] },
    ],
    trace({ nums, k }, T) {
      const count = new Map();
      T.step("Step 1 — tally how often each number appears.", [arr("nums", nums), kv("votes", count)]);
      nums.forEach((x, i) => {
        count.set(x, (count.get(x) || 0) + 1);
        T.step(`${x} gets a vote (${count.get(x)} so far).`, [
          arr("nums", nums, { pointers: { i }, tones: { ...paint(0, i - 1, "visited"), [i]: "active" } }),
          kv("votes", count, { hot: x }),
        ]);
      });

      const buckets = Array.from({ length: nums.length + 1 }, () => []);
      const bucketView = (extra) =>
        arr("buckets (index = votes)", buckets.map((b) => (b.length ? b.join(",") : "·")), extra);
      const maxFreq = Math.max(...count.values());
      T.step(
        "Step 2 — bucket sort. Bucket f holds every number that got exactly f votes. Nobody can get more than n votes, so n + 1 buckets is enough.",
        [kv("votes", count), bucketView()]
      );
      for (const [x, c] of count) {
        buckets[c].push(x);
        T.step(`${x} has ${c} vote${c === 1 ? "" : "s"} → bucket ${c}.`, [kv("votes", count, { hot: x }), bucketView({ tones: { [c]: "good" } })]);
      }

      const out = [];
      T.step(`Step 3 — walk the buckets from the most votes down until we have k = ${k} winners.`, [bucketView()], {
        ask: pickNumber("What's the highest vote count, where the walk starts paying off?", maxFreq),
      });
      for (let f = nums.length; f >= 0 && out.length < k; f -= 1) {
        if (!buckets[f].length) continue;
        buckets[f].forEach((x) => {
          if (out.length < k) out.push(x);
        });
        T.step(`Bucket ${f} holds ${formatValue(buckets[f])}. Winners so far: ${formatValue(out)}.`, [
          bucketView({ pointers: { f }, tones: { ...paint(f + 1, nums.length, "dim"), [f]: "active" } }),
          arr("top k", out, { tones: paint(0, out.length - 1, "good") }),
        ]);
      }

      T.step(`The ${k} most frequent: **${formatValue(out)}**.`, [bucketView(), arr("top k", out, { tones: paint(0, out.length - 1, "found") })]);
      return out;
    },
    java: `@SuppressWarnings("unchecked")
public int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> count = new HashMap<>();
    for (int x : nums) count.merge(x, 1, Integer::sum);
    List<Integer>[] buckets = new List[nums.length + 1];    // index = frequency
    for (Map.Entry<Integer, Integer> e : count.entrySet()) {
        int f = e.getValue();
        if (buckets[f] == null) buckets[f] = new ArrayList<>();
        buckets[f].add(e.getKey());
    }
    int[] out = new int[k];
    int n = 0;
    for (int f = nums.length; f > 0 && n < k; f--) {        // most votes first
        if (buckets[f] == null) continue;
        for (int x : buckets[f]) if (n < k) out[n++] = x;
    }
    return out;
}`,
    python: `def topKFrequent(self, nums: List[int], k: int) -> List[int]:
    count = collections.Counter(nums)
    buckets = [[] for _ in range(len(nums) + 1)]  # index = frequency
    for x, f in count.items():
        buckets[f].append(x)
    out = []
    for f in range(len(nums), 0, -1):
        for x in buckets[f]:
            out.append(x)
            if len(out) == k:
                return out
    return out`,
    levelUp: "A min-heap of size k is the other classic answer, at O(n log k). Reach for it when the numbers arrive as a stream.",
    quiz: {
      q: "Why is bucket sort possible here?",
      options: [
        "A frequency is a whole number between 1 and n, so it can be used as an array index",
        "The numbers are already sorted",
        "k is always small",
        "Hash maps keep keys in order",
      ],
      answer: 0,
      why: "Bucket sort needs a small, bounded integer key. Frequencies are exactly that, which skips the O(n log n) sort.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "find-median-from-data-stream",
    lc: 295,
    title: "Find Median from Data Stream",
    world: "heaps",
    difficulty: "Hard",
    pattern: "heap",
    emoji: "⚖️",
    statement:
      "Design a structure with addNum(num) and findMedian(). (In the playground, a stream of numbers is added one by one and the median is recorded after each.)",
    story:
      "Picture a seesaw. The left seat is a pile of the smaller numbers with its biggest on top; the right seat is a pile of the bigger numbers with its smallest on top. Keep the seesaw balanced, and the median is always sitting right at the middle, on the two tops.",
    insight: "A max-heap holds the smaller half and a min-heap holds the larger half, with sizes differing by at most one. The median comes from the tops.",
    complexity: { time: "O(log n) add, O(1) median", space: "O(n)", why: "Each add does a constant number of heap operations." },
    inputs: [{ name: "stream", kind: "intArray", minLen: 1, maxLen: 8, min: -50, max: 50 }],
    examples: [
      { input: { stream: [1, 2, 3] }, output: [1, 1.5, 2] },
      { input: { stream: [5, 15, 1, 3] }, output: [5, 10, 5, 4] },
      { input: { stream: [2, -1, 4, 4] }, output: [2, 0.5, 2, 3] },
    ],
    trace({ stream }, T) {
      const small = new Heap((a, b) => b - a);
      const large = new Heap((a, b) => a - b);
      const medians = [];
      const draw = (tS = {}, tL = {}) => [
        heapTree("small half (max-heap)", small.data, { tones: tS, empty: "empty" }),
        heapTree("large half (min-heap)", large.data, { tones: tL, empty: "empty" }),
        arr("medians so far", medians),
      ];

      T.step("Two piles: a max-heap for the smaller half and a min-heap for the larger half. The median always sits on their tops.", draw());

      stream.forEach((x) => {
        const goesSmall = small.size === 0 || x <= small.peek();
        T.step(
          `**${x}** arrives.` + (small.size ? ` The top of the small half is ${small.peek()}.` : " Both piles are empty."),
          draw({ 0: "cmp" }),
          {
            ask: choose(
              `Which pile does ${x} join first?`,
              ["Small half", "Large half"],
              goesSmall ? 0 : 1,
              "If it's no bigger than the small half's top, it belongs with the smaller numbers."
            ),
          }
        );
        if (goesSmall) small.push(x);
        else large.push(x);

        let moved = null;
        if (small.size > large.size + 1) {
          moved = small.pop();
          large.push(moved);
        } else if (large.size > small.size) {
          moved = large.pop();
          small.push(moved);
        }

        const median = small.size > large.size ? small.peek() : (small.peek() + large.peek()) / 2;
        medians.push(median);
        const even = small.size === large.size;
        T.step(
          `${x} joins the ${goesSmall ? "small" : "large"} half.` +
            (moved !== null ? ` That tipped the seesaw, so ${moved} moves across to rebalance.` : "") +
            ` Median = ${even ? `(${small.peek()} + ${large.peek()}) / 2` : `top of the small half`} = **${formatValue(median)}**.`,
          [
            heapTree("small half (max-heap)", small.data, { tones: { 0: "found" } }),
            heapTree("large half (min-heap)", large.data, { tones: even ? { 0: "found" } : {}, empty: "empty" }),
            arr("medians so far", medians, { tones: { [medians.length - 1]: "good" } }),
          ]
        );
      });

      T.step(`Every median came straight off the tops: ${formatValue(medians)}.`, draw());
      return medians;
    },
    java: `class MedianFinder {
    private final PriorityQueue<Integer> small = new PriorityQueue<>(Collections.reverseOrder()); // max-heap
    private final PriorityQueue<Integer> large = new PriorityQueue<>();                           // min-heap

    public void addNum(int num) {
        if (small.isEmpty() || num <= small.peek()) small.offer(num);
        else large.offer(num);
        if (small.size() > large.size() + 1) large.offer(small.poll());   // rebalance the seesaw
        else if (large.size() > small.size()) small.offer(large.poll());
    }

    public double findMedian() {
        return small.size() > large.size() ? small.peek() : (small.peek() + large.peek()) / 2.0;
    }
}`,
    python: `class MedianFinder:
    def __init__(self):
        self.small = []  # max-heap, stored as negated values
        self.large = []  # min-heap

    def addNum(self, num: int) -> None:
        if not self.small or num <= -self.small[0]:
            heapq.heappush(self.small, -num)
        else:
            heapq.heappush(self.large, num)
        if len(self.small) > len(self.large) + 1:
            heapq.heappush(self.large, -heapq.heappop(self.small))
        elif len(self.large) > len(self.small):
            heapq.heappush(self.small, -heapq.heappop(self.large))

    def findMedian(self) -> float:
        if len(self.small) > len(self.large):
            return -self.small[0]
        return (-self.small[0] + self.large[0]) / 2`,
    quiz: {
      q: "Why does the median only need the tops of the two heaps?",
      options: [
        "The heaps hold the smaller and larger halves, so the middle values are exactly their tops",
        "Heaps are fully sorted arrays",
        "The median is always the newest number",
        "Both heaps hold the same numbers",
      ],
      answer: 0,
      why: "Everything in the small half is ≤ everything in the large half. The largest small and the smallest large are the middle.",
    },
  },
];
