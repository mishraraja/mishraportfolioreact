import { list, buildList, listToArray, ListNode, yesNo, choose } from "../../engine/scene";
import { formatValue } from "../../engine/trace";

/** Nodes reachable from head, in order. */
function chain(head, limit = 60) {
  const out = [];
  let node = head;
  while (node && out.length < limit) {
    out.push(node);
    node = node.next;
  }
  return out;
}

const valOf = (node) => (node ? String(node.val) : "null");

function isSorted(values) {
  return values.every((v, i) => i === 0 || values[i - 1] <= v);
}

export const listProblems = [
  /* ------------------------------------------------------------------ */
  {
    slug: "reverse-linked-list",
    lc: 206,
    title: "Reverse Linked List",
    world: "lists",
    difficulty: "Easy",
    pattern: "list-rewire",
    emoji: "💃",
    statement: "Reverse a singly linked list and return the new head.",
    story:
      "It's a conga line, and everyone has a hand on the shoulder of the person in front. To turn the line around, each dancer lets go and grabs the person behind instead. The catch: before letting go, you have to remember who was in front, or the rest of the line wanders off.",
    insight: "Walk with prev, curr and next. Save next, point curr back at prev, then step both forward. prev ends up as the new head.",
    complexity: { time: "O(n)", space: "O(1)", why: "One pass, three pointers, rewired in place." },
    inputs: [{ name: "head", kind: "intArray", minLen: 0, maxLen: 7, min: -99, max: 99 }],
    examples: [
      { input: { head: [1, 2, 3, 4, 5] }, output: [5, 4, 3, 2, 1] },
      { input: { head: [1, 2] }, output: [2, 1] },
      { input: { head: [] }, output: [] },
    ],
    trace({ head }, T) {
      const nodes = buildList(head);
      let prev = null;
      let curr = nodes[0] || null;
      let first = true;

      T.step("Turn the conga line around. prev starts as null, because the old head will become the new tail.", [
        list("list", nodes, { pointers: { prev, curr } }),
      ]);

      while (curr) {
        const next = curr.next;
        T.step(
          `Before ${curr.val} lets go, remember who's in front: next = ${valOf(next)}.`,
          [list("list", nodes, { pointers: { prev, curr, next }, tones: { [curr.id]: "active" } })],
          {
            ask: first
              ? choose(
                  `After rewiring, where does ${curr.val}'s arrow point?`,
                  ["Back to prev", "Forward to next", "At itself"],
                  0,
                  "Reversing means every arrow points to the node that used to be behind it."
                )
              : undefined,
          }
        );
        first = false;
        curr.next = prev;
        const flipped = curr;
        prev = curr;
        curr = next;
        T.step(`Flip: ${flipped.val} now points back to ${valOf(flipped.next)}. Then everyone steps forward: prev = ${valOf(prev)}, curr = ${valOf(curr)}.`, [
          list("list", nodes, { pointers: { prev, curr }, tones: { [flipped.id]: "good" } }),
        ]);
      }

      const result = listToArray(prev);
      const reordered = chain(prev);
      T.step(`curr fell off the end, so prev (${valOf(prev)}) is the new head: **${formatValue(result)}**.`, [
        list("list", reordered, { pointers: { head: prev }, tones: Object.fromEntries(reordered.map((n) => [n.id, "found"])) }),
      ]);
      return result;
    },
    java: `public ListNode reverseList(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next; // remember who was in front
        curr.next = prev;          // flip the arrow
        prev = curr;               // everyone steps forward
        curr = next;
    }
    return prev;
}`,
    python: `def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
    prev, curr = None, head
    while curr:
        # the right side is evaluated before any assignment happens
        curr.next, prev, curr = prev, curr, curr.next
    return prev`,
    levelUp: "The recursive version is elegant — reverse the rest, then make head.next point back at head — but it uses O(n) stack space.",
    quiz: {
      q: "Why must you save curr.next before flipping the arrow?",
      options: [
        "Flipping overwrites curr.next, and without a saved copy the rest of the list is lost",
        "To count how many nodes there are",
        "Java requires a temporary variable",
        "So prev can move backward",
      ],
      answer: 0,
      why: "Once curr.next = prev runs, nothing points to the old next node anymore. The saved pointer is your only way forward.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "linked-list-cycle",
    lc: 141,
    title: "Linked List Cycle",
    world: "lists",
    difficulty: "Easy",
    pattern: "fast-slow",
    emoji: "🐢",
    statement: "Decide whether a linked list contains a cycle. (In the playground, pos is the index the last node links back to, or -1.)",
    story:
      "The tortoise and the hare race along the track. On a straight road the hare just reaches the finish. But if the road secretly loops back, the hare laps around and eventually lands right on top of the tortoise.",
    insight: "Move slow 1 step and fast 2 steps. If fast hits null there's no cycle; if they ever meet, there is one.",
    complexity: { time: "O(n)", space: "O(1)", why: "Inside a loop the gap closes by one node per step." },
    inputs: [
      { name: "head", kind: "intArray", minLen: 1, maxLen: 7, min: -99, max: 99 },
      { name: "pos", kind: "int", min: -1, max: 6 },
    ],
    validate: ({ head, pos }) => (pos < head.length ? undefined : `pos must be -1 or an index from 0 to ${head.length - 1}.`),
    examples: [
      { input: { head: [3, 2, 0, -4], pos: 1 }, output: true },
      { input: { head: [1, 2], pos: 0 }, output: true },
      { input: { head: [1, 2, 3, 4], pos: -1 }, output: false },
    ],
    trace({ head, pos }, T) {
      const nodes = buildList(head);
      if (pos >= 0) nodes[nodes.length - 1].next = nodes[pos];
      let slow = nodes[0];
      let fast = nodes[0];
      let tick = 0;

      T.step(
        pos >= 0
          ? `The last node secretly links back to index ${pos}. The tortoise moves 1 step per tick, the hare moves 2.`
          : "The tortoise moves 1 step per tick, the hare moves 2. If there's a loop, the hare will lap the tortoise.",
        [list("list", nodes, { pointers: { slow, fast } })]
      );

      while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
        tick += 1;
        const meet = slow === fast;
        const willMeet = Boolean(!meet && fast && fast.next && slow.next === fast.next.next);
        const canContinue = Boolean(fast && fast.next);
        T.step(
          `Tick ${tick}: tortoise → ${slow.val}, hare → ${valOf(fast)}.` + (meet ? " They're on the same node!" : ""),
          [list("list", nodes, { pointers: { slow, fast }, tones: meet ? { [slow.id]: "found" } : { [slow.id]: "cmp", ...(fast ? { [fast.id]: "active" } : {}) } })],
          { ask: !meet && canContinue ? yesNo("Will they meet on the next tick?", willMeet) : undefined }
        );
        if (meet) {
          T.step("Only a loop lets the faster runner catch the slower one from behind. **Cycle → true**.", [
            list("list", nodes, { pointers: { slow, fast }, tones: { [slow.id]: "found" } }),
          ]);
          return true;
        }
      }

      T.step("The hare ran off the end of the track, so there's no loop. **No cycle → false**.", [
        list("list", nodes, { pointers: { slow, fast } }),
      ]);
      return false;
    },
    java: `public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;       // tortoise: 1 step
        fast = fast.next.next;  // hare: 2 steps
        if (slow == fast) return true;
    }
    return false;
}`,
    python: `def hasCycle(self, head: Optional[ListNode]) -> bool:
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            return True
    return False`,
    levelUp: "Follow-up (LC 142): once they meet, reset one pointer to head and move both one step at a time. They meet again at the start of the cycle.",
    quiz: {
      q: "Why is the hare guaranteed to catch the tortoise inside a loop?",
      options: [
        "Inside the loop, the gap between them shrinks by exactly one node every tick",
        "The hare visits every node twice",
        "Loops always have even length",
        "They start on the same node",
      ],
      answer: 0,
      why: "The hare gains one node per tick. A gap that shrinks by one each tick can't jump over zero, so they must land together.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "merge-two-sorted-lists",
    lc: 21,
    title: "Merge Two Sorted Lists",
    world: "lists",
    difficulty: "Easy",
    pattern: "list-rewire",
    emoji: "🤝",
    statement: "Merge two sorted linked lists into one sorted list by splicing their nodes together, and return its head.",
    story:
      "Two single-file queues of people, each sorted by height, need to merge through one doorway. The doorman looks at the two people at the front and waves the shorter one through. When one queue runs out, the rest of the other just walks straight in.",
    insight: "Use a dummy head and a tail pointer. Repeatedly attach the smaller front node, then attach whatever remains.",
    complexity: { time: "O(n + m)", space: "O(1)", why: "Each node is attached once; nodes are reused, not copied." },
    inputs: [
      { name: "list1", kind: "intArray", minLen: 0, maxLen: 5, min: -20, max: 20 },
      { name: "list2", kind: "intArray", minLen: 0, maxLen: 5, min: -20, max: 20 },
    ],
    validate: ({ list1, list2 }) => (isSorted(list1) && isSorted(list2) ? undefined : "Both lists must be sorted in ascending order."),
    examples: [
      { input: { list1: [1, 2, 4], list2: [1, 3, 4] }, output: [1, 1, 2, 3, 4, 4] },
      { input: { list1: [], list2: [] }, output: [] },
      { input: { list1: [], list2: [0] }, output: [0] },
    ],
    trace({ list1, list2 }, T) {
      const a = buildList(list1, "a");
      const b = buildList(list2, "b");
      const dummy = new ListNode("start", "d");
      let tail = dummy;
      let p = a[0] || null;
      let q = b[0] || null;
      const merged = [dummy];
      const draw = (tones = {}) => [
        list("list1 (remaining)", chain(p), { pointers: { p }, tones }),
        list("list2 (remaining)", chain(q), { pointers: { q }, tones }),
        list("merged", merged, { pointers: { tail }, tones }),
      ];

      T.step("A dummy 'start' node gives the merged line something to hang on to, so the first node needs no special case.", draw());

      while (p && q) {
        const takeA = p.val <= q.val;
        T.step(
          `Compare the fronts: ${p.val} vs ${q.val}.`,
          draw({ [p.id]: "cmp", [q.id]: "cmp" }),
          {
            ask:
              p.val === q.val
                ? undefined
                : choose("Which one goes through the door?", [`${p.val} from list1`, `${q.val} from list2`], takeA ? 0 : 1, "The smaller front always goes first."),
          }
        );
        const picked = takeA ? p : q;
        tail.next = picked;
        tail = picked;
        if (takeA) p = p.next;
        else q = q.next;
        merged.push(picked);
        T.step(`${picked.val} joins the merged line${p && q && list1.length && list2.length && picked.val === (takeA ? q.val : p.val) ? " (ties can go either way — we take list1)" : ""}.`, draw({ [picked.id]: "good" }));
      }

      const rest = p || q;
      if (rest) {
        tail.next = rest;
        const tailNodes = chain(rest);
        merged.push(...tailNodes);
        p = null;
        q = null;
        T.step(`One line is empty, so the rest of the other (${formatValue(listToArray(rest))}) attaches in a single move.`, draw(Object.fromEntries(tailNodes.map((n) => [n.id, "good"]))));
      }

      const result = listToArray(dummy.next);
      T.step(`Merged: **${formatValue(result)}**. Return dummy.next, skipping the helper node.`, [
        list("merged", merged.slice(1), { pointers: { head: dummy.next }, tones: Object.fromEntries(merged.map((n) => [n.id, "found"])) }),
      ]);
      return result;
    },
    java: `public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
    ListNode dummy = new ListNode(0), tail = dummy; // dummy: no special case for the head
    while (list1 != null && list2 != null) {
        if (list1.val <= list2.val) {
            tail.next = list1;
            list1 = list1.next;
        } else {
            tail.next = list2;
            list2 = list2.next;
        }
        tail = tail.next;
    }
    tail.next = (list1 != null) ? list1 : list2;    // attach whatever is left
    return dummy.next;
}`,
    python: `def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
    dummy = tail = ListNode()
    while list1 and list2:
        if list1.val <= list2.val:
            tail.next, list1 = list1, list1.next
        else:
            tail.next, list2 = list2, list2.next
        tail = tail.next
    tail.next = list1 or list2
    return dummy.next`,
    quiz: {
      q: "What does the dummy node buy you?",
      options: [
        "No special case for the head — you always just append to tail.next",
        "Faster comparisons",
        "A place to store the list's length",
        "Protection against cycles",
      ],
      answer: 0,
      why: "Without it you'd need an if-statement to pick the first node. With it, every node is attached the same way.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "remove-nth-node-from-end-of-list",
    lc: 19,
    title: "Remove Nth Node From End of List",
    world: "lists",
    difficulty: "Medium",
    pattern: "fast-slow",
    emoji: "📏",
    statement: "Remove the n-th node from the end of a linked list in one pass and return the head.",
    story:
      "You can't see the end of the tunnel, so you send a scout n steps ahead on a rope of fixed length. Then you both walk at the same speed. When the scout touches the far wall, you're standing exactly n steps from the end.",
    insight: "Start two pointers at a dummy node. Move fast n steps, then move both until fast is on the last node. slow is right before the target.",
    complexity: { time: "O(n)", space: "O(1)", why: "A single pass with a fixed gap." },
    inputs: [
      { name: "head", kind: "intArray", minLen: 1, maxLen: 7, min: -99, max: 99 },
      { name: "n", kind: "int", min: 1, max: 7 },
    ],
    validate: ({ head, n }) => (n <= head.length ? undefined : `n must be between 1 and ${head.length}.`),
    examples: [
      { input: { head: [1, 2, 3, 4, 5], n: 2 }, output: [1, 2, 3, 5] },
      { input: { head: [1], n: 1 }, output: [] },
      { input: { head: [1, 2], n: 1 }, output: [1] },
    ],
    trace({ head, n }, T) {
      const nodes = buildList(head);
      const dummy = new ListNode("start", "d");
      dummy.next = nodes[0];
      const all = [dummy, ...nodes];
      let fast = dummy;
      let slow = dummy;

      T.step(`Both start at a dummy node before the head. First, the scout (fast) goes **${n}** step${n === 1 ? "" : "s"} ahead.`, [
        list("list", all, { pointers: { slow, fast } }),
      ]);

      for (let i = 0; i < n; i += 1) {
        fast = fast.next;
        T.step(`Scout step ${i + 1}: fast → ${fast.val}.`, [list("list", all, { pointers: { slow, fast }, tones: { [fast.id]: "active" } })]);
      }

      for (;;) {
        const more = Boolean(fast.next);
        T.step(
          `The gap is set: slow at ${slow.val}, fast at ${fast.val}.`,
          [list("list", all, { pointers: { slow, fast }, tones: { [slow.id]: "cmp", [fast.id]: "active" } })],
          { ask: yesNo("Does fast still have a node ahead of it?", more, "They keep walking until fast stands on the last node.") }
        );
        if (!more) break;
        slow = slow.next;
        fast = fast.next;
      }

      const target = slow.next;
      T.step(`fast is on the last node, so slow.next (${target.val}) is #${n} from the end. Unlink it.`, [
        list("list", all, { pointers: { slow, fast }, tones: { [target.id]: "bad" } }),
      ]);
      slow.next = target.next;
      const result = listToArray(dummy.next);
      T.step(`slow.next now skips to ${valOf(slow.next)}. Result: **${formatValue(result)}**.`, [
        list("list", all.filter((x) => x !== target), { pointers: { slow }, tones: Object.fromEntries(nodes.filter((x) => x !== target).map((x) => [x.id, "found"])) }),
      ]);
      return result;
    },
    java: `public ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0, head), slow = dummy, fast = dummy;
    for (int i = 0; i < n; i++) fast = fast.next; // open an n-node gap
    while (fast.next != null) {                    // walk until fast is on the last node
        slow = slow.next;
        fast = fast.next;
    }
    slow.next = slow.next.next;                    // slow sits right before the target
    return dummy.next;
}`,
    python: `def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:
    dummy = ListNode(0, head)
    slow = fast = dummy
    for _ in range(n):
        fast = fast.next
    while fast.next:
        slow, fast = slow.next, fast.next
    slow.next = slow.next.next
    return dummy.next`,
    quiz: {
      q: "Why do both pointers start at a dummy node before the head?",
      options: [
        "So removing the head itself works — slow can stand before the first real node",
        "To make the gap n + 2",
        "Two pointers always need a dummy",
        "To avoid ever seeing null values",
      ],
      answer: 0,
      why: "Deleting a node means changing the previous node's next. The head has no previous node unless you add one.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "reorder-list",
    lc: 143,
    title: "Reorder List",
    world: "lists",
    difficulty: "Medium",
    pattern: "list-rewire",
    emoji: "🧵",
    statement: "Reorder L0 → L1 → … → Ln into L0 → Ln → L1 → Ln−1 → L2 → … in place.",
    story:
      "You're shuffling a deck with a riffle, but one half is upside down. Cut the deck in the middle, flip the bottom half over, then interleave: one card from the top half, one from the flipped half, and repeat.",
    insight: "Three classics chained together: find the middle (slow/fast), reverse the second half, then merge the halves alternately.",
    complexity: { time: "O(n)", space: "O(1)", why: "Three linear passes, all rewiring in place." },
    inputs: [{ name: "head", kind: "intArray", minLen: 1, maxLen: 7, min: -99, max: 99 }],
    examples: [
      { input: { head: [1, 2, 3, 4] }, output: [1, 4, 2, 3] },
      { input: { head: [1, 2, 3, 4, 5] }, output: [1, 5, 2, 4, 3] },
      { input: { head: [1] }, output: [1] },
    ],
    trace({ head }, T) {
      const nodes = buildList(head);
      if (nodes.length < 3) {
        T.step("With fewer than three nodes the order is already correct.", [list("list", nodes)]);
        return listToArray(nodes[0]);
      }

      let slow = nodes[0];
      let fast = nodes[0];
      T.step("Phase 1 — find the middle. The hare takes two steps for every one the tortoise takes.", [
        list("list", nodes, { pointers: { slow, fast } }),
      ]);
      while (fast.next && fast.next.next) {
        slow = slow.next;
        fast = fast.next.next;
        T.step(`tortoise → ${slow.val}, hare → ${fast.val}.`, [list("list", nodes, { pointers: { slow, fast } })]);
      }

      let curr = slow.next;
      slow.next = null;
      T.step(`The middle is ${slow.val}. Cut the list after it — the back half starts at ${curr.val}.`, [
        list("list", nodes, { pointers: { mid: slow, back: curr }, tones: { [slow.id]: "active" } }),
      ]);

      let prev = null;
      while (curr) {
        const next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
        T.step(`Phase 2 — reverse the back half: ${prev.val} now points to ${valOf(prev.next)}.`, [
          list("list", nodes, { pointers: { prev, curr }, tones: { [prev.id]: "good" } }),
        ]);
      }

      let a = nodes[0];
      let b = prev;
      T.step(
        "Phase 3 — weave: one from the front half, one from the reversed back half, repeat.",
        [list("list", nodes, { pointers: { front: a, back: b } })],
        {
          ask: choose(
            `In the final order, which node comes right after ${a.val}?`,
            [`${a.next.val} (its current neighbour)`, `${b.val} (the old tail)`],
            1,
            "The pattern is first, last, second, second-to-last…"
          ),
        }
      );
      while (b) {
        const an = a.next;
        const bn = b.next;
        a.next = b;
        b.next = an;
        T.step(`${a.val} → ${b.val} → ${valOf(an)}.`, [
          list("list", nodes, { pointers: { front: an, back: bn }, tones: { [a.id]: "good", [b.id]: "good" } }),
        ]);
        a = an;
        b = bn;
      }

      const result = listToArray(nodes[0]);
      const ordered = chain(nodes[0]);
      T.step(`Reordered: **${formatValue(result)}**.`, [
        list("list", ordered, { tones: Object.fromEntries(ordered.map((x) => [x.id, "found"])) }),
      ]);
      return result;
    },
    java: `public void reorderList(ListNode head) {
    if (head == null || head.next == null) return;
    ListNode slow = head, fast = head;
    while (fast.next != null && fast.next.next != null) { // 1. find the middle
        slow = slow.next;
        fast = fast.next.next;
    }
    ListNode prev = null, curr = slow.next;
    slow.next = null;                                     // cut the list in two
    while (curr != null) {                                // 2. reverse the back half
        ListNode next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    for (ListNode a = head, b = prev; b != null; ) {      // 3. weave front and back
        ListNode an = a.next, bn = b.next;
        a.next = b;
        b.next = an;
        a = an;
        b = bn;
    }
}`,
    python: `def reorderList(self, head: Optional[ListNode]) -> None:
    slow = fast = head
    while fast.next and fast.next.next:          # 1. find the middle
        slow, fast = slow.next, fast.next.next
    prev, curr = None, slow.next
    slow.next = None                              # cut the list in two
    while curr:                                   # 2. reverse the back half
        curr.next, prev, curr = prev, curr, curr.next
    a, b = head, prev
    while b:                                      # 3. weave front and back
        a.next, b.next, a, b = b, a.next, a.next, b.next`,
    quiz: {
      q: "Which three smaller problems make up Reorder List?",
      options: [
        "Find the middle, reverse the back half, merge the halves alternately",
        "Sort, reverse, remove duplicates",
        "Count, split, rotate",
        "Hash, sort, merge",
      ],
      answer: 0,
      why: "It's a composition question. Interviewers love it because each piece is a problem you should already know cold.",
    },
  },
];
