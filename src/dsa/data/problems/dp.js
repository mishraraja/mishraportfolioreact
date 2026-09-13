import { arr, grid, set, yesNo, choose, pickNumber, paint, outside } from "../../engine/scene";

const key = (r, c) => r + "," + c;
const LOWER = /^[a-z]+$/;
const lowerHint = "Use lowercase letters a–z only.";

export const dpProblems = [
  /* ------------------------------------------------------------------ */
  {
    slug: "climbing-stairs",
    lc: 70,
    title: "Climbing Stairs",
    world: "dp",
    difficulty: "Easy",
    pattern: "dp-1d",
    emoji: "🪜",
    statement: "You can climb 1 or 2 steps at a time. How many distinct ways are there to climb n steps?",
    story:
      "To be standing on step 10, your very last move was either a small hop from step 9 or a big jump from step 8. So the ways to reach step 10 are just the ways to reach 9 plus the ways to reach 8 — answers you already worked out.",
    insight: "ways(i) = ways(i − 1) + ways(i − 2), with ways(0) = ways(1) = 1. It's Fibonacci, and only the last two values are ever needed.",
    complexity: { time: "O(n)", space: "O(1)", why: "One pass keeping two numbers." },
    inputs: [{ name: "n", kind: "int", min: 1, max: 20 }],
    examples: [
      { input: { n: 2 }, output: 2 },
      { input: { n: 3 }, output: 3 },
      { input: { n: 5 }, output: 8 },
    ],
    trace({ n }, T) {
      const ways = new Array(n + 1).fill(null);
      ways[0] = 1;
      ways[1] = 1;
      T.step(
        "You arrive on step i by a hop from i − 1 or a jump from i − 2, so ways(i) = ways(i − 1) + ways(i − 2). Standing at the bottom is 1 way, and step 1 has exactly 1 way.",
        [arr("ways", ways, { tones: { 0: "found", 1: "found" } })],
        { ask: n >= 2 ? pickNumber("How many ways are there to reach step 2?", 2) : undefined }
      );
      for (let i = 2; i <= n; i += 1) {
        ways[i] = ways[i - 1] + ways[i - 2];
        T.step(`ways(${i}) = ways(${i - 1}) + ways(${i - 2}) = ${ways[i - 1]} + ${ways[i - 2]} = **${ways[i]}**.`, [
          arr("ways", ways, { pointers: { i }, tones: { ...paint(0, i - 3, "visited"), [i - 2]: "cmp", [i - 1]: "cmp", [i]: "good" } }),
        ], { ask: i < n ? pickNumber(`What will ways(${i + 1}) be?`, ways[i] + ways[i - 1]) : undefined });
      }
      T.step(`There are **${ways[n]}** ways to climb ${n} step${n === 1 ? "" : "s"}. Recognise those numbers? It's the Fibonacci sequence.`, [
        arr("ways", ways, { tones: { [n]: "found" } }),
      ]);
      return ways[n];
    },
    java: `public int climbStairs(int n) {
    int twoBack = 1, oneBack = 1;      // ways(0), ways(1)
    for (int i = 2; i <= n; i++) {
        int here = oneBack + twoBack;  // arrive by a hop or by a jump
        twoBack = oneBack;
        oneBack = here;
    }
    return oneBack;
}`,
    python: `def climbStairs(self, n: int) -> int:
    two_back, one_back = 1, 1
    for _ in range(2, n + 1):
        two_back, one_back = one_back, one_back + two_back
    return one_back`,
    quiz: {
      q: "Why is ways(0) = 1?",
      options: [
        "There's exactly one way to be at the bottom — do nothing — and it makes ways(2) = 2 come out right",
        "It's an arbitrary choice",
        "Step 0 is a real step you climb",
        "To avoid dividing by zero",
      ],
      answer: 0,
      why: "Base cases aren't guesses: pick them so the recurrence gives correct answers for the first real inputs.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "coin-change",
    lc: 322,
    title: "Coin Change",
    world: "dp",
    difficulty: "Medium",
    pattern: "dp-1d",
    emoji: "🪙",
    statement: "Given coin denominations and an amount, return the fewest coins needed to make that amount, or -1 if it's impossible. Each coin can be used any number of times.",
    story:
      "You're a cashier who hates handing out lots of coins. For every amount from 1 upward, ask: if this coin were the last one I handed over, how few coins would the rest need? You already solved that smaller amount a moment ago.",
    insight: "fewest(a) = 1 + min over coins c ≤ a of fewest(a − c), with fewest(0) = 0. Amounts nothing can make stay at infinity.",
    complexity: { time: "O(amount · coins)", space: "O(amount)", why: "Each amount tries every coin once." },
    inputs: [
      { name: "coins", kind: "intArray", minLen: 1, maxLen: 4, min: 1, max: 12 },
      { name: "amount", kind: "int", min: 0, max: 24 },
    ],
    validate: ({ coins }) => (new Set(coins).size === coins.length ? undefined : "Each coin value should appear once."),
    examples: [
      { input: { coins: [1, 2, 5], amount: 11 }, output: 3 },
      { input: { coins: [2], amount: 3 }, output: -1 },
      { input: { coins: [1], amount: 0 }, output: 0 },
    ],
    trace({ coins, amount }, T) {
      const full = new Array(amount + 1).fill(Infinity);
      full[0] = 0;
      for (let a = 1; a <= amount; a += 1) {
        coins.forEach((c) => {
          if (c <= a) full[a] = Math.min(full[a], full[a - c] + 1);
        });
      }

      const fewest = new Array(amount + 1).fill(null);
      fewest[0] = 0;
      T.step(
        "fewest(a) = the fewest coins that make amount a, and fewest(0) = 0. For every other amount, try each coin as the LAST coin: 1 + fewest(a − coin). Amounts nothing can make stay ∞.",
        [arr("fewest", fewest, { tones: { 0: "found" } }), arr("coins", coins)],
        { ask: amount >= 1 && Number.isFinite(full[1]) ? pickNumber("What will fewest(1) be?", full[1]) : undefined }
      );

      for (let a = 1; a <= amount; a += 1) {
        let best = Infinity;
        let bestCoin = null;
        const tones = {};
        const tries = [];
        coins.forEach((c) => {
          if (c > a) return;
          tones[a - c] = "cmp";
          const candidate = fewest[a - c] + 1;
          tries.push(`${c} → 1 + fewest(${a - c}) = ${Number.isFinite(candidate) ? candidate : "∞"}`);
          if (candidate < best) {
            best = candidate;
            bestCoin = c;
          }
        });
        fewest[a] = best;
        if (bestCoin !== null && Number.isFinite(best)) tones[a - bestCoin] = "found";
        tones[a] = Number.isFinite(best) ? "good" : "bad";

        let say;
        if (!tries.length) say = `Amount ${a}: every coin is bigger than ${a}, so it's impossible (∞).`;
        else if (Number.isFinite(best)) say = `Amount ${a}: ${tries.join("; ")}. Best: **${best}** coin${best === 1 ? "" : "s"}, finishing with a ${bestCoin}.`;
        else say = `Amount ${a}: ${tries.join("; ")}. Every option is ∞ — this amount can't be made.`;

        const next = a + 1;
        T.step(
          say,
          [
            arr("fewest", fewest, { pointers: { a }, tones }),
            arr("coins", coins, { tones: bestCoin !== null && Number.isFinite(best) ? { [coins.indexOf(bestCoin)]: "good" } : {} }),
          ],
          { ask: next <= amount && Number.isFinite(full[next]) ? pickNumber(`What will fewest(${next}) be?`, full[next]) : undefined }
        );
      }

      const answer = Number.isFinite(fewest[amount]) ? fewest[amount] : -1;
      const used = [];
      if (answer > 0) {
        let a = amount;
        while (a > 0) {
          const remaining = a;
          const c = coins.find((coin) => coin <= remaining && fewest[remaining - coin] + 1 === fewest[remaining]);
          used.push(c);
          a -= c;
        }
      }
      T.step(
        answer === -1
          ? `${amount} can't be made from these coins. **-1**.`
          : answer === 0
          ? "Amount 0 needs no coins at all: **0**."
          : `Fewest coins for ${amount}: **${answer}** (${used.join(" + ")}).`,
        [arr("fewest", fewest, { tones: { [amount]: answer === -1 ? "bad" : "found" } }), arr("coins", coins)]
      );
      return answer;
    },
    java: `public int coinChange(int[] coins, int amount) {
    int[] fewest = new int[amount + 1];
    Arrays.fill(fewest, amount + 1);           // amount + 1 plays the role of "infinity"
    fewest[0] = 0;
    for (int a = 1; a <= amount; a++) {
        for (int c : coins) {
            if (c <= a) fewest[a] = Math.min(fewest[a], fewest[a - c] + 1); // c as the last coin
        }
    }
    return fewest[amount] > amount ? -1 : fewest[amount];
}`,
    python: `def coinChange(self, coins: List[int], amount: int) -> int:
    fewest = [0] + [float("inf")] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                fewest[a] = min(fewest[a], fewest[a - c] + 1)
    return fewest[amount] if fewest[amount] != float("inf") else -1`,
    quiz: {
      q: "Why doesn't a greedy “always take the biggest coin” strategy work?",
      options: [
        "With coins [1, 3, 4] and amount 6, greedy takes 4 + 1 + 1, but 3 + 3 uses fewer coins",
        "It does work for every set of coins",
        "Greedy is too slow",
        "Greedy can't handle an amount of 0",
      ],
      answer: 0,
      why: "Greedy happens to work for real-world currencies, but not in general. DP checks every option, so it can't be fooled.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "longest-increasing-subsequence",
    lc: 300,
    title: "Longest Increasing Subsequence",
    world: "dp",
    difficulty: "Medium",
    pattern: "dp-1d",
    emoji: "📶",
    statement: "Return the length of the longest strictly increasing subsequence. The elements don't have to be next to each other.",
    story:
      "Kids stand in a line for a photo, and you want the longest chain of kids, in line order, where each is taller than the one before. For each kid, look back at every shorter kid and ask: whose chain could I join to make mine as long as possible?",
    insight: "lis(i) = longest increasing subsequence ending at i = 1 + max lis(j) over earlier j with nums[j] < nums[i]. The answer is the largest lis(i).",
    complexity: { time: "O(n²)", space: "O(n)", why: "Each element looks back at every earlier one." },
    inputs: [{ name: "nums", kind: "intArray", minLen: 1, maxLen: 9, min: -99, max: 999 }],
    examples: [
      { input: { nums: [10, 9, 2, 5, 3, 7, 101, 18] }, output: 4 },
      { input: { nums: [0, 1, 0, 3, 2, 3] }, output: 4 },
      { input: { nums: [7, 7, 7, 7] }, output: 1 },
    ],
    trace({ nums }, T) {
      const n = nums.length;
      const full = nums.map(() => 1);
      for (let i = 0; i < n; i += 1) {
        for (let j = 0; j < i; j += 1) if (nums[j] < nums[i]) full[i] = Math.max(full[i], full[j] + 1);
      }

      const lis = new Array(n).fill(null);
      const prev = new Array(n).fill(-1);
      T.step(
        "lis(i) = the longest increasing subsequence that ENDS at index i. On its own, every number is a chain of 1. It can also extend the chain of any earlier, smaller number.",
        [arr("nums", nums), arr("lis ending here", lis)],
        { ask: pickNumber(`What is lis(0), the chain ending at ${nums[0]}?`, 1) }
      );

      for (let i = 0; i < n; i += 1) {
        lis[i] = 1;
        const smaller = [];
        for (let j = 0; j < i; j += 1) {
          if (nums[j] >= nums[i]) continue;
          smaller.push(j);
          if (lis[j] + 1 > lis[i]) {
            lis[i] = lis[j] + 1;
            prev[i] = j;
          }
        }
        const cmpTones = Object.fromEntries(smaller.map((j) => [j, "cmp"]));
        if (prev[i] >= 0) cmpTones[prev[i]] = "found";

        let say;
        if (i === 0) say = `${nums[0]} is first, so its chain is just itself: **1**.`;
        else if (!smaller.length) say = `Nothing before ${nums[i]} is smaller, so it starts a fresh chain: **1**.`;
        else {
          say =
            `${nums[i]} can extend the chains ending at ${smaller.map((j) => `${nums[j]} (${lis[j]})`).join(", ")}. ` +
            `The longest is ${nums[prev[i]]}'s, so lis = ${lis[prev[i]]} + 1 = **${lis[i]}**.`;
        }
        T.step(
          say,
          [arr("nums", nums, { pointers: { i }, tones: { ...cmpTones, [i]: "active" } }), arr("lis ending here", lis, { tones: { ...cmpTones, [i]: "good" } })],
          { ask: i + 1 < n ? pickNumber(`What will lis be at index ${i + 1} (value ${nums[i + 1]})?`, full[i + 1]) : undefined }
        );
      }

      let end = 0;
      lis.forEach((v, i) => {
        if (v > lis[end]) end = i;
      });
      const path = [];
      for (let k = end; k >= 0; k = prev[k]) path.unshift(k);
      T.step(`The longest chain has length **${lis[end]}**: ${path.map((k) => nums[k]).join(" → ")}.`, [
        arr("nums", nums, { tones: Object.fromEntries(path.map((k) => [k, "found"])) }),
        arr("lis ending here", lis, { tones: { [end]: "found" } }),
      ]);
      return lis[end];
    },
    java: `public int lengthOfLIS(int[] nums) {
    int[] lis = new int[nums.length];      // lis[i]: longest increasing chain ending at i
    int best = 0;
    for (int i = 0; i < nums.length; i++) {
        lis[i] = 1;                        // nums[i] on its own
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) lis[i] = Math.max(lis[i], lis[j] + 1); // extend a smaller chain
        }
        best = Math.max(best, lis[i]);
    }
    return best;
}`,
    python: `def lengthOfLIS(self, nums: List[int]) -> int:
    lis = [1] * len(nums)
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                lis[i] = max(lis[i], lis[j] + 1)
    return max(lis)`,
    levelUp: "Patience sorting gets O(n log n): keep the smallest possible tail for each chain length, and binary-search where each new number belongs.",
    quiz: {
      q: "What does lis[i] represent?",
      options: [
        "The longest increasing subsequence that ends exactly at index i",
        "The longest increasing subsequence anywhere in the array",
        "How many smaller elements come before i",
        "The length of the array up to i",
      ],
      answer: 0,
      why: "Pinning the END makes the subproblem composable: you can only extend a chain if you know its last value.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "longest-common-subsequence",
    lc: 1143,
    title: "Longest Common Subsequence",
    world: "dp",
    difficulty: "Medium",
    pattern: "dp-2d",
    emoji: "🧵",
    statement: "Return the length of the longest subsequence common to two strings. A subsequence keeps order but may skip characters.",
    story:
      "Two friends each describe their day as a string of events. The longest common subsequence is the longest story they both lived through in the same order, skipping anything only one of them did.",
    insight: "dp[i][j] = LCS of the first i letters and the first j letters. On a match, dp[i−1][j−1] + 1; otherwise max(dp[i−1][j], dp[i][j−1]).",
    complexity: { time: "O(m · n)", space: "O(m · n)", why: "One constant-time cell per pair of prefixes." },
    inputs: [
      { name: "text1", kind: "string", minLen: 1, maxLen: 7, pattern: LOWER, patternHint: lowerHint },
      { name: "text2", kind: "string", minLen: 1, maxLen: 7, pattern: LOWER, patternHint: lowerHint },
    ],
    examples: [
      { input: { text1: "abcde", text2: "ace" }, output: 3 },
      { input: { text1: "abc", text2: "abc" }, output: 3 },
      { input: { text1: "abc", text2: "def" }, output: 0 },
    ],
    trace({ text1: a, text2: b }, T) {
      const m = a.length;
      const n = b.length;
      const full = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 1; i <= m; i += 1) {
        for (let j = 1; j <= n; j += 1) {
          full[i][j] = a[i - 1] === b[j - 1] ? full[i - 1][j - 1] + 1 : Math.max(full[i - 1][j], full[i][j - 1]);
        }
      }

      const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 || j === 0 ? 0 : null)));
      const labels = { rowLabels: ["∅", ...a], colLabels: ["∅", ...b] };
      T.step(
        `Cell (i, j) holds the LCS length of the first i letters of "${a}" and the first j letters of "${b}". Row ∅ and column ∅ are 0: nothing matches an empty string.`,
        [grid("dp", dp, labels)],
        { ask: pickNumber("What goes in cell (1, 1)?", full[1][1]) }
      );

      for (let i = 1; i <= m; i += 1) {
        for (let j = 1; j <= n; j += 1) {
          const match = a[i - 1] === b[j - 1];
          dp[i][j] = full[i][j];
          const tones = match
            ? { [key(i - 1, j - 1)]: "cmp", [key(i, j)]: "good" }
            : { [key(i - 1, j)]: "cmp", [key(i, j - 1)]: "cmp", [key(i, j)]: "active" };
          const ni = j < n ? i : i + 1;
          const nj = j < n ? j + 1 : 1;
          T.step(
            match
              ? `'${a[i - 1]}' = '${b[j - 1]}' — a match! Both strings step forward: diagonal ${dp[i - 1][j - 1]} + 1 = **${dp[i][j]}**.`
              : `'${a[i - 1]}' ≠ '${b[j - 1]}'. Drop a letter from one side: max(above ${dp[i - 1][j]}, left ${dp[i][j - 1]}) = **${dp[i][j]}**.`,
            [grid("dp", dp, { ...labels, tones, cursor: [i, j] })],
            { ask: ni <= m ? pickNumber(`What goes in cell (${ni}, ${nj})?`, full[ni][nj]) : undefined }
          );
        }
      }

      const path = {};
      let common = "";
      let i = m;
      let j = n;
      while (i > 0 && j > 0) {
        if (a[i - 1] === b[j - 1]) {
          path[key(i, j)] = "found";
          common = a[i - 1] + common;
          i -= 1;
          j -= 1;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
          i -= 1;
        } else {
          j -= 1;
        }
      }
      T.step(`The bottom-right cell holds **${dp[m][n]}**` + (common ? ` — for example "${common}", traced back along the gold cells.` : ". There's nothing in common."), [
        grid("dp", dp, { ...labels, tones: { ...path, [key(m, n)]: "found" } }),
      ]);
      return dp[m][n];
    },
    java: `public int longestCommonSubsequence(String a, String b) {
    int[][] dp = new int[a.length() + 1][b.length() + 1]; // row 0 and column 0 stay 0
    for (int i = 1; i <= a.length(); i++)
        for (int j = 1; j <= b.length(); j++)
            dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                ? dp[i - 1][j - 1] + 1                         // same letter: both step forward
                : Math.max(dp[i - 1][j], dp[i][j - 1]);        // drop a letter from one side
    return dp[a.length()][b.length()];
}`,
    python: `def longestCommonSubsequence(self, a: str, b: str) -> int:
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[-1][-1]`,
    quiz: {
      q: "When the letters differ, why take max(above, left)?",
      options: [
        "At least one of the two letters isn't part of the LCS here, so try dropping each and keep the better",
        "Because the diagonal is always smaller",
        "It counts the mismatches",
        "To move diagonally faster",
      ],
      answer: 0,
      why: "Above drops the letter from the first string; left drops it from the second. One of those must be safe.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "word-break",
    lc: 139,
    title: "Word Break",
    world: "dp",
    difficulty: "Medium",
    pattern: "dp-1d",
    emoji: "⌨️",
    statement: "Decide whether a string can be split into a sequence of one or more dictionary words (words may be reused).",
    story:
      "A cat walked across your keyboard and deleted every space. Can you put them back so every chunk is a real word? Work left to right: a prefix is good if a shorter good prefix plus one dictionary word makes it.",
    insight: "ok[i] = true if some ok[j] is true and s[j..i) is a dictionary word. ok[0] = true; the answer is ok[n].",
    complexity: { time: "O(n²)", space: "O(n)", why: "Each end position checks every start (substring checks aside)." },
    inputs: [
      { name: "s", kind: "string", minLen: 1, maxLen: 14, pattern: LOWER, patternHint: lowerHint },
      { name: "wordDict", kind: "stringArray", minLen: 1, maxLen: 6, maxItemLen: 8, pattern: LOWER, patternHint: lowerHint },
    ],
    examples: [
      { input: { s: "leetcode", wordDict: ["leet", "code"] }, output: true },
      { input: { s: "applepenapple", wordDict: ["apple", "pen"] }, output: true },
      { input: { s: "catsandog", wordDict: ["cats", "dog", "sand", "and", "cat"] }, output: false },
    ],
    trace({ s, wordDict }, T) {
      const words = new Set(wordDict);
      const n = s.length;
      const chars = s.split("");
      const full = new Array(n + 1).fill(false);
      full[0] = true;
      for (let i = 1; i <= n; i += 1) {
        for (let j = 0; j < i; j += 1) {
          if (full[j] && words.has(s.slice(j, i))) {
            full[i] = true;
            break;
          }
        }
      }

      const ok = new Array(n + 1).fill(null);
      const from = new Array(n + 1).fill(-1);
      ok[0] = true;
      T.step(
        "ok(i) = can the first i letters be split into dictionary words? ok(0) = true, since the empty prefix needs no words. ok(i) is true when some ok(j) is true AND s[j…i) is a word.",
        [arr("s", chars), arr("ok(i)", ok, { tones: { 0: "found" } }), set("dictionary", wordDict)],
        { ask: yesNo("Will ok(1) be true?", full[1]) }
      );

      for (let i = 1; i <= n; i += 1) {
        ok[i] = false;
        for (let j = 0; j < i; j += 1) {
          if (ok[j] && words.has(s.slice(j, i))) {
            ok[i] = true;
            from[i] = j;
            break;
          }
        }
        const j = from[i];
        const piece = ok[i] ? s.slice(j, i) : null;
        T.step(
          ok[i]
            ? `ok(${i}): "${s.slice(0, i)}" works — ok(${j}) is true and "${piece}" is in the dictionary.`
            : `ok(${i}): no split of "${s.slice(0, i)}" ends with a dictionary word.`,
          [
            arr("s", chars, { window: ok[i] ? [j, i - 1] : undefined, tones: ok[i] ? paint(j, i - 1, "good") : paint(0, i - 1, "visited") }),
            arr("ok(i)", ok, { pointers: { i }, tones: { ...(ok[i] ? { [j]: "cmp" } : {}), [i]: ok[i] ? "good" : "bad" } }),
            set("dictionary", wordDict, { hot: piece || undefined, tone: piece ? "good" : undefined }),
          ],
          { ask: i < n ? yesNo(`Will ok(${i + 1}) be true?`, full[i + 1]) : undefined }
        );
      }

      const parts = [];
      if (ok[n]) {
        for (let k = n; k > 0; k = from[k]) parts.unshift(s.slice(from[k], k));
      }
      T.step(
        ok[n] ? `ok(${n}) is true: **"${s}" = ${parts.map((p) => `"${p}"`).join(" + ")}**.` : `ok(${n}) is false: **there's no way to split "${s}"**.`,
        [arr("s", chars), arr("ok(i)", ok, { tones: { [n]: ok[n] ? "found" : "bad" } }), set("dictionary", wordDict)]
      );
      return ok[n];
    },
    java: `public boolean wordBreak(String s, List<String> wordDict) {
    Set<String> words = new HashSet<>(wordDict);
    boolean[] ok = new boolean[s.length() + 1]; // ok[i]: s[0..i) splits into words
    ok[0] = true;                               // the empty prefix always works
    for (int i = 1; i <= s.length(); i++)
        for (int j = 0; j < i; j++)
            if (ok[j] && words.contains(s.substring(j, i))) {
                ok[i] = true;                   // a good prefix + one dictionary word
                break;
            }
    return ok[s.length()];
}`,
    python: `def wordBreak(self, s: str, wordDict: List[str]) -> bool:
    words = set(wordDict)
    ok = [True] + [False] * len(s)
    for i in range(1, len(s) + 1):
        ok[i] = any(ok[j] and s[j:i] in words for j in range(i))
    return ok[-1]`,
    quiz: {
      q: "Why is ok[0] = true?",
      options: [
        "The empty prefix needs no words, which lets the first real word start a valid split",
        "Java boolean arrays start as true",
        "The first letter is always a word",
        "It marks the end of the string",
      ],
      answer: 0,
      why: "Without it, no word at the start of the string could ever be accepted, because it would need a valid prefix before it.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "combination-sum-iv",
    lc: 377,
    title: "Combination Sum IV",
    world: "dp",
    difficulty: "Medium",
    pattern: "dp-1d",
    emoji: "🎵",
    statement:
      "Given distinct positive integers and a target, return how many ordered sequences of those numbers (repeats allowed) add up to the target.",
    story:
      "You're building a playlist that must last exactly target minutes from songs of a few lengths — repeats allowed, and order matters. Pick the last song; whatever plays before it is a shorter playlist you've already counted.",
    insight: "ways(t) = sum over each number x ≤ t of ways(t − x), with ways(0) = 1. Looping over t on the outside counts every order separately.",
    complexity: { time: "O(target · n)", space: "O(target)", why: "Each total tries every number once." },
    inputs: [
      { name: "nums", kind: "intArray", minLen: 1, maxLen: 4, min: 1, max: 10 },
      { name: "target", kind: "int", min: 1, max: 12 },
    ],
    validate: ({ nums }) => (new Set(nums).size === nums.length ? undefined : "The numbers must be distinct."),
    examples: [
      { input: { nums: [1, 2, 3], target: 4 }, output: 7 },
      { input: { nums: [9], target: 3 }, output: 0 },
      { input: { nums: [2, 1], target: 3 }, output: 3 },
    ],
    trace({ nums, target }, T) {
      const full = new Array(target + 1).fill(0);
      full[0] = 1;
      for (let t = 1; t <= target; t += 1) {
        nums.forEach((x) => {
          if (x <= t) full[t] += full[t - x];
        });
      }

      const ways = new Array(target + 1).fill(null);
      ways[0] = 1;
      T.step("ways(t) = ordered playlists lasting exactly t. ways(0) = 1: the empty playlist. For any t, choose the LAST song x; the rest is a playlist of t − x.", [
        arr("ways", ways, { tones: { 0: "found" } }),
        arr("nums", nums),
      ], { ask: pickNumber("What will ways(1) be?", full[1]) });

      for (let t = 1; t <= target; t += 1) {
        const parts = nums.filter((x) => x <= t).map((x) => ({ x, w: ways[t - x] }));
        ways[t] = parts.reduce((sum, p) => sum + p.w, 0);
        T.step(
          parts.length
            ? `ways(${t}): the last song could be ${parts.map((p) => `${p.x} (leaving ${t - p.x}: ${p.w} way${p.w === 1 ? "" : "s"})`).join(", ")}. Total **${ways[t]}**.`
            : `ways(${t}): every song is longer than ${t}, so **0** ways.`,
          [
            arr("ways", ways, { pointers: { t }, tones: { ...Object.fromEntries(parts.map((p) => [t - p.x, "cmp"])), [t]: ways[t] ? "good" : "bad" } }),
            arr("nums", nums, { tones: Object.fromEntries(nums.map((x, i) => [i, x <= t ? "good" : "dim"])) }),
          ],
          { ask: t < target ? pickNumber(`What will ways(${t + 1}) be?`, full[t + 1]) : undefined }
        );
      }

      T.step(`There are **${ways[target]}** ordered sequences that add up to ${target}.`, [arr("ways", ways, { tones: { [target]: "found" } }), arr("nums", nums)]);
      return ways[target];
    },
    java: `public int combinationSum4(int[] nums, int target) {
    int[] ways = new int[target + 1];   // ways[t]: ordered sequences summing to t
    ways[0] = 1;                        // the empty sequence
    for (int t = 1; t <= target; t++)
        for (int x : nums)
            if (x <= t) ways[t] += ways[t - x]; // x is the LAST number in the sequence
    return ways[target];
}`,
    python: `def combinationSum4(self, nums: List[int], target: int) -> int:
    ways = [1] + [0] * target
    for t in range(1, target + 1):
        ways[t] = sum(ways[t - x] for x in nums if x <= t)
    return ways[target]`,
    levelUp: "Swap the loops (numbers outside, totals inside) and the same code counts unordered combinations instead — that's Coin Change II (LC 518).",
    quiz: {
      q: "Why does putting the total t on the outer loop count ORDERED sequences?",
      options: [
        "Every total considers every number as its last one, so (1, 2) and (2, 1) are counted separately",
        "Because nums is sorted",
        "It actually counts unordered combinations",
        "Loop order makes no difference",
      ],
      answer: 0,
      why: "With numbers on the outside, each number is only ever placed after the ones before it, which counts each combination once.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "house-robber",
    lc: 198,
    title: "House Robber",
    world: "dp",
    difficulty: "Medium",
    pattern: "dp-1d",
    emoji: "🦝",
    statement: "Each house on a street holds some money, and robbing two adjacent houses trips the alarm. Return the most money you can rob.",
    story:
      "A polite raccoon raids bins down a street, but raiding two neighbours in a row wakes the dogs. At each bin: raid it and add the best haul from two bins back, or skip it and keep the best haul so far.",
    insight: "best(i) = max(best(i − 1), nums[i] + best(i − 2)). Only the last two values are ever needed.",
    complexity: { time: "O(n)", space: "O(1)", why: "One pass with two running values." },
    inputs: [{ name: "nums", kind: "intArray", minLen: 1, maxLen: 9, min: 0, max: 99 }],
    examples: [
      { input: { nums: [1, 2, 3, 1] }, output: 4 },
      { input: { nums: [2, 7, 9, 3, 1] }, output: 12 },
      { input: { nums: [2, 1, 1, 2] }, output: 4 },
    ],
    trace({ nums }, T) {
      const n = nums.length;
      const best = new Array(n).fill(null);
      const draw = (houseTones, bestTones, i) => [
        arr("houses", nums, { bars: true, tones: houseTones, pointers: i !== undefined ? { i } : {} }),
        arr("best haul up to here", best, { tones: bestTones }),
      ];

      best[0] = nums[0];
      T.step(`best(i) = the most loot from houses 0…i. With one house, just rob it: best(0) = **${nums[0]}**.`, draw({ 0: "good" }, { 0: "good" }, 0));
      if (n > 1) {
        best[1] = Math.max(nums[0], nums[1]);
        T.step(`Two neighbours — you can only rob one: best(1) = max(${nums[0]}, ${nums[1]}) = **${best[1]}**.`, draw({ 0: "cmp", 1: "cmp" }, { 1: "good" }, 1));
      }

      for (let i = 2; i < n; i += 1) {
        const rob = nums[i] + best[i - 2];
        const skip = best[i - 1];
        T.step(
          `House ${i} holds ${nums[i]}. Rob it: ${nums[i]} + best(${i - 2}) = ${rob}. Skip it: best(${i - 1}) = ${skip}.`,
          draw({ [i]: "active" }, { [i - 2]: "cmp", [i - 1]: "cmp" }, i),
          { ask: rob === skip ? undefined : choose(`Rob house ${i} or skip it?`, ["Rob it", "Skip it"], rob > skip ? 0 : 1, "Take whichever leaves you with more loot.") }
        );
        best[i] = Math.max(rob, skip);
        T.step(
          rob > skip ? `Rob it! best(${i}) = **${best[i]}**.` : rob === skip ? `Both give ${rob}, so best(${i}) = **${best[i]}** either way.` : `Skip it. best(${i}) = **${best[i]}**.`,
          draw({ [i]: rob > skip ? "good" : "dim" }, { [i]: "good" }, i)
        );
      }

      const robbed = [];
      for (let i = n - 1; i >= 0; ) {
        if (i === 0 || best[i] !== best[i - 1]) {
          robbed.push(i);
          i -= 2;
        } else {
          i -= 1;
        }
      }
      T.step(`The best haul is **${best[n - 1]}**, robbing houses ${robbed.reverse().join(", ")}.`, draw(Object.fromEntries(robbed.map((i) => [i, "found"])), { [n - 1]: "found" }));
      return best[n - 1];
    },
    java: `public int rob(int[] nums) {
    int twoBack = 0, oneBack = 0;                     // best(i - 2), best(i - 1)
    for (int loot : nums) {
        int here = Math.max(oneBack, twoBack + loot); // skip this house, or rob it
        twoBack = oneBack;
        oneBack = here;
    }
    return oneBack;
}`,
    python: `def rob(self, nums: List[int]) -> int:
    two_back = one_back = 0
    for loot in nums:
        two_back, one_back = one_back, max(one_back, two_back + loot)
    return one_back`,
    quiz: {
      q: "Why does best(i) only need best(i − 1) and best(i − 2)?",
      options: [
        "Robbing house i only rules out its neighbour i − 1; everything before that is already summarised in best(i − 2)",
        "The houses are sorted by value",
        "You can only rob two houses in total",
        "It's a greedy shortcut that sometimes fails",
      ],
      answer: 0,
      why: "That's the heart of DP: a small summary of the past (two numbers) is enough to make the next decision optimally.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "house-robber-ii",
    lc: 213,
    title: "House Robber II",
    world: "dp",
    difficulty: "Medium",
    pattern: "dp-1d",
    emoji: "🎡",
    statement: "Same as House Robber, but the houses stand in a circle, so the first and last houses are neighbours.",
    story:
      "The same raccoon, but the bins now stand in a ring — so the first and last bins are neighbours too. Break the ring two ways: pretend the last bin doesn't exist, or pretend the first one doesn't. Solve each as a straight street and keep the better haul.",
    insight: "The first and last houses can't both be robbed. Answer = max(rob(houses 0…n−2), rob(houses 1…n−1)), with n = 1 handled separately.",
    complexity: { time: "O(n)", space: "O(1)", why: "Two linear passes." },
    inputs: [{ name: "nums", kind: "intArray", minLen: 1, maxLen: 8, min: 0, max: 99 }],
    examples: [
      { input: { nums: [2, 3, 2] }, output: 3 },
      { input: { nums: [1, 2, 3, 1] }, output: 4 },
      { input: { nums: [1, 2, 3] }, output: 3 },
    ],
    trace({ nums }, T) {
      const n = nums.length;
      if (n === 1) {
        T.step(`There's only one house, and it has no neighbours. Rob it: **${nums[0]}**.`, [arr("houses", nums, { bars: true, tones: { 0: "found" } })]);
        return nums[0];
      }
      const robLine = (lo, hi) => {
        let twoBack = 0;
        let oneBack = 0;
        for (let i = lo; i <= hi; i += 1) [twoBack, oneBack] = [oneBack, Math.max(oneBack, twoBack + nums[i])];
        return oneBack;
      };

      T.step("The street is a circle, so the first and last houses are neighbours and can't both be robbed. Solve two straight streets instead: one without the last house, one without the first.", [
        arr("houses", nums, { bars: true, tones: { 0: "cmp", [n - 1]: "cmp" } }),
      ]);

      const pass = (lo, hi, name) => {
        const best = nums.map(() => null);
        T.step(`${name}: houses ${lo}…${hi}.`, [arr("houses", nums, { bars: true, window: [lo, hi], tones: outside(lo, hi, n) }), arr("best haul", best)], {
          ask: pickNumber(`What's the most loot from houses ${lo}…${hi}?`, robLine(lo, hi)),
        });
        let twoBack = 0;
        let oneBack = 0;
        for (let i = lo; i <= hi; i += 1) {
          const rob = twoBack + nums[i];
          const here = Math.max(oneBack, rob);
          best[i] = here;
          T.step(`House ${i} (${nums[i]}): rob → ${twoBack} + ${nums[i]} = ${rob}; skip → ${oneBack}. Best so far: **${here}**.`, [
            arr("houses", nums, { bars: true, window: [lo, hi], pointers: { i }, tones: outside(lo, hi, n, { [i]: rob > oneBack ? "good" : "active" }) }),
            arr("best haul", best, { tones: { [i]: "good" } }),
          ]);
          twoBack = oneBack;
          oneBack = here;
        }
        return oneBack;
      };

      const a = pass(0, n - 2, "Street 1 (leave the last house alone)");
      const b = pass(1, n - 1, "Street 2 (leave the first house alone)");
      T.step(`Street 1 hauls ${a}, street 2 hauls ${b}. The answer is **${Math.max(a, b)}**.`, [arr("houses", nums, { bars: true })]);
      return Math.max(a, b);
    },
    java: `public int rob(int[] nums) {
    if (nums.length == 1) return nums[0];
    return Math.max(robLine(nums, 0, nums.length - 2),  // leave the last house alone
                    robLine(nums, 1, nums.length - 1)); // or leave the first house alone
}

private int robLine(int[] nums, int lo, int hi) {
    int twoBack = 0, oneBack = 0;
    for (int i = lo; i <= hi; i++) {
        int here = Math.max(oneBack, twoBack + nums[i]);
        twoBack = oneBack;
        oneBack = here;
    }
    return oneBack;
}`,
    python: `def rob(self, nums: List[int]) -> int:
    def rob_line(houses):
        two_back = one_back = 0
        for loot in houses:
            two_back, one_back = one_back, max(one_back, two_back + loot)
        return one_back

    if len(nums) == 1:
        return nums[0]
    return max(rob_line(nums[:-1]), rob_line(nums[1:]))`,
    quiz: {
      q: "Why run the House Robber algorithm twice?",
      options: [
        "The first and last houses are neighbours, so at least one must be left out — try both ways",
        "To double-check the answer",
        "A circle can be walked in two directions",
        "To handle negative amounts of money",
      ],
      answer: 0,
      why: "Removing either end turns the circle into a straight line, which the original algorithm already solves.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "decode-ways",
    lc: 91,
    title: "Decode Ways",
    world: "dp",
    difficulty: "Medium",
    pattern: "dp-1d",
    emoji: "🔐",
    statement: "Letters are encoded as A = 1 … Z = 26. Given a string of digits, return how many ways it can be decoded.",
    story:
      "You intercept a secret message with the spaces removed. \"226\" could be 2-2-6, 22-6 or 2-26. At every digit, ask two questions: can it stand alone as a letter, and can it pair with the digit before it?",
    insight: "ways(i) = (digit i−1 is 1–9 ? ways(i−1) : 0) + (last two digits are 10–26 ? ways(i−2) : 0), with ways(0) = 1.",
    complexity: { time: "O(n)", space: "O(1)", why: "One pass; only the last two counts are needed." },
    inputs: [{ name: "s", kind: "string", minLen: 1, maxLen: 10, pattern: /^[0-9]+$/, patternHint: "Use digits 0–9 only." }],
    examples: [
      { input: { s: "12" }, output: 2 },
      { input: { s: "226" }, output: 3 },
      { input: { s: "06" }, output: 0 },
    ],
    trace({ s }, T) {
      const n = s.length;
      const digits = s.split("");
      const letter = (num) => String.fromCharCode(64 + num);
      const pairValid = (i) => i >= 2 && Number(s.slice(i - 2, i)) >= 10 && Number(s.slice(i - 2, i)) <= 26;
      const full = new Array(n + 1).fill(0);
      full[0] = 1;
      for (let i = 1; i <= n; i += 1) {
        full[i] = (s[i - 1] !== "0" ? full[i - 1] : 0) + (pairValid(i) ? full[i - 2] : 0);
      }

      const ways = new Array(n + 1).fill(null);
      ways[0] = 1;
      T.step(
        "A = 1 … Z = 26. ways(i) = how many ways to decode the first i digits, and ways(0) = 1 (an empty message has one reading). Each new digit can stand alone (1–9) or pair with the digit before it (10–26).",
        [arr("digits", digits), arr("ways(i)", ways, { tones: { 0: "found" } })],
        { ask: pickNumber("What will ways(1) be?", full[1]) }
      );

      for (let i = 1; i <= n; i += 1) {
        const d = s[i - 1];
        const single = d !== "0";
        const pairOk = pairValid(i);
        ways[i] = full[i];
        const parts = [single ? `'${d}' alone reads as ${letter(Number(d))} → + ways(${i - 1}) = ${ways[i - 1]}` : "'0' alone isn't a letter → + 0"];
        if (i >= 2) {
          const pair = s.slice(i - 2, i);
          parts.push(pairOk ? `'${pair}' reads as ${letter(Number(pair))} → + ways(${i - 2}) = ${ways[i - 2]}` : `'${pair}' isn't 10–26 → + 0`);
        }
        T.step(
          `ways(${i}): ${parts.join("; ")}. Total **${ways[i]}**.`,
          [
            arr("digits", digits, { window: pairOk ? [i - 2, i - 1] : [i - 1, i - 1], pointers: { at: i - 1 }, tones: { [i - 1]: single ? "active" : "bad" } }),
            arr("ways(i)", ways, {
              pointers: { i },
              tones: { ...(single ? { [i - 1]: "cmp" } : {}), ...(pairOk ? { [i - 2]: "cmp" } : {}), [i]: ways[i] ? "good" : "bad" },
            }),
          ],
          { ask: i < n ? pickNumber(`What will ways(${i + 1}) be?`, full[i + 1]) : undefined }
        );
      }

      T.step(ways[n] ? `There are **${ways[n]}** ways to decode "${s}".` : `There's no valid way to decode "${s}", so the answer is **0**.`, [
        arr("digits", digits),
        arr("ways(i)", ways, { tones: { [n]: ways[n] ? "found" : "bad" } }),
      ]);
      return ways[n];
    },
    java: `public int numDecodings(String s) {
    int[] ways = new int[s.length() + 1];       // ways[i]: decodings of the first i digits
    ways[0] = 1;
    for (int i = 1; i <= s.length(); i++) {
        if (s.charAt(i - 1) != '0') ways[i] += ways[i - 1];           // one digit: 1-9
        if (i >= 2) {
            int pair = Integer.parseInt(s.substring(i - 2, i));
            if (pair >= 10 && pair <= 26) ways[i] += ways[i - 2];     // two digits: 10-26
        }
    }
    return ways[s.length()];
}`,
    python: `def numDecodings(self, s: str) -> int:
    ways = [1] + [0] * len(s)
    for i in range(1, len(s) + 1):
        if s[i - 1] != "0":
            ways[i] += ways[i - 1]
        if i >= 2 and 10 <= int(s[i - 2:i]) <= 26:
            ways[i] += ways[i - 2]
    return ways[-1]`,
    quiz: {
      q: "Why does '0' need special care?",
      options: [
        "No letter is 0 on its own, so it's only valid as part of 10 or 20",
        "0 marks the end of the message",
        "0 maps to the letter A",
        "Zeros are simply skipped",
      ],
      answer: 0,
      why: "\"06\" has zero decodings: '0' can't stand alone and '06' isn't between 10 and 26.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "unique-paths",
    lc: 62,
    title: "Unique Paths",
    world: "dp",
    difficulty: "Medium",
    pattern: "dp-2d",
    emoji: "🤖",
    statement: "A robot starts at the top-left of an m × n grid and can only move right or down. How many unique paths reach the bottom-right?",
    story:
      "A delivery robot in a city of one-way streets can only drive east or south. The number of routes to any intersection is the routes arriving from the north plus the routes arriving from the west.",
    insight: "paths[r][c] = paths[r − 1][c] + paths[r][c − 1]. The top row and left column are all 1s.",
    complexity: { time: "O(m · n)", space: "O(n)", why: "One cell at a time; a single rolling row is enough." },
    inputs: [
      { name: "m", kind: "int", min: 1, max: 7 },
      { name: "n", kind: "int", min: 1, max: 7 },
    ],
    examples: [
      { input: { m: 3, n: 7 }, output: 28 },
      { input: { m: 3, n: 2 }, output: 3 },
      { input: { m: 1, n: 1 }, output: 1 },
    ],
    trace({ m, n }, T) {
      const full = Array.from({ length: m }, () => new Array(n).fill(1));
      for (let r = 1; r < m; r += 1) for (let c = 1; c < n; c += 1) full[r][c] = full[r - 1][c] + full[r][c - 1];

      const g = Array.from({ length: m }, () => new Array(n).fill(null));
      T.step("The robot only moves right or down. Every cell on the top row and the left column has exactly one route: straight along the edge.", [
        grid("routes", g, { cursor: [0, 0] }),
      ]);
      const edges = {};
      for (let c = 0; c < n; c += 1) {
        g[0][c] = 1;
        edges[key(0, c)] = "good";
      }
      for (let r = 0; r < m; r += 1) {
        g[r][0] = 1;
        edges[key(r, 0)] = "good";
      }
      T.step("Fill the edges with 1s. Every other cell is entered from above or from the left, so its routes = above + left.", [grid("routes", g, { tones: edges })], {
        ask: m > 1 && n > 1 ? pickNumber("How many routes reach cell (1, 1)?", 2) : undefined,
      });

      for (let r = 1; r < m; r += 1) {
        for (let c = 1; c < n; c += 1) {
          g[r][c] = g[r - 1][c] + g[r][c - 1];
          const nr = c < n - 1 ? r : r + 1;
          const nc = c < n - 1 ? c + 1 : 1;
          T.step(`(${r}, ${c}) = above ${g[r - 1][c]} + left ${g[r][c - 1]} = **${g[r][c]}**.`, [
            grid("routes", g, { tones: { [key(r - 1, c)]: "cmp", [key(r, c - 1)]: "cmp", [key(r, c)]: "good" }, cursor: [r, c] }),
          ], { ask: nr < m ? pickNumber(`How many routes reach (${nr}, ${nc})?`, full[nr][nc]) : undefined });
        }
      }

      T.step(`**${g[m - 1][n - 1]}** unique route${g[m - 1][n - 1] === 1 ? "" : "s"} reach the bottom-right corner.`, [
        grid("routes", g, { tones: { [key(m - 1, n - 1)]: "found" }, cursor: [m - 1, n - 1] }),
      ]);
      return g[m - 1][n - 1];
    },
    java: `public int uniquePaths(int m, int n) {
    int[] row = new int[n];
    Arrays.fill(row, 1);               // the top row: one way, straight along the edge
    for (int r = 1; r < m; r++)
        for (int c = 1; c < n; c++)
            row[c] += row[c - 1];      // routes from above (old row[c]) + routes from the left
    return row[n - 1];
}`,
    python: `def uniquePaths(self, m: int, n: int) -> int:
    row = [1] * n
    for _ in range(1, m):
        for c in range(1, n):
            row[c] += row[c - 1]
    return row[-1]`,
    levelUp: "It's also pure combinatorics: of the m + n − 2 moves, choose which m − 1 go down — C(m + n − 2, m − 1).",
    quiz: {
      q: "Why is each cell the sum of the cell above and the cell to the left?",
      options: [
        "The robot's last move into it was either down from above or right from the left",
        "Because the grid is square",
        "It's only an approximation",
        "Diagonal moves are allowed too",
      ],
      answer: 0,
      why: "Those two sets of routes never overlap and together cover every route, so their counts simply add.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "jump-game",
    lc: 55,
    title: "Jump Game",
    world: "dp",
    difficulty: "Medium",
    pattern: "greedy",
    emoji: "🦘",
    statement: "Each element is your maximum jump length from that position. Starting at index 0, decide whether you can reach the last index.",
    story:
      "Every tile is a trampoline with a maximum bounce. Walk forward keeping track of the farthest tile any trampoline so far could launch you to. If you ever stand on a tile beyond that frontier, you could never have got there.",
    insight: "Track reach = max(reach, i + nums[i]). If i ever exceeds reach, you're stuck; if reach covers the last index, you win.",
    complexity: { time: "O(n)", space: "O(1)", why: "One pass, one variable." },
    inputs: [{ name: "nums", kind: "intArray", minLen: 1, maxLen: 12, min: 0, max: 9 }],
    examples: [
      { input: { nums: [2, 3, 1, 1, 4] }, output: true },
      { input: { nums: [3, 2, 1, 0, 4] }, output: false },
      { input: { nums: [0] }, output: true },
    ],
    trace({ nums }, T) {
      const n = nums.length;
      let reach = 0;
      T.step("Each tile is a trampoline that can launch you up to nums[i] tiles forward. Track the farthest tile you could possibly have reached.", [
        arr("nums", nums, { window: [0, 0], pointers: { i: 0 } }),
      ], { vars: { farthest: reach } });

      for (let i = 0; i < n; i += 1) {
        if (i > reach) {
          T.step(`Tile ${i} is past the farthest reachable tile (${reach}). You're stuck. **false**.`, [
            arr("nums", nums, { window: [0, reach], pointers: { i }, tones: { ...paint(0, reach, "visited"), ...paint(reach + 1, n - 1, "bad") } }),
          ], { vars: { farthest: reach } });
          return false;
        }
        const grew = i + nums[i] > reach;
        reach = Math.max(reach, i + nums[i]);
        const done = reach >= n - 1;
        T.step(
          `Stand on tile ${i} (bounce ${nums[i]}): it reaches tile ${i + nums[i]}.` + (grew ? ` The farthest reachable tile is now **${reach}**.` : ` The farthest stays at ${reach}.`),
          [arr("nums", nums, { window: [0, Math.min(reach, n - 1)], pointers: { i }, tones: { ...paint(0, i - 1, "visited"), [i]: "active" } })],
          {
            vars: { farthest: reach },
            ask: !done && i + 1 < n ? yesNo(`Is tile ${i + 1} reachable?`, i + 1 <= reach, "A tile is reachable when its index is no more than the farthest reach so far.") : undefined,
          }
        );
        if (done) {
          T.step(`The last tile (${n - 1}) is within reach. **true**.`, [
            arr("nums", nums, { window: [0, n - 1], tones: { [n - 1]: "found" } }),
          ], { vars: { farthest: reach } });
          return true;
        }
      }
      return true;
    },
    java: `public boolean canJump(int[] nums) {
    int reach = 0;                         // farthest tile we could have got to
    for (int i = 0; i < nums.length; i++) {
        if (i > reach) return false;       // this tile is out of reach: stuck
        reach = Math.max(reach, i + nums[i]);
    }
    return true;
}`,
    python: `def canJump(self, nums: List[int]) -> bool:
    reach = 0
    for i, jump in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + jump)
    return True`,
    quiz: {
      q: "Why is tracking only the farthest reachable index enough?",
      options: [
        "Every tile up to that index is reachable too, so that one number summarises everything",
        "You should always jump the maximum distance",
        "The tiles are sorted",
        "The last tile always holds a zero",
      ],
      answer: 0,
      why: "If you can reach tile 7, you passed through a tile that could launch you there, and every tile before it was reachable as well.",
    },
  },
];
