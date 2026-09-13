import { arr, kv, set, text, yesNo, choose, paint, outside } from "../../engine/scene";
import { formatValue } from "../../engine/trace";

/** True for a strictly increasing array rotated any number of times. */
function isRotatedSorted(nums) {
  let drops = 0;
  for (let i = 0; i < nums.length; i += 1) {
    if (nums[i] >= nums[(i + 1) % nums.length]) drops += 1;
  }
  return drops <= 1;
}

export const arrays = [
  /* ------------------------------------------------------------------ */
  {
    slug: "two-sum",
    lc: 1,
    title: "Two Sum",
    world: "arrays",
    difficulty: "Easy",
    pattern: "hashing",
    emoji: "💃",
    statement:
      "Given an array of integers and a target, return the indices of the two numbers that add up to the target. Exactly one answer exists, and you can't use the same element twice.",
    story:
      "It's a dance party. Every number walks in looking for the one partner that makes the target. Instead of asking everyone in the room, it checks the guest list at the door: has my partner already arrived?",
    insight:
      "For each number x, the partner you need is target − x. A hash map of the numbers you've already seen answers “is my partner here?” in O(1).",
    complexity: { time: "O(n)", space: "O(n)", why: "One pass over the array; the map may end up holding every number." },
    inputs: [
      { name: "nums", kind: "intArray", minLen: 2, maxLen: 10, min: -99, max: 99 },
      { name: "target", kind: "int", min: -198, max: 198 },
    ],
    examples: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, output: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, output: [1, 2] },
      { input: { nums: [3, 3], target: 6 }, output: [0, 1] },
    ],
    trace({ nums, target }, T) {
      const seen = new Map();
      const label = "seen: value → index";
      T.step(`We need two numbers that add up to **${target}**. The guest list starts empty.`, [
        arr("nums", nums),
        kv(label, seen),
      ]);
      for (let i = 0; i < nums.length; i += 1) {
        const need = target - nums[i];
        const done = paint(0, i - 1, "visited");
        T.step(
          `**${nums[i]}** walks in. Its partner would be ${target} − ${nums[i]} = **${need}**. Is ${need} on the list?`,
          [arr("nums", nums, { pointers: { i }, tones: { ...done, [i]: "active" } }), kv(label, seen, { hot: need })],
          { vars: { i, need }, ask: yesNo(`Is ${need} already in the map?`, seen.has(need)) }
        );
        if (seen.has(need)) {
          const j = seen.get(need);
          T.step(
            `Yes — ${need} arrived earlier at index ${j}. **Pair found: [${j}, ${i}]**.`,
            [arr("nums", nums, { pointers: { i }, tones: { [j]: "found", [i]: "found" } }), kv(label, seen, { hot: need, tone: "good" })],
            { vars: { i, need } }
          );
          return [j, i];
        }
        seen.set(nums[i], i);
        T.step(
          `Not yet. Write ${nums[i]} → ${i} on the list and let the next number in.`,
          [arr("nums", nums, { pointers: { i }, tones: { ...done, [i]: "visited" } }), kv(label, seen, { hot: nums[i] })],
          { vars: { i, need } }
        );
      }
      T.step("Everyone arrived and no pair worked out.", [arr("nums", nums), kv(label, seen)]);
      return [];
    },
    java: `public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>(); // value -> index
    for (int i = 0; i < nums.length; i++) {
        int need = target - nums[i];
        if (seen.containsKey(need)) {
            return new int[]{seen.get(need), i};
        }
        seen.put(nums[i], i);
    }
    return new int[0];
}`,
    python: `def twoSum(self, nums: List[int], target: int) -> List[int]:
    seen = {}  # value -> index
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []`,
    quiz: {
      q: "Why do we check the map before adding the current number?",
      options: [
        "So a number can never pair with itself",
        "Hash map lookups are faster before an insert",
        "It keeps the map sorted",
        "It guarantees the smaller index comes first",
      ],
      answer: 0,
      why: "Insert first and [3] with target 6 would find itself. Checking first means the partner is always a different, earlier element.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "best-time-to-buy-and-sell-stock",
    lc: 121,
    title: "Best Time to Buy and Sell Stock",
    world: "arrays",
    difficulty: "Easy",
    pattern: "greedy",
    emoji: "📈",
    statement:
      "Given daily stock prices, choose one day to buy and a later day to sell. Return the maximum profit, or 0 if no profit is possible.",
    story:
      "You're a time traveller with one trade. You walk forward through the calendar, always remembering the cheapest day you've passed. On each new day you ask one question: if I'd bought on that cheapest day, what would I make selling today?",
    insight:
      "The best sale on any day only depends on the lowest price before it. Track that minimum as you go, and the answer is the biggest (price − minimum) you ever see.",
    complexity: { time: "O(n)", space: "O(1)", why: "One pass, two variables." },
    inputs: [{ name: "prices", kind: "intArray", minLen: 1, maxLen: 12, min: 0, max: 99 }],
    examples: [
      { input: { prices: [7, 1, 5, 3, 6, 4] }, output: 5 },
      { input: { prices: [7, 6, 4, 3, 1] }, output: 0 },
      { input: { prices: [2, 4, 1] }, output: 2 },
    ],
    trace({ prices }, T) {
      let minI = 0;
      let best = 0;
      let bestBuy = -1;
      let bestSell = -1;
      const view = (i, tones) => arr("prices", prices, { bars: true, pointers: { buy: minI, day: i }, tones });

      T.step("Walk forward through the days, remembering the cheapest one so far. Day 0 is the cheapest so far by default.", [view(0, { 0: "cmp" })], {
        vars: { cheapest: prices[0], best },
      });

      for (let i = 1; i < prices.length; i += 1) {
        const profit = prices[i] - prices[minI];
        const isNewMin = prices[i] < prices[minI];
        T.step(
          `Day ${i}, price **${prices[i]}**. Buying at the cheapest (${prices[minI]}) and selling today makes **${profit}**.`,
          [view(i, { [minI]: "cmp", [i]: "active" })],
          { vars: { cheapest: prices[minI], profit, best }, ask: yesNo(`Is ${prices[i]} a new cheapest price?`, isNewMin) }
        );
        if (profit > best) {
          best = profit;
          bestBuy = minI;
          bestSell = i;
          T.step(`That beats the record — best profit is now **${best}**.`, [view(i, { [minI]: "good", [i]: "good" })], {
            vars: { cheapest: prices[minI], profit, best },
          });
        }
        if (isNewMin) {
          minI = i;
          T.step(`${prices[i]} is the cheapest price yet, so every future sale will “buy” here instead.`, [view(i, { [i]: "cmp" })], {
            vars: { cheapest: prices[minI], best },
          });
        }
      }

      T.step(
        best > 0
          ? `Best plan: buy on day ${bestBuy} at ${prices[bestBuy]}, sell on day ${bestSell} at ${prices[bestSell]}. Profit **${best}**.`
          : "Prices never rise after a dip, so the best move is not to trade. Profit **0**.",
        [arr("prices", prices, { bars: true, tones: best > 0 ? { [bestBuy]: "found", [bestSell]: "found" } : {} })],
        { vars: { best } }
      );
      return best;
    },
    java: `public int maxProfit(int[] prices) {
    int cheapest = Integer.MAX_VALUE, best = 0;
    for (int price : prices) {
        cheapest = Math.min(cheapest, price);    // best day to have bought so far
        best = Math.max(best, price - cheapest); // sell today?
    }
    return best;
}`,
    python: `def maxProfit(self, prices: List[int]) -> int:
    cheapest, best = float("inf"), 0
    for price in prices:
        cheapest = min(cheapest, price)
        best = max(best, price - cheapest)
    return best`,
    quiz: {
      q: "Why is a single pass enough?",
      options: [
        "The best sale on any day only needs the cheapest price before that day",
        "The prices are sorted",
        "We compare every pair of days, just quickly",
        "We always sell on the highest day",
      ],
      answer: 0,
      why: "Selling on day i, the only buy day that matters is the cheapest one before i — and that's exactly the running minimum.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "contains-duplicate",
    lc: 217,
    title: "Contains Duplicate",
    world: "arrays",
    difficulty: "Easy",
    pattern: "hashing",
    emoji: "📮",
    statement: "Return true if any value appears at least twice in the array, and false if every element is distinct.",
    story:
      "You're a stamp collector sorting a shoebox. Each stamp gets checked against your album before it goes in. The moment one is already there, you've found a duplicate.",
    insight: "A HashSet remembers everything you've seen with O(1) checks. The first repeat ends the search.",
    complexity: { time: "O(n)", space: "O(n)", why: "Each number is checked and stored once." },
    inputs: [{ name: "nums", kind: "intArray", minLen: 1, maxLen: 12, min: -99, max: 99 }],
    examples: [
      { input: { nums: [1, 2, 3, 1] }, output: true },
      { input: { nums: [1, 2, 3, 4] }, output: false },
      { input: { nums: [1, 1, 1, 3, 3, 4, 3, 2, 4, 2] }, output: true },
    ],
    trace({ nums }, T) {
      const seen = new Set();
      T.step("Go through the stamps one at a time, checking each against the album.", [arr("nums", nums), set("album", seen)]);
      for (let i = 0; i < nums.length; i += 1) {
        const done = paint(0, i - 1, "visited");
        T.step(
          `Stamp **${nums[i]}**. Is it already in the album?`,
          [arr("nums", nums, { pointers: { i }, tones: { ...done, [i]: "active" } }), set("album", seen, { hot: nums[i] })],
          { ask: yesNo(`Have we seen ${nums[i]} before?`, seen.has(nums[i])) }
        );
        if (seen.has(nums[i])) {
          const first = nums.indexOf(nums[i]);
          T.step(
            `Already there — ${nums[i]} first showed up at index ${first}. **Duplicate found → true**.`,
            [arr("nums", nums, { pointers: { i }, tones: { [first]: "found", [i]: "found" } }), set("album", seen, { hot: nums[i], tone: "bad" })]
          );
          return true;
        }
        seen.add(nums[i]);
        T.step("A new stamp. Into the album it goes.", [
          arr("nums", nums, { pointers: { i }, tones: { ...done, [i]: "good" } }),
          set("album", seen, { hot: nums[i], tone: "good" }),
        ]);
      }
      T.step("Every stamp was different. **No duplicates → false**.", [
        arr("nums", nums, { tones: paint(0, nums.length - 1, "good") }),
        set("album", seen),
      ]);
      return false;
    },
    java: `public boolean containsDuplicate(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int x : nums) {
        if (!seen.add(x)) return true; // add() returns false if x was already there
    }
    return false;
}`,
    python: `def containsDuplicate(self, nums: List[int]) -> bool:
    seen = set()
    for x in nums:
        if x in seen:
            return True
        seen.add(x)
    return False`,
    quiz: {
      q: "How does the HashSet approach compare with sorting and checking neighbours?",
      options: [
        "HashSet is O(n) time but O(n) space; sorting is O(n log n) time with little extra space",
        "HashSet is slower but uses less memory",
        "Sorting can't detect duplicates",
        "They have identical time and space costs",
      ],
      answer: 0,
      why: "It's a classic time-for-space trade. Mention both in an interview and pick based on the constraints.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "product-of-array-except-self",
    lc: 238,
    title: "Product of Array Except Self",
    world: "arrays",
    difficulty: "Medium",
    pattern: "prefix-suffix",
    emoji: "🧺",
    statement:
      "Return an array where answer[i] is the product of every element except nums[i]. Solve it in O(n) without using division.",
    story:
      "People stand in a line, and each wants the product of everybody else. Walk down the line carrying a left basket of everything behind you, then walk back carrying a right basket. Each person just multiplies the two baskets.",
    insight:
      "answer[i] = (product of everything left of i) × (product of everything right of i). Two sweeps build both halves, and no division is needed.",
    complexity: { time: "O(n)", space: "O(1) extra", why: "Two sweeps; the output array doesn't count as extra space." },
    inputs: [{ name: "nums", kind: "intArray", minLen: 2, maxLen: 8, min: -9, max: 9 }],
    examples: [
      { input: { nums: [1, 2, 3, 4] }, output: [24, 12, 8, 6] },
      { input: { nums: [-1, 1, 0, -3, 3] }, output: [0, 0, 9, 0, 0] },
    ],
    trace({ nums }, T) {
      const n = nums.length;
      const ans = new Array(n).fill(1);
      let left = 1;
      T.step("First sweep, left to right, carrying a **left basket**: the product of everything before the current spot.", [
        arr("nums", nums),
        arr("answer", ans),
      ], { vars: { left } });
      for (let i = 0; i < n; i += 1) {
        ans[i] = left;
        T.step(
          `answer[${i}] = left basket = **${left}**. Then drop nums[${i}] = ${nums[i]} into the basket.`,
          [arr("nums", nums, { pointers: { i }, tones: { ...paint(0, i - 1, "cmp"), [i]: "active" } }), arr("answer", ans, { tones: { [i]: "good" } })],
          { vars: { left } }
        );
        left *= nums[i];
      }

      let right = 1;
      T.step("Second sweep, right to left, carrying a **right basket** and multiplying it in.", [arr("nums", nums), arr("answer", ans)], {
        vars: { right },
      });
      for (let i = n - 1; i >= 0; i -= 1) {
        const before = ans[i];
        ans[i] = before * right;
        T.step(
          `answer[${i}] = ${before} × right basket ${right} = **${ans[i]}**. Then drop nums[${i}] = ${nums[i]} into the right basket.`,
          [arr("nums", nums, { pointers: { i }, tones: { ...paint(i + 1, n - 1, "cmp"), [i]: "active" } }), arr("answer", ans, { tones: { [i]: "good" } })],
          { vars: { right } }
        );
        right *= nums[i];
      }
      T.step("Two sweeps, no division, done.", [arr("nums", nums), arr("answer", ans, { tones: paint(0, n - 1, "found") })]);
      return ans;
    },
    java: `public int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] ans = new int[n];
    int left = 1;
    for (int i = 0; i < n; i++) {      // ans[i] = product of everything left of i
        ans[i] = left;
        left *= nums[i];
    }
    int right = 1;
    for (int i = n - 1; i >= 0; i--) { // multiply in everything right of i
        ans[i] *= right;
        right *= nums[i];
    }
    return ans;
}`,
    python: `def productExceptSelf(self, nums: List[int]) -> List[int]:
    n = len(nums)
    ans = [1] * n
    left = 1
    for i in range(n):
        ans[i] = left
        left *= nums[i]
    right = 1
    for i in range(n - 1, -1, -1):
        ans[i] *= right
        right *= nums[i]
    return ans`,
    quiz: {
      q: "Why not multiply everything together and divide by nums[i]?",
      options: [
        "A zero in the array breaks division, and the problem forbids it anyway",
        "Division makes it O(n²)",
        "Multiplication overflows less than division",
        "It returns the answers in the wrong order",
      ],
      answer: 0,
      why: "With a single zero, the total product is 0 and you can't divide back out. The prefix × suffix approach never has that problem.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "maximum-subarray",
    lc: 53,
    title: "Maximum Subarray",
    world: "arrays",
    difficulty: "Medium",
    pattern: "greedy",
    emoji: "☃️",
    statement: "Find the contiguous subarray with the largest sum and return that sum.",
    story:
      "A snowball rolls down a hill of numbers, picking up each one it passes. If the snowball ever turns negative, it's only dragging you down, so you drop it and start a fresh one right there.",
    insight:
      "Kadane's algorithm: at each number, either extend the current run or start fresh — whichever is bigger. The best run you ever see is the answer.",
    complexity: { time: "O(n)", space: "O(1)", why: "One pass, two running values." },
    inputs: [{ name: "nums", kind: "intArray", minLen: 1, maxLen: 12, min: -20, max: 20 }],
    examples: [
      { input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }, output: 6 },
      { input: { nums: [1] }, output: 1 },
      { input: { nums: [5, 4, -1, 7, 8] }, output: 23 },
    ],
    trace({ nums }, T) {
      let cur = nums[0];
      let best = nums[0];
      let start = 0;
      let bestL = 0;
      let bestR = 0;
      T.step(`The snowball starts on the first number: current = best = **${cur}**.`, [
        arr("nums", nums, { window: [0, 0], pointers: { i: 0 }, tones: { 0: "active" } }),
      ], { vars: { current: cur, best } });

      for (let i = 1; i < nums.length; i += 1) {
        const old = cur;
        const extend = old + nums[i];
        const keepGoing = old >= 0;
        T.step(
          `**${nums[i]}** is next. Extend the snowball (${old} + ${nums[i]} = ${extend}) or start fresh with ${nums[i]}?`,
          [arr("nums", nums, { window: [start, i - 1], pointers: { i }, tones: { [i]: "active" } })],
          {
            vars: { current: cur, best },
            ask: choose(
              `Extend to ${extend}, or start fresh at ${nums[i]}?`,
              ["Extend", "Start fresh"],
              keepGoing ? 0 : 1,
              "Keep whichever is bigger. A negative running total only drags the next numbers down."
            ),
          }
        );
        if (keepGoing) {
          cur = extend;
        } else {
          cur = nums[i];
          start = i;
        }
        const improved = cur > best;
        if (improved) {
          best = cur;
          bestL = start;
          bestR = i;
        }
        const action = keepGoing
          ? `Extend: current = **${cur}**.`
          : `The old snowball was negative (${old}), so drop it and start fresh: current = **${cur}**.`;
        T.step(
          action + (improved ? ` That's a new best: **${best}**.` : ""),
          [arr("nums", nums, { window: [start, i], pointers: { i }, tones: improved ? paint(start, i, "good") : { [i]: "active" } })],
          { vars: { current: cur, best } }
        );
      }

      T.step(`The best run is indices ${bestL}…${bestR}, with sum **${best}**.`, [
        arr("nums", nums, { window: [bestL, bestR], tones: paint(bestL, bestR, "found") }),
      ], { vars: { best } });
      return best;
    },
    java: `public int maxSubArray(int[] nums) {
    int current = nums[0], best = nums[0];
    for (int i = 1; i < nums.length; i++) {
        current = Math.max(nums[i], current + nums[i]); // start fresh, or extend
        best = Math.max(best, current);
    }
    return best;
}`,
    python: `def maxSubArray(self, nums: List[int]) -> int:
    current = best = nums[0]
    for x in nums[1:]:
        current = max(x, current + x)
        best = max(best, current)
    return best`,
    quiz: {
      q: "When does Kadane's algorithm throw away the running sum?",
      options: [
        "When the running sum is negative",
        "Whenever it sees a negative number",
        "When the running sum is bigger than the best",
        "At every other element",
      ],
      answer: 0,
      why: "A negative number can still belong in the best run (4, −1, 2 sums to 5). Only a negative running total is pure dead weight.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "maximum-product-subarray",
    lc: 152,
    title: "Maximum Product Subarray",
    world: "arrays",
    difficulty: "Medium",
    pattern: "greedy",
    emoji: "🪞",
    statement: "Find the contiguous subarray with the largest product and return that product.",
    story:
      "Negative numbers are mirror portals: step through one and the biggest product becomes the smallest, and the smallest becomes the biggest. So you carry both, because one portal later the tiny one might be the giant.",
    insight:
      "Track the maximum AND the minimum product ending at each position. For each number, the new max is the largest of x, max × x and min × x.",
    complexity: { time: "O(n)", space: "O(1)", why: "One pass with three running values." },
    inputs: [{ name: "nums", kind: "intArray", minLen: 1, maxLen: 10, min: -9, max: 9 }],
    examples: [
      { input: { nums: [2, 3, -2, 4] }, output: 6 },
      { input: { nums: [-2, 0, -1] }, output: 0 },
      { input: { nums: [-2, 3, -4] }, output: 24 },
    ],
    trace({ nums }, T) {
      let hi = nums[0];
      let lo = nums[0];
      let best = nums[0];
      T.step(`Carry two trackers: the **biggest** and the **smallest** product ending here. Both start at ${nums[0]}.`, [
        arr("nums", nums, { pointers: { i: 0 }, tones: { 0: "active" } }),
      ], { vars: { max: hi, min: lo, best } });

      for (let i = 1; i < nums.length; i += 1) {
        const x = nums[i];
        const c = [x, hi * x, lo * x];
        const top = Math.max(...c);
        const unique = c.filter((v) => v === top).length === 1;
        T.step(
          `x = **${x}**. The candidates are x itself (${x}), max × x (${hi * x}) and min × x (${lo * x}).` +
            (x < 0 ? " x is negative — a mirror portal that swaps big and small!" : ""),
          [arr("nums", nums, { pointers: { i }, tones: { ...paint(0, i - 1, "visited"), [i]: "active" } })],
          {
            vars: { max: hi, min: lo, best },
            ask: unique
              ? choose(
                  "Which candidate becomes the new max?",
                  [`x = ${x}`, `max × x = ${hi * x}`, `min × x = ${lo * x}`],
                  c.indexOf(top),
                  "Take the largest of the three — a negative times the old minimum can be the winner."
                )
              : undefined,
          }
        );
        hi = top;
        lo = Math.min(...c);
        best = Math.max(best, hi);
        T.step(`New max = **${hi}**, new min = **${lo}**. Best so far: **${best}**.`, [
          arr("nums", nums, { pointers: { i }, tones: { ...paint(0, i - 1, "visited"), [i]: "good" } }),
        ], { vars: { max: hi, min: lo, best } });
      }

      T.step(`The largest product of any contiguous run is **${best}**.`, [arr("nums", nums)], { vars: { best } });
      return best;
    },
    java: `public int maxProduct(int[] nums) {
    int hi = nums[0], lo = nums[0], best = nums[0];
    for (int i = 1; i < nums.length; i++) {
        int x = nums[i], a = hi * x, b = lo * x;
        hi = Math.max(x, Math.max(a, b)); // a negative x can turn lo into the new hi
        lo = Math.min(x, Math.min(a, b));
        best = Math.max(best, hi);
    }
    return best;
}`,
    python: `def maxProduct(self, nums: List[int]) -> int:
    hi = lo = best = nums[0]
    for x in nums[1:]:
        candidates = (x, hi * x, lo * x)
        hi, lo = max(candidates), min(candidates)
        best = max(best, hi)
    return best`,
    quiz: {
      q: "Why do we also track the minimum product?",
      options: [
        "A negative number can turn the smallest product into the largest",
        "To detect zeros in the array",
        "Because the answer can be negative",
        "To avoid integer overflow",
      ],
      answer: 0,
      why: "−2 × 3 = −6 looks terrible, but one more −4 makes it 24. The minimum is a future maximum waiting for a negative.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "find-minimum-in-rotated-sorted-array",
    lc: 153,
    title: "Find Minimum in Rotated Sorted Array",
    world: "arrays",
    difficulty: "Medium",
    pattern: "binary-search",
    emoji: "📚",
    statement:
      "A sorted array of distinct numbers was rotated some number of times. Find its minimum element in O(log n).",
    story:
      "Someone took a neatly sorted bookshelf and moved a chunk from the front to the back. The smallest book sits exactly where the order suddenly drops. Look at the middle book: if it's taller than the last book, the drop must be somewhere to its right.",
    insight: "Compare nums[mid] with nums[right]. If mid is bigger, the minimum is right of mid; otherwise it's at mid or to its left.",
    complexity: { time: "O(log n)", space: "O(1)", why: "The search range halves every step." },
    inputs: [{ name: "nums", kind: "intArray", minLen: 1, maxLen: 12, min: -50, max: 50 }],
    validate: ({ nums }) =>
      isRotatedSorted(nums) ? undefined : "This needs a rotated sorted array of distinct numbers, like [4, 5, 6, 1, 2, 3].",
    examples: [
      { input: { nums: [3, 4, 5, 1, 2] }, output: 1 },
      { input: { nums: [4, 5, 6, 7, 0, 1, 2] }, output: 0 },
      { input: { nums: [11, 13, 15, 17] }, output: 11 },
    ],
    trace({ nums }, T) {
      const n = nums.length;
      let l = 0;
      let r = n - 1;
      T.step("The smallest value sits where the order drops. Binary search for that drop.", [
        arr("nums", nums, { pointers: { L: l, R: r }, window: [l, r] }),
      ]);
      while (l < r) {
        const m = (l + r) >> 1;
        const goRight = nums[m] > nums[r];
        T.step(
          `mid = ${m}. Compare nums[mid] = **${nums[m]}** with nums[R] = **${nums[r]}**.`,
          [arr("nums", nums, { pointers: { L: l, M: m, R: r }, window: [l, r], tones: outside(l, r, n, { [m]: "active", [r]: "cmp" }) })],
          {
            ask: choose(
              `${nums[m]} vs ${nums[r]} — where is the minimum?`,
              ["Right of mid", "At mid or to its left"],
              goRight ? 0 : 1,
              "If mid is bigger than the right end, the drop has to be between them."
            ),
          }
        );
        if (goRight) {
          l = m + 1;
          T.step(`${nums[m]} > ${nums[r]}, so the drop is to the right. Move L to mid + 1 = ${l}.`, [
            arr("nums", nums, { pointers: { L: l, R: r }, window: [l, r], tones: outside(l, r, n) }),
          ]);
        } else {
          r = m;
          T.step(`${nums[m]} ≤ ${nums[r]}, so mid…R is already sorted and the minimum is at mid or left of it. Move R to mid = ${r}.`, [
            arr("nums", nums, { pointers: { L: l, R: r }, window: [l, r], tones: outside(l, r, n) }),
          ]);
        }
      }
      T.step(`L and R meet at index ${l}. The minimum is **${nums[l]}**.`, [
        arr("nums", nums, { pointers: { L: l }, tones: outside(l, l, n, { [l]: "found" }) }),
      ]);
      return nums[l];
    },
    java: `public int findMin(int[] nums) {
    int l = 0, r = nums.length - 1;
    while (l < r) {
        int m = l + (r - l) / 2;
        if (nums[m] > nums[r]) l = m + 1; // the drop is to the right of mid
        else r = m;                       // mid..r is sorted: min is at mid or left
    }
    return nums[l];
}`,
    python: `def findMin(self, nums: List[int]) -> int:
    l, r = 0, len(nums) - 1
    while l < r:
        m = (l + r) // 2
        if nums[m] > nums[r]:
            l = m + 1
        else:
            r = m
    return nums[l]`,
    quiz: {
      q: "Why compare mid with the right end instead of the left end?",
      options: [
        "nums[mid] > nums[right] reliably means the drop is to the right, even if the array isn't rotated at all",
        "It's faster to read the last element",
        "The left end is always the minimum",
        "It prevents integer overflow",
      ],
      answer: 0,
      why: "Comparing with the left end fails on an unrotated array: in [1, 2, 3], mid > left, yet the minimum is on the left.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "search-in-rotated-sorted-array",
    lc: 33,
    title: "Search in Rotated Sorted Array",
    world: "arrays",
    difficulty: "Medium",
    pattern: "binary-search",
    emoji: "🔎",
    statement:
      "A sorted array of distinct numbers was rotated. Return the index of target, or -1 if it isn't there, in O(log n).",
    story:
      "Cut a sorted deck of cards anywhere and look at the middle card. At least one side of it is still in perfect order. If your card belongs inside that orderly side, search there; otherwise it's on the messy side.",
    insight:
      "At every step one half is sorted. Check whether the target falls inside the sorted half's range, and throw away the other half.",
    complexity: { time: "O(log n)", space: "O(1)", why: "Each step discards half the range." },
    inputs: [
      { name: "nums", kind: "intArray", minLen: 1, maxLen: 12, min: -50, max: 50 },
      { name: "target", kind: "int", min: -50, max: 50 },
    ],
    validate: ({ nums }) =>
      isRotatedSorted(nums) ? undefined : "This needs a rotated sorted array of distinct numbers, like [4, 5, 6, 1, 2, 3].",
    examples: [
      { input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 }, output: 4 },
      { input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 3 }, output: -1 },
      { input: { nums: [1], target: 0 }, output: -1 },
    ],
    trace({ nums, target }, T) {
      const n = nums.length;
      let l = 0;
      let r = n - 1;
      T.step(`Look for **${target}**. Whatever mid we pick, at least one half will be perfectly sorted.`, [
        arr("nums", nums, { pointers: { L: l, R: r }, window: [l, r] }),
      ]);
      while (l <= r) {
        const m = (l + r) >> 1;
        if (nums[m] === target) {
          T.step(`nums[${m}] = ${nums[m]} — **found it at index ${m}**.`, [
            arr("nums", nums, { pointers: { L: l, M: m, R: r }, window: [l, r], tones: outside(l, r, n, { [m]: "found" }) }),
          ]);
          return m;
        }
        const leftSorted = nums[l] <= nums[m];
        const goLeft = leftSorted ? nums[l] <= target && target < nums[m] : !(nums[m] < target && target <= nums[r]);
        const sortedTones = leftSorted ? paint(l, m, "cmp") : paint(m, r, "cmp");
        T.step(
          `mid = ${m} (${nums[m]}). ` +
            (leftSorted ? `The left half ${nums[l]}…${nums[m]} is sorted.` : `The right half ${nums[m]}…${nums[r]} is sorted.`),
          [arr("nums", nums, { pointers: { L: l, M: m, R: r }, window: [l, r], tones: outside(l, r, n, { ...sortedTones, [m]: "active" }) })],
          {
            ask: choose(
              "Which half do we search next?",
              ["Left half", "Right half"],
              goLeft ? 0 : 1,
              "If the target fits inside the sorted half's range, go there. Otherwise it can only be in the other half."
            ),
          }
        );
        const inside = leftSorted ? goLeft : !goLeft;
        const range = leftSorted ? `${nums[l]} ≤ x < ${nums[m]}` : `${nums[m]} < x ≤ ${nums[r]}`;
        if (goLeft) r = m - 1;
        else l = m + 1;
        T.step(
          `${target} ${inside ? "fits" : "doesn't fit"} the sorted range (${range}), so search the **${goLeft ? "left" : "right"}** half.`,
          [arr("nums", nums, { pointers: { L: l, R: r }, window: l <= r ? [l, r] : undefined, tones: outside(l, r, n) })]
        );
      }
      T.step(`The window is empty. **${target} isn't in the array → -1**.`, [arr("nums", nums, { tones: paint(0, n - 1, "dim") })]);
      return -1;
    },
    java: `public int search(int[] nums, int target) {
    int l = 0, r = nums.length - 1;
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (nums[m] == target) return m;
        if (nums[l] <= nums[m]) {                         // left half is sorted
            if (nums[l] <= target && target < nums[m]) r = m - 1;
            else l = m + 1;
        } else {                                          // right half is sorted
            if (nums[m] < target && target <= nums[r]) l = m + 1;
            else r = m - 1;
        }
    }
    return -1;
}`,
    python: `def search(self, nums: List[int], target: int) -> int:
    l, r = 0, len(nums) - 1
    while l <= r:
        m = (l + r) // 2
        if nums[m] == target:
            return m
        if nums[l] <= nums[m]:              # left half is sorted
            if nums[l] <= target < nums[m]:
                r = m - 1
            else:
                l = m + 1
        else:                               # right half is sorted
            if nums[m] < target <= nums[r]:
                l = m + 1
            else:
                r = m - 1
    return -1`,
    quiz: {
      q: "What is always true at every step of this search?",
      options: [
        "At least one of the two halves is sorted",
        "Both halves are sorted",
        "The target is always in the left half",
        "mid is always the rotation point",
      ],
      answer: 0,
      why: "A single rotation creates at most one drop, and the drop can only be on one side of mid.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "3sum",
    lc: 15,
    title: "3Sum",
    world: "arrays",
    difficulty: "Medium",
    pattern: "two-pointers",
    emoji: "👯",
    statement: "Return all unique triplets [a, b, c] from the array such that a + b + c = 0.",
    story:
      "Line everyone up by height. Pin one friend in place, then send two more walking in from opposite ends of the line toward each other. Total too small? The left walker steps up to someone bigger. Too big? The right walker steps down.",
    insight:
      "Sort, then for each pinned number run a two-pointer search for a pair summing to its negative. Skip repeated values to avoid duplicate triplets.",
    complexity: { time: "O(n²)", space: "O(1) extra", why: "Sorting is O(n log n); each pin runs one O(n) two-pointer sweep." },
    unordered: true,
    inputs: [{ name: "nums", kind: "intArray", minLen: 3, maxLen: 10, min: -9, max: 9 }],
    examples: [
      { input: { nums: [-1, 0, 1, 2, -1, -4] }, output: [[-1, -1, 2], [-1, 0, 1]] },
      { input: { nums: [0, 1, 1] }, output: [] },
      { input: { nums: [0, 0, 0] }, output: [[0, 0, 0]] },
    ],
    trace({ nums }, T) {
      const a = [...nums].sort((x, y) => x - y);
      const n = a.length;
      const out = [];
      const found = () => text("triplets", formatValue(out));

      T.step("Sort first. Now equal numbers sit together, and the pointers know which direction makes a sum bigger.", [arr("sorted", a), found()]);

      for (let i = 0; i < n - 2; i += 1) {
        if (a[i] > 0) {
          T.step(`a[${i}] = ${a[i]} is positive. Three numbers ≥ ${a[i]} can't sum to 0, so stop.`, [
            arr("sorted", a, { pointers: { i }, tones: paint(i, n - 1, "dim") }),
            found(),
          ]);
          break;
        }
        if (i > 0 && a[i] === a[i - 1]) {
          T.step(`a[${i}] = ${a[i]} is the same as the last pin. It would find the same triplets, so skip it.`, [
            arr("sorted", a, { pointers: { i }, tones: { [i]: "dim" } }),
            found(),
          ]);
          continue;
        }
        let l = i + 1;
        let r = n - 1;
        T.step(`Pin **${a[i]}**. Now find two numbers after it that sum to **${-a[i]}**.`, [
          arr("sorted", a, { pointers: { i, L: l, R: r }, tones: { [i]: "active" } }),
          found(),
        ]);
        while (l < r) {
          const s = a[i] + a[l] + a[r];
          const move = s === 0 ? 2 : s < 0 ? 0 : 1;
          T.step(
            `${a[i]} + ${a[l]} + ${a[r]} = **${s}**.`,
            [arr("sorted", a, { pointers: { i, L: l, R: r }, tones: { [i]: "active", [l]: "cmp", [r]: "cmp" } }), found()],
            {
              ask: choose(
                `The sum is ${s}. What happens next?`,
                ["L moves right", "R moves left", "Record a triplet"],
                move,
                "Too small means we need something bigger, so L moves right. Too big means R moves left."
              ),
            }
          );
          if (s === 0) {
            out.push([a[i], a[l], a[r]]);
            T.step(`Zero! Record [${a[i]}, ${a[l]}, ${a[r]}], then move both pointers past any repeats.`, [
              arr("sorted", a, { pointers: { i, L: l, R: r }, tones: { [i]: "found", [l]: "found", [r]: "found" } }),
              found(),
            ]);
            l += 1;
            r -= 1;
            while (l < r && a[l] === a[l - 1]) l += 1;
            while (l < r && a[r] === a[r + 1]) r -= 1;
          } else if (s < 0) {
            l += 1;
          } else {
            r -= 1;
          }
        }
      }

      T.step(out.length ? `All done — **${out.length}** unique triplet${out.length === 1 ? "" : "s"}.` : "No triplet sums to zero.", [
        arr("sorted", a),
        found(),
      ]);
      return out;
    },
    java: `public List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> out = new ArrayList<>();
    for (int i = 0; i < nums.length - 2 && nums[i] <= 0; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue; // same pin, same answers
        int l = i + 1, r = nums.length - 1;
        while (l < r) {
            int sum = nums[i] + nums[l] + nums[r];
            if (sum < 0) l++;
            else if (sum > 0) r--;
            else {
                out.add(List.of(nums[i], nums[l], nums[r]));
                l++;
                r--;
                while (l < r && nums[l] == nums[l - 1]) l++;
                while (l < r && nums[r] == nums[r + 1]) r--;
            }
        }
    }
    return out;
}`,
    python: `def threeSum(self, nums: List[int]) -> List[List[int]]:
    nums.sort()
    out = []
    for i in range(len(nums) - 2):
        if nums[i] > 0:
            break
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                out.append([nums[i], nums[l], nums[r]])
                l, r = l + 1, r - 1
                while l < r and nums[l] == nums[l - 1]:
                    l += 1
                while l < r and nums[r] == nums[r + 1]:
                    r -= 1
    return out`,
    quiz: {
      q: "Why sort the array first?",
      options: [
        "So the pointers know which way makes the sum bigger, and duplicates sit side by side",
        "Because the output must be sorted",
        "Sorting makes the whole thing O(n)",
        "Hash sets only work on sorted input",
      ],
      answer: 0,
      why: "Sorting unlocks both tricks at once: directional two pointers, and skipping duplicates by comparing neighbours.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "container-with-most-water",
    lc: 11,
    title: "Container With Most Water",
    world: "arrays",
    difficulty: "Medium",
    pattern: "two-pointers",
    emoji: "🪣",
    statement:
      "Given wall heights, pick two walls that, with the ground, hold the most water. Return that amount of water.",
    story:
      "Two walls hold water, and the shorter wall decides how high the water goes. Start with the widest pair. Moving the taller wall inward can only make the container narrower without raising the water, so always move the shorter one.",
    insight: "Start at both ends. Water = min(height) × width. Move the pointer at the shorter wall, because it's the bottleneck.",
    complexity: { time: "O(n)", space: "O(1)", why: "Each step moves one pointer inward." },
    inputs: [{ name: "height", kind: "intArray", minLen: 2, maxLen: 12, min: 0, max: 20 }],
    examples: [
      { input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] }, output: 49 },
      { input: { height: [1, 1] }, output: 1 },
      { input: { height: [4, 3, 2, 1, 4] }, output: 16 },
    ],
    trace({ height }, T) {
      let l = 0;
      let r = height.length - 1;
      let best = 0;
      let bl = 0;
      let br = r;
      T.step("Start with the widest container: one wall at each end.", [
        arr("height", height, { bars: true, pointers: { L: l, R: r }, tones: { [l]: "active", [r]: "active" } }),
      ], { vars: { best } });

      while (l < r) {
        const h = Math.min(height[l], height[r]);
        const area = h * (r - l);
        const improved = area > best;
        if (improved) {
          best = area;
          bl = l;
          br = r;
        }
        const tie = height[l] === height[r];
        T.step(
          `Walls ${height[l]} and ${height[r]}, width ${r - l}. Water = min(${height[l]}, ${height[r]}) × ${r - l} = **${area}**.` +
            (improved ? " New best!" : ""),
          [arr("height", height, { bars: true, pointers: { L: l, R: r }, water: { l, r, h }, tones: { [l]: "active", [r]: "active" } })],
          {
            vars: { water: area, best },
            ask: tie
              ? undefined
              : choose(
                  "Which wall should move inward?",
                  ["Left wall", "Right wall"],
                  height[l] < height[r] ? 0 : 1,
                  "The shorter wall caps the water level. Moving the taller one can only lose width."
                ),
          }
        );
        if (height[l] < height[r]) l += 1;
        else r -= 1;
      }

      T.step(`The walls have met. Most water: **${best}**, between index ${bl} and ${br}.`, [
        arr("height", height, {
          bars: true,
          water: { l: bl, r: br, h: Math.min(height[bl], height[br]) },
          tones: { [bl]: "found", [br]: "found" },
        }),
      ], { vars: { best } });
      return best;
    },
    java: `public int maxArea(int[] height) {
    int l = 0, r = height.length - 1, best = 0;
    while (l < r) {
        int water = Math.min(height[l], height[r]) * (r - l);
        best = Math.max(best, water);
        if (height[l] < height[r]) l++; // the shorter wall is the bottleneck
        else r--;
    }
    return best;
}`,
    python: `def maxArea(self, height: List[int]) -> int:
    l, r, best = 0, len(height) - 1, 0
    while l < r:
        best = max(best, min(height[l], height[r]) * (r - l))
        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
    return best`,
    quiz: {
      q: "Why is it safe to move the pointer at the shorter wall?",
      options: [
        "Any container using that shorter wall with a closer partner is narrower and no taller, so it can't win",
        "The taller wall is always part of the answer",
        "It guarantees the loop ends",
        "Shorter walls always hold more water",
      ],
      answer: 0,
      why: "The shorter wall has already been paired with the widest partner it will ever get. Every other pairing for it is worse, so discard it.",
    },
  },
];
