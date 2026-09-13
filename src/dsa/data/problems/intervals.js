import { spans, heapTree, Heap, yesNo, choose } from "../../engine/scene";
import { formatValue } from "../../engine/trace";

const iv = ([a, b]) => `[${a}, ${b}]`;

function bounds(pairs) {
  const all = pairs.flat();
  return all.length ? { min: Math.min(...all), max: Math.max(...all) } : { min: 0, max: 10 };
}

function allOrdered(intervals, strict) {
  return intervals.every(([a, b]) => (strict ? a < b : a <= b));
}

/** Sorts by a key while remembering each interval's original slot. */
function tagged(intervals, key) {
  return intervals.map(([s, e], i) => ({ id: "m" + i, s, e })).sort((x, y) => x[key] - y[key]);
}

export const intervalProblems = [
  /* ------------------------------------------------------------------ */
  {
    slug: "insert-interval",
    lc: 57,
    title: "Insert Interval",
    world: "intervals",
    difficulty: "Medium",
    pattern: "intervals",
    emoji: "📌",
    statement:
      "Given sorted, non-overlapping intervals and a new interval, insert it so the list stays sorted and non-overlapping, merging where needed.",
    story:
      "You're sliding a new booking into a tidy calendar. Everything that ends before it stays put. Everything it touches gets swallowed, and the booking stretches to cover them. Everything that starts after it just shuffles along.",
    insight: "One pass in three phases: copy intervals that end before it, merge the ones that overlap, copy the ones that start after.",
    complexity: { time: "O(n)", space: "O(n)", why: "Each interval is looked at once; the output holds up to n + 1 intervals." },
    inputs: [
      { name: "intervals", kind: "pairs", minLen: 0, maxLen: 6, min: 0, max: 30 },
      { name: "newInterval", kind: "intArray", minLen: 2, maxLen: 2, min: 0, max: 30 },
    ],
    validate: ({ intervals, newInterval }) => {
      if (!allOrdered(intervals) || newInterval[0] > newInterval[1]) return "Every interval needs start ≤ end.";
      for (let i = 1; i < intervals.length; i += 1) {
        if (intervals[i][0] <= intervals[i - 1][1]) return "The existing intervals must be sorted and must not overlap.";
      }
      return undefined;
    },
    examples: [
      { input: { intervals: [[1, 3], [6, 9]], newInterval: [2, 5] }, output: [[1, 5], [6, 9]] },
      {
        input: { intervals: [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], newInterval: [4, 8] },
        output: [[1, 2], [3, 10], [12, 16]],
      },
      { input: { intervals: [], newInterval: [5, 7] }, output: [[5, 7]] },
    ],
    trace({ intervals, newInterval }, T) {
      const { min, max } = bounds([...intervals, newInterval]);
      const out = [];
      let [s, e] = newInterval;
      let placed = false;
      const status = {};

      const draw = (focus) =>
        spans(
          "calendar",
          [
            ...intervals.map(([a, b], i) => ({ id: "in" + i, s: a, e: b, row: 0, tone: i === focus ? "cmp" : status[i] })),
            { id: "new", s, e, row: 1, tone: placed ? "dim" : "active", tag: "new" },
            ...out.map(([a, b], i) => ({ id: "out" + i, s: a, e: b, row: 2, tone: "found" })),
          ],
          { min, max, rows: ["intervals", "new", "result"] }
        );

      T.step(`Insert **${iv([s, e])}**. Walk the calendar once: copy, swallow, or copy.`, [draw()]);

      intervals.forEach(([a, b], i) => {
        const kind = b < s ? 0 : a > e ? 2 : 1;
        T.step(
          `Look at ${iv([a, b])} next to the new interval ${iv([s, e])}.`,
          [draw(i)],
          {
            ask: choose(
              `Where does ${iv([a, b])} go?`,
              ["Ends before it — copy", "Overlaps — swallow", "Starts after it — copy"],
              kind,
              "It ends before if b < start, starts after if a > end, and overlaps otherwise."
            ),
          }
        );
        if (kind === 0) {
          out.push([a, b]);
          status[i] = "dim";
          T.step(`${b} < ${s}, so it finishes before the new interval starts. Copy it across.`, [draw()]);
        } else if (kind === 1) {
          s = Math.min(s, a);
          e = Math.max(e, b);
          status[i] = "bad";
          T.step(`They overlap. Swallow it — the new interval grows to **${iv([s, e])}**.`, [draw()]);
        } else {
          if (!placed) {
            out.push([s, e]);
            placed = true;
          }
          out.push([a, b]);
          status[i] = "dim";
          T.step(`${a} > ${e}, so it starts after. The new interval ${iv([s, e])} is final — place it, then copy this one.`, [draw()]);
        }
      });

      if (!placed) {
        out.push([s, e]);
        placed = true;
        T.step(`Nothing is left to compare, so place ${iv([s, e])} at the end.`, [draw()]);
      }
      T.step(`Done: **${formatValue(out)}**.`, [draw()]);
      return out;
    },
    java: `public int[][] insert(int[][] intervals, int[] newInterval) {
    List<int[]> out = new ArrayList<>();
    int i = 0, n = intervals.length;
    int s = newInterval[0], e = newInterval[1];
    while (i < n && intervals[i][1] < s) out.add(intervals[i++]); // ends before
    while (i < n && intervals[i][0] <= e) {                       // overlaps
        s = Math.min(s, intervals[i][0]);
        e = Math.max(e, intervals[i][1]);
        i++;
    }
    out.add(new int[]{s, e});
    while (i < n) out.add(intervals[i++]);                        // starts after
    return out.toArray(new int[0][]);
}`,
    python: `def insert(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:
    out, i, n = [], 0, len(intervals)
    s, e = newInterval
    while i < n and intervals[i][1] < s:     # ends before
        out.append(intervals[i])
        i += 1
    while i < n and intervals[i][0] <= e:    # overlaps
        s, e = min(s, intervals[i][0]), max(e, intervals[i][1])
        i += 1
    out.append([s, e])
    out.extend(intervals[i:])                # starts after
    return out`,
    quiz: {
      q: "Why can Insert Interval run in O(n) without sorting?",
      options: [
        "The input is already sorted and non-overlapping",
        "It uses a heap",
        "Binary search finds the insertion point",
        "Intervals can never overlap",
      ],
      answer: 0,
      why: "Because the input is sorted, the three phases happen in order and one left-to-right walk covers them all.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "merge-intervals",
    lc: 56,
    title: "Merge Intervals",
    world: "intervals",
    difficulty: "Medium",
    pattern: "intervals",
    emoji: "🧲",
    statement: "Merge all overlapping intervals and return the non-overlapping intervals that cover the same ranges.",
    story:
      "Lay out everyone's vacation dates on a wall calendar in order of when they start. Now walk left to right with a marker: if the next trip starts before your current stretch ends, just extend the stretch. Otherwise, lift the marker and start a new one.",
    insight: "Sort by start. Each interval can only overlap the last interval you placed — extend it, or start a new one.",
    complexity: { time: "O(n log n)", space: "O(n)", why: "Sorting dominates; the merge itself is one pass." },
    inputs: [{ name: "intervals", kind: "pairs", minLen: 1, maxLen: 7, min: 0, max: 30 }],
    validate: ({ intervals }) => (allOrdered(intervals) ? undefined : "Every interval needs start ≤ end."),
    examples: [
      { input: { intervals: [[1, 3], [2, 6], [8, 10], [15, 18]] }, output: [[1, 6], [8, 10], [15, 18]] },
      { input: { intervals: [[1, 4], [4, 5]] }, output: [[1, 5]] },
      { input: { intervals: [[1, 4], [0, 4]] }, output: [[0, 4]] },
    ],
    trace({ intervals }, T) {
      const { min, max } = bounds(intervals);
      const sorted = tagged(intervals, "s");
      const out = [];
      const status = {};
      const draw = (focusId) =>
        spans(
          "sorted by start",
          [
            ...sorted.map((m, i) => ({ id: m.id, s: m.s, e: m.e, row: i, tone: m.id === focusId ? "active" : status[m.id] })),
            ...out.map(([a, b], i) => ({ id: "out" + i, s: a, e: b, row: sorted.length, tone: "found" })),
          ],
          { min, max, rows: [...sorted.map(() => ""), "merged"] }
        );

      T.step("Sort by start time. Now any overlap can only involve the most recently merged interval.", [draw()]);

      sorted.forEach((cur) => {
        const last = out[out.length - 1];
        const overlaps = Boolean(last) && cur.s <= last[1];
        T.step(
          `Next: ${iv([cur.s, cur.e])}. ` + (last ? `The last merged interval is ${iv(last)}.` : "Nothing merged yet."),
          [draw(cur.id)],
          {
            ask: last
              ? yesNo(`Does ${iv([cur.s, cur.e])} overlap ${iv(last)}?`, overlaps, "They overlap when the new start is ≤ the last end.")
              : undefined,
          }
        );
        status[cur.id] = "dim";
        if (overlaps) {
          const prevEnd = last[1];
          last[1] = Math.max(last[1], cur.e);
          T.step(`${cur.s} ≤ ${prevEnd}, so they overlap. Stretch the last interval to **${iv(last)}**.`, [draw()]);
        } else {
          out.push([cur.s, cur.e]);
          T.step(`No overlap — start a new merged interval ${iv([cur.s, cur.e])}.`, [draw()]);
        }
      });

      T.step(`Merged: **${formatValue(out)}**.`, [draw()]);
      return out;
    },
    java: `public int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    List<int[]> out = new ArrayList<>();
    for (int[] cur : intervals) {
        if (!out.isEmpty() && cur[0] <= out.get(out.size() - 1)[1]) {
            int[] last = out.get(out.size() - 1);
            last[1] = Math.max(last[1], cur[1]); // overlap: stretch the last one
        } else {
            out.add(cur);
        }
    }
    return out.toArray(new int[0][]);
}`,
    python: `def merge(self, intervals: List[List[int]]) -> List[List[int]]:
    intervals.sort(key=lambda x: x[0])
    out = []
    for s, e in intervals:
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out`,
    quiz: {
      q: "After sorting by start, which interval can the current one overlap?",
      options: [
        "Only the last interval in the merged result",
        "Any interval already in the result",
        "Only the next interval in the input",
        "None of them",
      ],
      answer: 0,
      why: "Everything earlier in the result ends before the last merged interval begins, so it's too far left to touch.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "non-overlapping-intervals",
    lc: 435,
    title: "Non-overlapping Intervals",
    world: "intervals",
    difficulty: "Medium",
    pattern: "greedy",
    emoji: "✂️",
    statement: "Return the minimum number of intervals you need to remove so the rest don't overlap.",
    story:
      "You have one meeting room and too many bookings. The winning strategy is almost lazy: always keep the meeting that finishes earliest. It frees the room soonest, leaving the most space for everyone else.",
    insight: "Sort by end time. Keep an interval if it starts at or after the last kept end; otherwise remove it.",
    complexity: { time: "O(n log n)", space: "O(1) extra", why: "Sorting, then one greedy pass." },
    inputs: [{ name: "intervals", kind: "pairs", minLen: 1, maxLen: 7, min: 0, max: 30 }],
    validate: ({ intervals }) => (allOrdered(intervals, true) ? undefined : "Every interval needs start < end."),
    examples: [
      { input: { intervals: [[1, 2], [2, 3], [3, 4], [1, 3]] }, output: 1 },
      { input: { intervals: [[1, 2], [1, 2], [1, 2]] }, output: 2 },
      { input: { intervals: [[1, 2], [2, 3]] }, output: 0 },
    ],
    trace({ intervals }, T) {
      const { min, max } = bounds(intervals);
      const sorted = tagged(intervals, "e");
      const status = {};
      let end = -Infinity;
      let removed = 0;
      const draw = (focusId) =>
        spans(
          "sorted by end",
          sorted.map((m, i) => ({ id: m.id, s: m.s, e: m.e, row: i, tone: m.id === focusId ? "active" : status[m.id] })),
          { min, max, marker: Number.isFinite(end) ? end : undefined }
        );

      T.step("Sort by **end** time, then greedily keep whichever meeting finishes first.", [draw()], { vars: { removed } });

      sorted.forEach((cur) => {
        const clash = cur.s < end;
        T.step(
          `${iv([cur.s, cur.e])} — ` + (Number.isFinite(end) ? `the room is busy until ${end}.` : "the room is free."),
          [draw(cur.id)],
          {
            vars: { removed },
            ask: Number.isFinite(end)
              ? choose(`Keep or remove ${iv([cur.s, cur.e])}?`, ["Keep it", "Remove it"], clash ? 1 : 0, "It clashes only if it starts before the room frees up.")
              : undefined,
          }
        );
        if (clash) {
          removed += 1;
          status[cur.id] = "bad";
          T.step(`${cur.s} < ${end}, so it clashes. Remove it — removed = **${removed}**.`, [draw()], { vars: { removed } });
        } else {
          end = cur.e;
          status[cur.id] = "good";
          T.step(`No clash, so keep it. The room is now busy until ${end}.`, [draw()], { vars: { removed } });
        }
      });

      T.step(`The fewest removals needed: **${removed}**.`, [draw()], { vars: { removed } });
      return removed;
    },
    java: `public int eraseOverlapIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
    int removed = 0, end = Integer.MIN_VALUE;
    for (int[] cur : intervals) {
        if (cur[0] < end) removed++; // clashes with the last kept meeting
        else end = cur[1];           // keep it
    }
    return removed;
}`,
    python: `def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int:
    intervals.sort(key=lambda x: x[1])
    removed, end = 0, float("-inf")
    for s, e in intervals:
        if s < end:
            removed += 1
        else:
            end = e
    return removed`,
    quiz: {
      q: "Why sort by end time instead of start time?",
      options: [
        "Keeping the interval that ends earliest leaves the most room for the rest",
        "Sorting by start is O(n²)",
        "End times are always unique",
        "The input requires it",
      ],
      answer: 0,
      why: "An early start says nothing about how long a meeting hogs the room. An early end is exactly what frees space.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "meeting-rooms",
    lc: 252,
    title: "Meeting Rooms",
    world: "intervals",
    difficulty: "Easy",
    pattern: "intervals",
    emoji: "🗓️",
    statement: "Given meeting time intervals, decide whether one person could attend every meeting.",
    story:
      "Sort your meetings by start time and walk through your day. The only way to be double-booked is if a meeting starts before the one right before it has ended.",
    insight: "Sort by start and compare each meeting only with its neighbour. Any overlap shows up between neighbours.",
    complexity: { time: "O(n log n)", space: "O(1) extra", why: "Sorting dominates the single scan." },
    inputs: [{ name: "intervals", kind: "pairs", minLen: 0, maxLen: 7, min: 0, max: 40 }],
    validate: ({ intervals }) => (allOrdered(intervals, true) ? undefined : "Every meeting needs start < end."),
    examples: [
      { input: { intervals: [[0, 30], [5, 10], [15, 20]] }, output: false },
      { input: { intervals: [[7, 10], [2, 4]] }, output: true },
    ],
    trace({ intervals }, T) {
      const { min, max } = bounds(intervals);
      const sorted = tagged(intervals, "s");
      const draw = (tones = {}) =>
        spans("sorted by start", sorted.map((m, i) => ({ id: m.id, s: m.s, e: m.e, row: i, tone: tones[m.id] })), { min, max });

      T.step("Sort the meetings by start time, then check each one against the meeting before it.", [draw()]);
      for (let i = 1; i < sorted.length; i += 1) {
        const prev = sorted[i - 1];
        const cur = sorted[i];
        const clash = cur.s < prev.e;
        T.step(
          `Compare ${iv([prev.s, prev.e])} with ${iv([cur.s, cur.e])}.`,
          [draw({ [prev.id]: "cmp", [cur.id]: "active" })],
          { ask: yesNo(`Does ${iv([cur.s, cur.e])} start before ${iv([prev.s, prev.e])} ends?`, clash) }
        );
        if (clash) {
          T.step(`${cur.s} < ${prev.e} — double-booked. **Can't attend them all → false**.`, [draw({ [prev.id]: "bad", [cur.id]: "bad" })]);
          return false;
        }
      }
      T.step("No meeting starts before the previous one ends. **Every meeting is attendable → true**.", [
        draw(Object.fromEntries(sorted.map((m) => [m.id, "good"]))),
      ]);
      return true;
    },
    java: `public boolean canAttendMeetings(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] < intervals[i - 1][1]) return false; // starts before the last ends
    }
    return true;
}`,
    python: `def canAttendMeetings(self, intervals: List[List[int]]) -> bool:
    intervals.sort(key=lambda x: x[0])
    for i in range(1, len(intervals)):
        if intervals[i][0] < intervals[i - 1][1]:
            return False
    return True`,
    quiz: {
      q: "Once meetings are sorted by start, where must a conflict show up?",
      options: [
        "Between two neighbours in sorted order",
        "Between the first and the last meeting",
        "Anywhere — you still have to compare every pair",
        "Only among meetings with the same start",
      ],
      answer: 0,
      why: "If meeting k overlaps some earlier meeting, it also overlaps the one right before it, whose start is even later.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "meeting-rooms-ii",
    lc: 253,
    title: "Meeting Rooms II",
    world: "intervals",
    difficulty: "Medium",
    pattern: "heap",
    emoji: "🏢",
    statement: "Given meeting time intervals, return the minimum number of conference rooms required.",
    story:
      "You run the office. As each meeting arrives, you glance at the room that frees up soonest. If it's already free, the meeting takes it. If not, every room is busy, so you open a new one.",
    insight: "Sort by start. A min-heap holds each busy room's end time; its top is the next room to free up. Reuse it or add a room.",
    complexity: { time: "O(n log n)", space: "O(n)", why: "Sorting, plus a heap operation per meeting." },
    inputs: [{ name: "intervals", kind: "pairs", minLen: 1, maxLen: 7, min: 0, max: 40 }],
    validate: ({ intervals }) => (allOrdered(intervals, true) ? undefined : "Every meeting needs start < end."),
    examples: [
      { input: { intervals: [[0, 30], [5, 10], [15, 20]] }, output: 2 },
      { input: { intervals: [[7, 10], [2, 4]] }, output: 1 },
      { input: { intervals: [[1, 5], [2, 6], [3, 7], [5, 8]] }, output: 3 },
    ],
    trace({ intervals }, T) {
      const { min, max } = bounds(intervals);
      const sorted = tagged(intervals, "s");
      const heap = new Heap();
      const status = {};
      const label = "rooms in use (end times, soonest on top)";
      const draw = (focusId, marker) =>
        spans(
          "sorted by start",
          sorted.map((m, i) => ({ id: m.id, s: m.s, e: m.e, row: i, tone: m.id === focusId ? "active" : status[m.id] })),
          { min, max, marker }
        );

      T.step("Sort by start. A min-heap tracks when each busy room frees up.", [draw(), heapTree(label, heap.data, { empty: "no rooms yet" })], {
        vars: { rooms: 0 },
      });

      sorted.forEach((cur) => {
        const soonest = heap.peek();
        const free = heap.size > 0 && soonest <= cur.s;
        T.step(
          `${iv([cur.s, cur.e])} needs a room. ` + (heap.size ? `The soonest a room frees up is **${soonest}**.` : "No rooms are open yet."),
          [draw(cur.id, heap.size ? soonest : undefined), heapTree(label, heap.data, { tones: { 0: "cmp" }, empty: "no rooms yet" })],
          {
            vars: { rooms: heap.size },
            ask: heap.size ? yesNo(`Can it reuse the room that frees up at ${soonest}?`, free, "A room is reusable if it frees up at or before this meeting starts.") : undefined,
          }
        );
        status[cur.id] = "visited";
        if (free) {
          heap.pop();
          heap.push(cur.e);
          T.step(`${soonest} ≤ ${cur.s}, so that room is free. Reuse it — it's now busy until ${cur.e}.`, [
            draw(),
            heapTree(label, heap.data, { tones: { [heap.data.indexOf(cur.e)]: "good" } }),
          ], { vars: { rooms: heap.size } });
        } else {
          heap.push(cur.e);
          T.step(`Every room is still busy, so open a new one. Rooms: **${heap.size}**.`, [
            draw(),
            heapTree(label, heap.data, { tones: { [heap.data.indexOf(cur.e)]: "active" } }),
          ], { vars: { rooms: heap.size } });
        }
      });

      T.step(`The most rooms ever in use at once: **${heap.size}**.`, [draw(), heapTree(label, heap.data)], { vars: { rooms: heap.size } });
      return heap.size;
    },
    java: `public int minMeetingRooms(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    PriorityQueue<Integer> ends = new PriorityQueue<>(); // end time of each busy room
    for (int[] m : intervals) {
        if (!ends.isEmpty() && ends.peek() <= m[0]) {
            ends.poll();                                  // reuse the room that freed up
        }
        ends.offer(m[1]);
    }
    return ends.size();
}`,
    python: `def minMeetingRooms(self, intervals: List[List[int]]) -> int:
    intervals.sort(key=lambda x: x[0])
    ends = []  # min-heap of end times
    for s, e in intervals:
        if ends and ends[0] <= s:
            heapq.heapreplace(ends, e)  # reuse the room that freed up
        else:
            heapq.heappush(ends, e)
    return len(ends)`,
    quiz: {
      q: "What does the top of the min-heap represent?",
      options: [
        "The room that becomes free the soonest",
        "The longest meeting so far",
        "The number of rooms in use",
        "The next meeting to start",
      ],
      answer: 0,
      why: "If even the soonest-free room is still busy, every room is busy — that's the moment you need a new one.",
    },
  },
];
