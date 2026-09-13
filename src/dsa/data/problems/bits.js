import { arr, bits, yesNo, pickNumber, paint } from "../../engine/scene";

/** {bitIndex: tone} for every set bit of value. */
function ones(value, width, tone) {
  const out = {};
  for (let b = 0; b < width; b += 1) {
    if ((value >>> b) & 1) out[b] = tone;
  }
  return out;
}

function popcount(x) {
  let n = x >>> 0;
  let c = 0;
  while (n) {
    n &= n - 1;
    c += 1;
  }
  return c;
}

export const bitProblems = [
  /* ------------------------------------------------------------------ */
  {
    slug: "sum-of-two-integers",
    lc: 371,
    title: "Sum of Two Integers",
    world: "bits",
    difficulty: "Medium",
    pattern: "bit-manipulation",
    emoji: "➕",
    statement: "Return the sum of two integers a and b without using the + or − operators.",
    story:
      "Remember column addition from school? XOR is you writing down each column's digit while ignoring carries. AND is you noticing where two 1s meet and a carry is born. Shift the carries left and add again, until nothing is left to carry.",
    insight: "a ^ b is the sum without carries; (a & b) << 1 is the carries. Repeat with those two until the carry is 0.",
    complexity: { time: "O(1)", space: "O(1)", why: "At most 32 rounds for 32-bit integers." },
    inputs: [
      { name: "a", kind: "int", min: 0, max: 999 },
      { name: "b", kind: "int", min: 0, max: 999 },
    ],
    examples: [
      { input: { a: 1, b: 2 }, output: 3 },
      { input: { a: 2, b: 3 }, output: 5 },
      { input: { a: 13, b: 7 }, output: 20 },
    ],
    trace({ a, b }, T) {
      const W = 12;
      let x = a;
      let y = b;
      let round = 0;
      T.step("No + allowed. XOR adds each column without carrying; AND finds the columns where a carry is born.", [
        bits("inputs", [
          { name: "a", value: x, width: W, tones: ones(x, W, "active") },
          { name: "b", value: y, width: W, tones: ones(y, W, "cmp") },
        ]),
      ], { vars: { a: x, b: y } });

      while (y !== 0) {
        round += 1;
        const sum = x ^ y;
        const carry = (x & y) << 1;
        T.step(
          `Round ${round}: a ^ b = **${sum}** (the sum, ignoring carries). (a & b) << 1 = **${carry}** (the carries, shifted into place).`,
          [
            bits("round " + round, [
              { name: "a", value: x, width: W },
              { name: "b", value: y, width: W },
              { name: "a ^ b", value: sum, width: W, tones: ones(sum, W, "good") },
              { name: "(a & b) << 1", value: carry, width: W, tones: ones(carry, W, "found") },
            ]),
          ],
          { vars: { a: x, b: y }, ask: yesNo("Will there be another round?", carry !== 0, "Another round happens whenever the carry is non-zero.") }
        );
        x = sum;
        y = carry;
      }

      T.step(`The carry is zero, so there's nothing left to add. The answer is **${x}**.`, [
        bits("done", [
          { name: "a", value: x, width: W, tones: ones(x, W, "found") },
          { name: "b", value: 0, width: W },
        ]),
      ], { vars: { result: x } });
      return x;
    },
    java: `public int getSum(int a, int b) {
    while (b != 0) {
        int carry = (a & b) << 1; // where both bits are 1, a carry moves left
        a = a ^ b;                // add each column without carrying
        b = carry;
    }
    return a;
}`,
    python: `def getSum(self, a: int, b: int) -> int:
    MASK, MAX = 0xFFFFFFFF, 0x7FFFFFFF  # Python ints are unbounded: fake 32 bits
    while b:
        a, b = (a ^ b) & MASK, ((a & b) << 1) & MASK
    return a if a <= MAX else ~(a ^ MASK)`,
    quiz: {
      q: "In this algorithm, what does a ^ b represent?",
      options: ["The sum of each column, ignoring carries", "The carries", "The product of a and b", "The difference a − b"],
      answer: 0,
      why: "1 ^ 1 = 0 and 1 ^ 0 = 1: exactly the digit you write down before carrying.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "number-of-1-bits",
    lc: 191,
    title: "Number of 1 Bits",
    world: "bits",
    difficulty: "Easy",
    pattern: "bit-manipulation",
    emoji: "🔦",
    statement: "Return the number of 1 bits in the binary representation of a non-negative integer (its Hamming weight).",
    story:
      "Picture a row of light bulbs. n & (n − 1) is a magic switch that turns off exactly the rightmost bulb that's on. Count how many flicks it takes to plunge the room into darkness.",
    insight: "n & (n − 1) clears the lowest set bit. The loop runs once per 1 bit, not once per bit.",
    complexity: { time: "O(k)", space: "O(1)", why: "k is the number of set bits — at most 32." },
    inputs: [{ name: "n", kind: "int", min: 0, max: 65535 }],
    examples: [
      { input: { n: 11 }, output: 3 },
      { input: { n: 128 }, output: 1 },
      { input: { n: 255 }, output: 8 },
    ],
    trace({ n }, T) {
      const W = 16;
      let x = n;
      let count = 0;
      T.step("n & (n − 1) switches off the lowest 1 bit. Count how many switch-offs it takes to reach zero.", [
        bits("n", [{ name: "n", value: x, width: W, tones: ones(x, W, "active") }]),
      ], { vars: { count } });

      while (x !== 0) {
        const lowBit = Math.log2(x & -x);
        const next = x & (x - 1);
        T.step(
          `n = ${x}. Subtracting 1 flips the lowest 1 bit and every 0 below it. AND with the original → **${next}**.`,
          [
            bits("switch-off #" + (count + 1), [
              { name: "n", value: x, width: W, tones: { ...ones(x, W, "active"), [lowBit]: "bad" } },
              { name: "n − 1", value: x - 1, width: W },
              { name: "n & (n − 1)", value: next, width: W, tones: ones(next, W, "good") },
            ]),
          ],
          { vars: { count }, ask: pickNumber("How many 1 bits are left after this switch-off?", popcount(next)) }
        );
        x = next;
        count += 1;
      }

      T.step(`Darkness after **${count}** switch-offs — that's the number of 1 bits.`, [
        bits("n", [{ name: "n", value: 0, width: W }]),
      ], { vars: { count } });
      return count;
    },
    java: `public int hammingWeight(int n) {
    int count = 0;
    while (n != 0) {
        n &= (n - 1); // clears the lowest set bit
        count++;
    }
    return count;
}`,
    python: `def hammingWeight(self, n: int) -> int:
    count = 0
    while n:
        n &= n - 1
        count += 1
    return count`,
    quiz: {
      q: "What does n & (n − 1) do?",
      options: ["Clears the lowest set bit", "Clears the highest set bit", "Flips every bit", "Doubles n"],
      answer: 0,
      why: "n − 1 flips the lowest 1 to 0 and the zeros below it to 1. ANDing keeps everything above and wipes that lowest 1.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "counting-bits",
    lc: 338,
    title: "Counting Bits",
    world: "bits",
    difficulty: "Easy",
    pattern: "bit-manipulation",
    emoji: "🧮",
    statement: "For every i from 0 to n, return the number of 1 bits in i.",
    story:
      "Every number is a smaller number wearing one extra bit on its tail. Chop the tail off (i >> 1) and you get a number you've already counted. Add 1 back if the tail bit was a 1.",
    insight: "bits(i) = bits(i >> 1) + (i & 1). Each answer reuses one you computed earlier.",
    complexity: { time: "O(n)", space: "O(n)", why: "Constant work per number, plus the output array." },
    inputs: [{ name: "n", kind: "int", min: 0, max: 16 }],
    examples: [
      { input: { n: 2 }, output: [0, 1, 1] },
      { input: { n: 5 }, output: [0, 1, 1, 2, 1, 2] },
    ],
    trace({ n }, T) {
      const ans = new Array(n + 1).fill(null);
      ans[0] = 0;
      const W = Math.max(4, n.toString(2).length);
      T.step("bits(0) = 0. After that, every number is a smaller number plus one tail bit — and we'll already know the smaller one.", [
        arr("bits(i)", ans, { tones: { 0: "found" } }),
      ], { ask: n >= 1 ? pickNumber("What is bits(1)?", 1) : undefined });

      for (let i = 1; i <= n; i += 1) {
        const half = i >> 1;
        ans[i] = ans[half] + (i & 1);
        T.step(
          `i = ${i}: bits(${i}) = bits(${half}) + (${i} & 1) = ${ans[half]} + ${i & 1} = **${ans[i]}**.`,
          [
            bits(`${i} in binary`, [
              { name: String(i), value: i, width: W, tones: { ...ones(i, W, "visited"), 0: i & 1 ? "active" : "dim" } },
              { name: `${i} >> 1`, value: half, width: W, tones: ones(half, W, "cmp") },
            ]),
            arr("bits(i)", ans, { pointers: { i, half }, tones: { ...paint(0, i - 1, "visited"), [half]: "cmp", [i]: "good" } }),
          ],
          { ask: i < n ? pickNumber(`What will bits(${i + 1}) be?`, popcount(i + 1)) : undefined }
        );
      }

      T.step("Every answer was built from one we already had.", [arr("bits(i)", ans, { tones: paint(0, n, "found") })]);
      return ans;
    },
    java: `public int[] countBits(int n) {
    int[] ans = new int[n + 1];
    for (int i = 1; i <= n; i++) {
        ans[i] = ans[i >> 1] + (i & 1); // drop the last bit, then add it back
    }
    return ans;
}`,
    python: `def countBits(self, n: int) -> List[int]:
    ans = [0] * (n + 1)
    for i in range(1, n + 1):
        ans[i] = ans[i >> 1] + (i & 1)
    return ans`,
    quiz: {
      q: "Why is bits(i) = bits(i >> 1) + (i & 1)?",
      options: [
        "i >> 1 is i with its last bit removed, and i & 1 is that last bit",
        "Because i is always even",
        "Shifting right doubles the number of ones",
        "It's only an approximation",
      ],
      answer: 0,
      why: "Removing the last bit can only remove a 1 if that bit was 1 — which is exactly what i & 1 adds back.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "missing-number",
    lc: 268,
    title: "Missing Number",
    world: "bits",
    difficulty: "Easy",
    pattern: "bit-manipulation",
    emoji: "🧦",
    statement: "An array holds n distinct numbers from the range [0, n]. Return the one number in that range that's missing.",
    story:
      "It's a sock drawer. Every number has a twin sock: its matching index. XOR is the washing machine where twins cancel out (x ^ x = 0). Throw everything in, and the only sock left is the one without a partner.",
    insight: "XOR every index 0..n with every value. Each value that's present cancels its matching index, leaving only the missing number.",
    complexity: { time: "O(n)", space: "O(1)", why: "One pass, one accumulator." },
    inputs: [{ name: "nums", kind: "intArray", minLen: 1, maxLen: 10, min: 0, max: 10 }],
    validate: ({ nums }) => {
      const distinct = new Set(nums).size === nums.length;
      return distinct && nums.every((x) => x <= nums.length)
        ? undefined
        : `Use ${nums.length} distinct numbers from 0 to ${nums.length}.`;
    },
    examples: [
      { input: { nums: [3, 0, 1] }, output: 2 },
      { input: { nums: [0, 1] }, output: 2 },
      { input: { nums: [9, 6, 4, 2, 3, 5, 7, 0, 1] }, output: 8 },
    ],
    trace({ nums }, T) {
      const n = nums.length;
      const W = Math.max(4, n.toString(2).length);
      let acc = n;
      T.step(`Start with acc = n = **${n}** (the one index with no array slot). Then XOR in every index and every value.`, [
        arr("nums", nums),
        bits("acc", [{ name: "acc", value: acc, width: W, tones: ones(acc, W, "active") }]),
      ], { vars: { acc } });

      for (let i = 0; i < n; i += 1) {
        const before = acc;
        acc = acc ^ i ^ nums[i];
        T.step(`acc ^= index ${i} ^ value ${nums[i]} → **${acc}**.`, [
          arr("nums", nums, { pointers: { i }, tones: { ...paint(0, i - 1, "visited"), [i]: "active" } }),
          bits("xor", [
            { name: "acc", value: before, width: W },
            { name: "index", value: i, width: W },
            { name: "value", value: nums[i], width: W },
            { name: "new acc", value: acc, width: W, tones: ones(acc, W, "good") },
          ]),
        ], { vars: { acc } });
      }

      T.step(`Every number with a twin cancelled out. The missing number is **${acc}**.`, [
        arr("nums", nums, { tones: paint(0, n - 1, "visited") }),
        bits("acc", [{ name: "acc", value: acc, width: W, tones: ones(acc, W, "found") }]),
      ], { vars: { acc } });
      return acc;
    },
    java: `public int missingNumber(int[] nums) {
    int acc = nums.length;
    for (int i = 0; i < nums.length; i++) {
        acc ^= i ^ nums[i]; // present values cancel their matching index
    }
    return acc;
}`,
    python: `def missingNumber(self, nums: List[int]) -> int:
    acc = len(nums)
    for i, x in enumerate(nums):
        acc ^= i ^ x
    return acc`,
    levelUp: "The sum formula works too: n(n + 1)/2 minus the array's sum. XOR is the version that can never overflow.",
    quiz: {
      q: "Why does XOR find the missing number?",
      options: [
        "Every value that's present cancels with its matching index, leaving only the missing one",
        "XOR sorts the numbers",
        "XOR is the same as adding",
        "It only works on sorted input",
      ],
      answer: 0,
      why: "XOR is order-independent and x ^ x = 0, so matching pairs vanish no matter where they appear.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "reverse-bits",
    lc: 190,
    title: "Reverse Bits",
    world: "bits",
    difficulty: "Easy",
    pattern: "bit-manipulation",
    emoji: "🔁",
    statement: "Reverse the bits of a 32-bit unsigned integer.",
    story:
      "Deal a deck of cards from the top of one pile onto a new pile, one at a time — the new pile comes out reversed. Here the deck is 32 bits: pop the last bit off n and push it onto the end of result.",
    insight: "32 times: result = (result << 1) | (n & 1), then n >>>= 1.",
    complexity: { time: "O(1)", space: "O(1)", why: "Always exactly 32 iterations." },
    inputs: [{ name: "n", kind: "int", min: 0, max: 4294967295 }],
    examples: [
      { input: { n: 43261596 }, output: 964176192 },
      { input: { n: 4294967293 }, output: 3221225471 },
      { input: { n: 1 }, output: 2147483648 },
    ],
    trace({ n }, T) {
      let x = n >>> 0;
      let res = 0;
      T.step("Pop the last bit off n and push it onto result, 32 times, like dealing a deck onto a new pile.", [
        bits("start", [
          { name: "n", value: x, width: 32, tones: ones(x, 32, "active") },
          { name: "result", value: res, width: 32 },
        ]),
      ]);
      for (let i = 0; i < 32; i += 1) {
        const bit = x & 1;
        const before = x;
        res = ((res << 1) | bit) >>> 0;
        x >>>= 1;
        T.step(`Step ${i + 1}: the last bit of n is **${bit}**. Push it: result = (result << 1) | ${bit}. Then n >>>= 1.`, [
          bits("step " + (i + 1), [
            { name: "n", value: before, width: 32, tones: { 0: bit ? "active" : "cmp" } },
            { name: "result", value: res, width: 32, tones: { 0: bit ? "good" : "cmp" } },
          ]),
        ], { vars: { bit, result: res } });
      }
      T.step(`All 32 bits have moved across. The reversed value is **${res}**.`, [
        bits("done", [{ name: "result", value: res, width: 32, tones: ones(res, 32, "found") }]),
      ], { vars: { result: res } });
      return res;
    },
    java: `public int reverseBits(int n) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        result = (result << 1) | (n & 1); // push n's last bit onto result
        n >>>= 1;                         // unsigned shift: never smear the sign bit
    }
    return result;
}`,
    python: `def reverseBits(self, n: int) -> int:
    result = 0
    for _ in range(32):
        result = (result << 1) | (n & 1)
        n >>= 1
    return result`,
    quiz: {
      q: "Why does the Java version use >>> instead of >>?",
      options: [
        ">>> fills with zeros, so a negative input doesn't copy its sign bit into every position",
        ">>> is faster than >>",
        ">> doesn't compile for ints",
        "They behave identically",
      ],
      answer: 0,
      why: "Java has no unsigned int. >> is an arithmetic shift that keeps copying the sign bit; >>> is the logical shift you want here.",
    },
  },
];
