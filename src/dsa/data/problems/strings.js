import { arr, kv, stack, text, yesNo, pickNumber, paint } from "../../engine/scene";
import { formatValue } from "../../engine/trace";

const LETTERS = /^[a-z]*$/;
const lettersHint = "Use lowercase letters a–z only.";

export const stringProblems = [
  /* ------------------------------------------------------------------ */
  {
    slug: "longest-substring-without-repeating-characters",
    lc: 3,
    title: "Longest Substring Without Repeating Characters",
    world: "strings",
    difficulty: "Medium",
    pattern: "sliding-window",
    emoji: "🐛",
    statement: "Return the length of the longest substring that contains no repeated characters.",
    story:
      "A caterpillar crawls along the string. Its head eats one letter at a time, and its body must never hold the same letter twice. When the head bites a letter already inside the body, the tail scoots forward just past the old copy.",
    insight:
      "Keep a window [L, R] with no repeats and remember where each letter was last seen. On a repeat inside the window, jump L to one past that last position.",
    complexity: { time: "O(n)", space: "O(k)", why: "Each pointer only moves forward; k is the alphabet size." },
    inputs: [{ name: "s", kind: "string", minLen: 0, maxLen: 16 }],
    examples: [
      { input: { s: "abcabcbb" }, output: 3 },
      { input: { s: "bbbbb" }, output: 1 },
      { input: { s: "pwwkew" }, output: 3 },
      { input: { s: "dvdf" }, output: 3 },
    ],
    trace({ s }, T) {
      const chars = s.split("");
      const last = new Map();
      const label = "last seen at";
      let l = 0;
      let best = 0;
      let bl = 0;
      let br = -1;

      T.step("A caterpillar crawls along the string. Its body — the window — must never hold the same letter twice.", [
        arr("s", chars),
        kv(label, last),
      ], { vars: { best } });

      for (let r = 0; r < chars.length; r += 1) {
        const c = chars[r];
        const prev = last.has(c) ? last.get(c) : -1;
        const clash = prev >= l;
        const tones = { [r]: "active" };
        if (prev >= 0) tones[prev] = clash ? "bad" : "dim";
        T.step(
          `The head reaches **'${c}'**.` + (prev >= 0 ? ` '${c}' was last seen at index ${prev}.` : ""),
          [arr("s", chars, { window: r - 1 >= l ? [l, r - 1] : undefined, pointers: { L: l, R: r }, tones }), kv(label, last, { hot: c })],
          { vars: { best }, ask: yesNo(`Is '${c}' already inside the window?`, clash, "It only counts if its last position is at or after L.") }
        );
        if (clash) {
          l = prev + 1;
          T.step(`'${c}' is already in the body at index ${prev}. The tail jumps past it: L = ${l}.`, [
            arr("s", chars, { window: [l, r], pointers: { L: l, R: r }, tones: { [r]: "active" } }),
            kv(label, last, { hot: c, tone: "bad" }),
          ], { vars: { best } });
        } else if (prev >= 0) {
          T.step(`Index ${prev} is behind the tail (L = ${l}), so that old '${c}' doesn't count.`, [
            arr("s", chars, { window: [l, r], pointers: { L: l, R: r }, tones: { [r]: "active" } }),
            kv(label, last, { hot: c }),
          ], { vars: { best } });
        }
        last.set(c, r);
        const len = r - l + 1;
        const improved = len > best;
        if (improved) {
          best = len;
          bl = l;
          br = r;
        }
        T.step(
          `The window "${s.slice(l, r + 1)}" has length ${len}.` + (improved ? ` New best: **${best}**.` : ""),
          [arr("s", chars, { window: [l, r], pointers: { L: l, R: r }, tones: improved ? paint(l, r, "good") : {} }), kv(label, last, { hot: c })],
          { vars: { best } }
        );
      }

      T.step(
        best ? `The longest stretch without repeats is "${s.slice(bl, br + 1)}", length **${best}**.` : "The string is empty, so the answer is **0**.",
        [arr("s", chars, best ? { window: [bl, br], tones: paint(bl, br, "found") } : {})],
        { vars: { best } }
      );
      return best;
    },
    java: `public int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> last = new HashMap<>(); // char -> last index seen
    int best = 0;
    for (int l = 0, r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        if (last.containsKey(c) && last.get(c) >= l) {
            l = last.get(c) + 1;                    // jump the tail past the repeat
        }
        last.put(c, r);
        best = Math.max(best, r - l + 1);
    }
    return best;
}`,
    python: `def lengthOfLongestSubstring(self, s: str) -> int:
    last, l, best = {}, 0, 0
    for r, c in enumerate(s):
        if last.get(c, -1) >= l:
            l = last[c] + 1
        last[c] = r
        best = max(best, r - l + 1)
    return best`,
    quiz: {
      q: "When a repeated letter shows up, where does L move?",
      options: [
        "Just past the previous copy of that letter, if that copy is inside the window",
        "To the current position R",
        "Back to index 0",
        "Always exactly one step forward",
      ],
      answer: 0,
      why: "Everything between L and the old copy would still contain the repeat, so skip straight past it. \"dvdf\" is the classic test.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "longest-repeating-character-replacement",
    lc: 424,
    title: "Longest Repeating Character Replacement",
    world: "strings",
    difficulty: "Medium",
    pattern: "sliding-window",
    emoji: "🎨",
    statement:
      "You may change up to k characters of an uppercase string to any letter. Return the length of the longest substring of one repeated letter you can make.",
    story:
      "You're repainting a fence with k cans of paint. Look at any stretch: keep the most common colour, repaint everything else. The stretch is doable if the planks that need repainting fit in your k cans.",
    insight:
      "A window is fine when (length − count of its most common letter) ≤ k. Grow the right edge; if the window breaks, slide the left edge along by one.",
    complexity: { time: "O(n)", space: "O(26)", why: "Both pointers only move forward; the counts cover 26 letters." },
    inputs: [
      { name: "s", kind: "string", minLen: 1, maxLen: 14, pattern: /^[A-Z]+$/, patternHint: "Use uppercase letters A–Z only." },
      { name: "k", kind: "int", min: 0, max: 14 },
    ],
    examples: [
      { input: { s: "ABAB", k: 2 }, output: 4 },
      { input: { s: "AABABBA", k: 1 }, output: 4 },
      { input: { s: "ABBB", k: 0 }, output: 3 },
    ],
    trace({ s, k }, T) {
      const chars = s.split("");
      const count = new Map();
      let l = 0;
      let maxFreq = 0;
      let best = 0;

      T.step(`A window is fixable when (length − its most common letter's count) ≤ k = **${k}**. Those leftover letters are what we'd repaint.`, [
        arr("s", chars),
        kv("counts in window", count),
      ], { vars: { k, best } });

      for (let r = 0; r < chars.length; r += 1) {
        const c = chars[r];
        count.set(c, (count.get(c) || 0) + 1);
        maxFreq = Math.max(maxFreq, count.get(c));
        const len = r - l + 1;
        const repaint = len - maxFreq;
        T.step(
          `Add '${c}'. The window "${s.slice(l, r + 1)}" is ${len} long and its most common letter appears ${maxFreq}×, so we'd repaint **${repaint}**.`,
          [arr("s", chars, { window: [l, r], pointers: { L: l, R: r }, tones: { [r]: "active" } }), kv("counts in window", count, { hot: c })],
          { vars: { k, repaint, best }, ask: yesNo(`Does the window need to slide (is ${repaint} > ${k})?`, repaint > k) }
        );
        if (repaint > k) {
          const out = chars[l];
          count.set(out, count.get(out) - 1);
          l += 1;
          T.step(
            `${repaint} > ${k}, too much paint. Slide the tail forward one step, dropping '${out}'. The window keeps its size — we only care about beating the best.`,
            [arr("s", chars, { window: [l, r], pointers: { L: l, R: r }, tones: { [l - 1]: "bad" } }), kv("counts in window", count, { hot: out, tone: "bad" })],
            { vars: { k, best } }
          );
        }
        if (r - l + 1 > best) {
          best = r - l + 1;
          T.step(`New best length: **${best}**.`, [
            arr("s", chars, { window: [l, r], pointers: { L: l, R: r }, tones: paint(l, r, "good") }),
            kv("counts in window", count),
          ], { vars: { k, best } });
        }
      }

      T.step(`The longest stretch we can make one letter: **${best}**.`, [arr("s", chars), kv("counts in window", count)], { vars: { best } });
      return best;
    },
    java: `public int characterReplacement(String s, int k) {
    int[] count = new int[26];
    int l = 0, maxFreq = 0, best = 0;
    for (int r = 0; r < s.length(); r++) {
        maxFreq = Math.max(maxFreq, ++count[s.charAt(r) - 'A']);
        if (r - l + 1 - maxFreq > k) {   // more letters to repaint than we have paint
            count[s.charAt(l) - 'A']--;  // slide the window forward
            l++;
        }
        best = Math.max(best, r - l + 1);
    }
    return best;
}`,
    python: `def characterReplacement(self, s: str, k: int) -> int:
    count = collections.Counter()
    l = max_freq = best = 0
    for r, c in enumerate(s):
        count[c] += 1
        max_freq = max(max_freq, count[c])
        if r - l + 1 - max_freq > k:
            count[s[l]] -= 1
            l += 1
        best = max(best, r - l + 1)
    return best`,
    quiz: {
      q: "Why is it fine that maxFreq is never lowered when the window slides?",
      options: [
        "We only care about windows longer than the best so far, and a stale maxFreq can't produce a false longer one",
        "maxFreq never actually changes",
        "It's a bug that happens to pass the tests",
        "Letters can never leave the window",
      ],
      answer: 0,
      why: "The window never shrinks, it only slides. It can only grow when a real maxFreq catches up, so the answer stays exact.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "minimum-window-substring",
    lc: 76,
    title: "Minimum Window Substring",
    world: "strings",
    difficulty: "Hard",
    pattern: "sliding-window",
    emoji: "🪟",
    statement:
      "Return the shortest substring of s that contains every character of t, including duplicates. Return an empty string if there is none.",
    story:
      "You're on a scavenger hunt down a street of shops, and t is your shopping list. Walk forward buying things until your bag has everything. Then, from the back of your route, hand back anything you don't need, making the trip as short as possible.",
    insight:
      "Expand R until the window covers every needed letter, then shrink L while it still does, recording the shortest window. Repeat until R reaches the end.",
    complexity: { time: "O(|s| + |t|)", space: "O(k)", why: "Each index enters and leaves the window at most once." },
    inputs: [
      { name: "s", kind: "string", minLen: 1, maxLen: 16, pattern: /^[A-Za-z]+$/, patternHint: "Use letters only." },
      { name: "t", kind: "string", minLen: 1, maxLen: 6, pattern: /^[A-Za-z]+$/, patternHint: "Use letters only." },
    ],
    examples: [
      { input: { s: "ADOBECODEBANC", t: "ABC" }, output: "BANC" },
      { input: { s: "a", t: "a" }, output: "a" },
      { input: { s: "a", t: "aa" }, output: "" },
    ],
    trace({ s, t }, T) {
      const chars = s.split("");
      const need = new Map();
      for (const c of t) need.set(c, (need.get(c) || 0) + 1);
      const have = new Map();
      const required = need.size;
      let formed = 0;
      let l = 0;
      let best = [Infinity, 0, -1];
      const label = "have / need";
      const ledger = () => [...need.keys()].map((c) => [c, `${have.get(c) || 0}/${need.get(c)}`]);
      const vars = () => ({ covered: `${formed}/${required}` });

      T.step(`Find the shortest window of s that has every letter of "${t}". Expand right until it's covered, then squeeze from the left.`, [
        arr("s", chars),
        kv(label, ledger()),
      ], { vars: vars() });

      for (let r = 0; r < chars.length; r += 1) {
        const c = chars[r];
        have.set(c, (have.get(c) || 0) + 1);
        let note = " We don't need it.";
        if (need.has(c)) {
          if (have.get(c) === need.get(c)) {
            formed += 1;
            note = ` That completes '${c}' — ${formed} of ${required} letters covered.`;
          } else if (have.get(c) < need.get(c)) {
            note = ` We need more '${c}' (${have.get(c)}/${need.get(c)}).`;
          } else {
            note = ` An extra '${c}' — we already had enough.`;
          }
        }
        T.step(`Expand: take '${c}'.` + note, [
          arr("s", chars, { window: [l, r], pointers: { L: l, R: r }, tones: { [r]: "active" } }),
          kv(label, ledger(), { hot: c }),
        ], { vars: vars() });

        while (formed === required) {
          const len = r - l + 1;
          const better = len < best[0];
          if (better) best = [len, l, r];
          const out = chars[l];
          const breaks = need.has(out) && have.get(out) === need.get(out);
          T.step(
            `"${s.slice(l, r + 1)}" (length ${len}) covers everything.` + (better ? " Shortest so far!" : "") + ` Try squeezing out '${out}' from the left.`,
            [arr("s", chars, { window: [l, r], pointers: { L: l, R: r }, tones: better ? { ...paint(l, r, "good"), [l]: "cmp" } : { [l]: "cmp" } }), kv(label, ledger(), { hot: out })],
            { vars: vars(), ask: yesNo(`Is the window still covered without '${out}'?`, !breaks, "It breaks only if that letter was needed and we had exactly enough.") }
          );
          have.set(out, have.get(out) - 1);
          if (breaks) formed -= 1;
          l += 1;
          if (breaks) {
            T.step(`Without '${out}' we're short, so the window is no longer covered. Back to expanding.`, [
              arr("s", chars, { window: l <= r ? [l, r] : undefined, pointers: { L: l, R: r } }),
              kv(label, ledger(), { hot: out, tone: "bad" }),
            ], { vars: vars() });
          }
        }
      }

      const answer = best[0] === Infinity ? "" : s.slice(best[1], best[2] + 1);
      T.step(
        answer ? `The shortest covering window is **"${answer}"**.` : `No window contains all of "${t}", so the answer is **""**.`,
        [arr("s", chars, answer ? { window: [best[1], best[2]], tones: paint(best[1], best[2], "found") } : {})]
      );
      return answer;
    },
    java: `public String minWindow(String s, String t) {
    Map<Character, Integer> need = new HashMap<>(), have = new HashMap<>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
    int formed = 0, bestLen = Integer.MAX_VALUE, bestStart = 0;
    for (int l = 0, r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        have.merge(c, 1, Integer::sum);
        if (need.containsKey(c) && have.get(c).intValue() == need.get(c)) formed++;
        while (formed == need.size()) {              // everything covered: squeeze
            if (r - l + 1 < bestLen) {
                bestLen = r - l + 1;
                bestStart = l;
            }
            char out = s.charAt(l++);
            have.merge(out, -1, Integer::sum);
            if (need.containsKey(out) && have.get(out) < need.get(out)) formed--;
        }
    }
    return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestStart, bestStart + bestLen);
}`,
    python: `def minWindow(self, s: str, t: str) -> str:
    need, have = collections.Counter(t), collections.Counter()
    formed, l = 0, 0
    best = (float("inf"), 0)
    for r, c in enumerate(s):
        have[c] += 1
        if c in need and have[c] == need[c]:
            formed += 1
        while formed == len(need):      # everything covered: squeeze
            if r - l + 1 < best[0]:
                best = (r - l + 1, l)
            out = s[l]
            have[out] -= 1
            if out in need and have[out] < need[out]:
                formed -= 1
            l += 1
    length, start = best
    return "" if length == float("inf") else s[start:start + length]`,
    quiz: {
      q: "When do you move the left edge of the window?",
      options: [
        "As soon as the window contains every required letter",
        "Whenever the window reaches t's length",
        "After every single expansion",
        "Only once, at the very end",
      ],
      answer: 0,
      why: "Expansion finds a valid window; squeezing finds the shortest valid window with that right edge.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "valid-anagram",
    lc: 242,
    title: "Valid Anagram",
    world: "strings",
    difficulty: "Easy",
    pattern: "hashing",
    emoji: "🔠",
    statement: "Return true if t is an anagram of s — the same letters with the same counts, in any order.",
    story:
      "Two Scrabble players claim their racks hold the same tiles. Keep one tally board: every tile from player one adds a mark, every tile from player two rubs one out. Same tiles means a spotless board at the end.",
    insight: "Count letters up for s and down for t. They're anagrams exactly when every count returns to zero.",
    complexity: { time: "O(n)", space: "O(26)", why: "One pass; the tally has at most 26 letters." },
    inputs: [
      { name: "s", kind: "string", minLen: 1, maxLen: 10, pattern: LETTERS, patternHint: lettersHint },
      { name: "t", kind: "string", minLen: 1, maxLen: 10, pattern: LETTERS, patternHint: lettersHint },
    ],
    examples: [
      { input: { s: "anagram", t: "nagaram" }, output: true },
      { input: { s: "rat", t: "car" }, output: false },
      { input: { s: "ab", t: "a" }, output: false },
    ],
    trace({ s, t }, T) {
      const sc = s.split("");
      const tc = t.split("");
      if (s.length !== t.length) {
        T.step(`"${s}" has ${s.length} letters but "${t}" has ${t.length}. Different lengths can never be anagrams → **false**.`, [
          arr("s", sc),
          arr("t", tc),
        ]);
        return false;
      }
      const answer = [...s].sort().join("") === [...t].sort().join("");
      const count = new Map();
      T.step("Same length. Tally every letter of s up (+1) and every letter of t down (−1). Anagrams end with every tally at zero.", [
        arr("s", sc),
        arr("t", tc),
        kv("tally", count),
      ]);
      for (let i = 0; i < s.length; i += 1) {
        count.set(s[i], (count.get(s[i]) || 0) + 1);
        count.set(t[i], (count.get(t[i]) || 0) - 1);
        const lastStep = i === s.length - 1;
        T.step(
          `'${s[i]}' from s adds one; '${t[i]}' from t takes one away.`,
          [
            arr("s", sc, { pointers: { i }, tones: { ...paint(0, i - 1, "visited"), [i]: "active" } }),
            arr("t", tc, { pointers: { i }, tones: { ...paint(0, i - 1, "visited"), [i]: "active" } }),
            kv("tally", count, { hot: s[i] }),
          ],
          { ask: lastStep ? yesNo("Is every tally back to zero?", answer) : undefined }
        );
      }
      const bad = [...count].find(([, v]) => v !== 0);
      T.step(
        bad ? `'${bad[0]}' ends at ${bad[1]}, not zero. **Not anagrams → false**.` : "Every tally is back to zero. **Anagrams → true**.",
        [arr("s", sc), arr("t", tc), kv("tally", count, bad ? { hot: bad[0], tone: "bad" } : { tone: "good" })]
      );
      return !bad;
    },
    java: `public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] tally = new int[26];
    for (int i = 0; i < s.length(); i++) {
        tally[s.charAt(i) - 'a']++;   // s adds
        tally[t.charAt(i) - 'a']--;   // t subtracts
    }
    for (int count : tally) if (count != 0) return false;
    return true;
}`,
    python: `def isAnagram(self, s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    tally = collections.Counter(s)
    tally.subtract(t)
    return all(count == 0 for count in tally.values())`,
    quiz: {
      q: "Why check the lengths first?",
      options: [
        "Different lengths can't be anagrams, so it's a free early exit",
        "The tally breaks otherwise",
        "Sorting requires equal lengths",
        "It makes the algorithm O(1)",
      ],
      answer: 0,
      why: "It's O(1) and rules out a whole class of inputs before any counting happens.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "group-anagrams",
    lc: 49,
    title: "Group Anagrams",
    world: "strings",
    difficulty: "Medium",
    pattern: "hashing",
    emoji: "🗂️",
    statement: "Group the strings that are anagrams of each other. The groups can be returned in any order.",
    story:
      "A mail room gets letters addressed in scrambled handwriting. The trick: alphabetise the letters of each address. \"eat\", \"tea\" and \"ate\" all become \"aet\" — the same pigeonhole.",
    insight: "Give every word a key that all its anagrams share (its sorted letters). Group words by key in a hash map.",
    complexity: { time: "O(n · k log k)", space: "O(n · k)", why: "n words of length k, each sorted once." },
    unordered: true,
    inputs: [
      { name: "strs", kind: "stringArray", minLen: 1, maxLen: 8, maxItemLen: 6, pattern: LETTERS, patternHint: lettersHint },
    ],
    examples: [
      { input: { strs: ["eat", "tea", "tan", "ate", "nat", "bat"] }, output: [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]] },
      { input: { strs: [""] }, output: [[""]] },
      { input: { strs: ["a"] }, output: [["a"]] },
    ],
    trace({ strs }, T) {
      const groups = new Map();
      const label = "key → group";
      T.step("Anagrams share the same letters, so sorting a word's letters gives all its anagrams the same **key**.", [
        arr("words", strs),
        kv(label, groups),
      ]);
      strs.forEach((w, i) => {
        const key = w.split("").sort().join("");
        const exists = groups.has(key);
        const done = paint(0, i - 1, "visited");
        T.step(`"${w}" sorted is "${key}".`, [
          arr("words", strs, { pointers: { i }, tones: { ...done, [i]: "active" } }),
          kv(label, groups, { hot: key }),
        ], { ask: yesNo(`Does the key "${key}" already have a group?`, exists) });
        if (!exists) groups.set(key, []);
        groups.get(key).push(w);
        T.step(exists ? `Key "${key}" already exists — "${w}" joins that group.` : `A brand-new key. Start a group for "${key}" with "${w}".`, [
          arr("words", strs, { pointers: { i }, tones: { ...done, [i]: "good" } }),
          kv(label, groups, { hot: key, tone: "good" }),
        ]);
      });
      const out = [...groups.values()];
      T.step(`**${out.length}** group${out.length === 1 ? "" : "s"}: ${formatValue(out)}.`, [
        arr("words", strs, { tones: paint(0, strs.length - 1, "visited") }),
        kv(label, groups),
      ]);
      return out;
    },
    java: `public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String word : strs) {
        char[] letters = word.toCharArray();
        Arrays.sort(letters);
        String key = new String(letters);                 // every anagram shares this key
        groups.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
    }
    return new ArrayList<>(groups.values());
}`,
    python: `def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
    groups = collections.defaultdict(list)
    for word in strs:
        groups["".join(sorted(word))].append(word)
    return list(groups.values())`,
    levelUp: "Sorting each word costs O(k log k). A 26-slot letter count used as the key brings it down to O(k) per word.",
    quiz: {
      q: "What makes a good key for grouping anagrams?",
      options: [
        "Something every anagram shares, like its sorted letters or a 26-letter count",
        "The word's first letter",
        "The word's length",
        "The word itself",
      ],
      answer: 0,
      why: "The key must be identical for all anagrams and different for everything else. Sorted letters or letter counts do exactly that.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "valid-parentheses",
    lc: 20,
    title: "Valid Parentheses",
    world: "strings",
    difficulty: "Easy",
    pattern: "stack",
    emoji: "🥞",
    statement: "Given a string of brackets ()[]{}, decide whether every bracket is closed by the same type, in the correct order.",
    story:
      "You're stacking pancakes. Every opening bracket puts a pancake on the pile. A closing bracket can only eat the pancake on top — and only if it's the matching flavour. At the end the plate must be empty.",
    insight: "Push openers onto a stack. Each closer must match the top of the stack. Valid means no mismatches and an empty stack at the end.",
    complexity: { time: "O(n)", space: "O(n)", why: "One pass; the stack can hold up to n openers." },
    inputs: [{ name: "s", kind: "string", minLen: 1, maxLen: 16, pattern: /^[()[\]{}]+$/, patternHint: "Use only the characters ( ) [ ] { }." }],
    examples: [
      { input: { s: "()[]{}" }, output: true },
      { input: { s: "(]" }, output: false },
      { input: { s: "([)]" }, output: false },
      { input: { s: "{[]}" }, output: true },
    ],
    trace({ s }, T) {
      const chars = s.split("");
      const partner = { ")": "(", "]": "[", "}": "{" };
      const st = [];
      T.step("Openers go on a stack. A closer must match whatever is on top.", [arr("s", chars), stack("open brackets", st)]);

      for (let i = 0; i < chars.length; i += 1) {
        const c = chars[i];
        const done = paint(0, i - 1, "visited");
        if (!partner[c]) {
          st.push(c);
          T.step(`'${c}' opens something. Push it and wait for its partner.`, [
            arr("s", chars, { pointers: { i }, tones: { ...done, [i]: "active" } }),
            stack("open brackets", st, { tone: "active" }),
          ]);
          continue;
        }
        const top = st[st.length - 1];
        const ok = top === partner[c];
        T.step(
          `'${c}' closes something. It has to match the top of the stack` + (top ? `, which is '${top}'.` : " — but the stack is empty."),
          [arr("s", chars, { pointers: { i }, tones: { ...done, [i]: "active" } }), stack("open brackets", st, { tone: "cmp" })],
          { ask: yesNo(`Does '${c}' match the top of the stack?`, ok) }
        );
        if (!ok) {
          T.step(`'${c}' can't close ${top ? `'${top}'` : "nothing"}. **Invalid → false**.`, [
            arr("s", chars, { pointers: { i }, tones: { ...done, [i]: "bad" } }),
            stack("open brackets", st, { tone: "bad" }),
          ]);
          return false;
        }
        st.pop();
        T.step(`'${top}' and '${c}' are partners. Pop the opener off.`, [
          arr("s", chars, { pointers: { i }, tones: { ...done, [i]: "good" } }),
          stack("open brackets", st),
        ]);
      }

      const valid = st.length === 0;
      T.step(valid ? "Every opener found its partner. **Valid → true**." : `${st.join(" ")} never got closed. **Invalid → false**.`, [
        arr("s", chars, { tones: paint(0, chars.length - 1, valid ? "good" : "visited") }),
        stack("open brackets", st, { tone: valid ? undefined : "bad" }),
      ]);
      return valid;
    },
    java: `public boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(') stack.push(')');       // push the closer we expect to see
        else if (c == '[') stack.push(']');
        else if (c == '{') stack.push('}');
        else if (stack.isEmpty() || stack.pop() != c) return false;
    }
    return stack.isEmpty();
}`,
    python: `def isValid(self, s: str) -> bool:
    partner = {")": "(", "]": "[", "}": "{"}
    stack = []
    for c in s:
        if c in partner:
            if not stack or stack.pop() != partner[c]:
                return False
        else:
            stack.append(c)
    return not stack`,
    quiz: {
      q: "Why is a stack the right structure here?",
      options: [
        "The most recently opened bracket must be the first one closed",
        "Stacks are faster than arrays",
        "Brackets arrive in sorted order",
        "Queues can't hold characters",
      ],
      answer: 0,
      why: "Last opened, first closed: that is literally the definition of a stack (LIFO).",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "valid-palindrome",
    lc: 125,
    title: "Valid Palindrome",
    world: "strings",
    difficulty: "Easy",
    pattern: "two-pointers",
    emoji: "🪞",
    statement:
      "After lowercasing and removing every non-alphanumeric character, decide whether a string reads the same forwards and backwards.",
    story:
      "Two friends start at opposite ends of a hallway lined with letters and walk toward each other, stepping over any furniture (spaces and punctuation). At every step they shout their letter. If they ever shout different letters, it's not a palindrome.",
    insight: "Two pointers from both ends: skip non-alphanumerics, compare case-insensitively, and move inward. No cleaned copy needed.",
    complexity: { time: "O(n)", space: "O(1)", why: "Each pointer crosses the string at most once, in place." },
    inputs: [{ name: "s", kind: "string", minLen: 1, maxLen: 32 }],
    examples: [
      { input: { s: "A man, a plan, a canal: Panama" }, output: true },
      { input: { s: "race a car" }, output: false },
      { input: { s: " " }, output: true },
    ],
    trace({ s }, T) {
      const chars = s.split("");
      const isAlnum = (c) => /[a-z0-9]/i.test(c);
      const status = {};
      let l = 0;
      let r = chars.length - 1;
      const view = (extra = {}) => arr("s", chars, { pointers: { L: l, R: r }, tones: { ...status, ...extra } });

      T.step("Walk in from both ends. Skip anything that isn't a letter or digit, and ignore upper/lower case.", [view()]);

      while (l < r) {
        const skipped = [];
        while (l < r && !isAlnum(chars[l])) {
          status[l] = "dim";
          skipped.push(l);
          l += 1;
        }
        while (l < r && !isAlnum(chars[r])) {
          status[r] = "dim";
          skipped.push(r);
          r -= 1;
        }
        if (skipped.length) {
          T.step(`Step over ${skipped.length} character${skipped.length === 1 ? "" : "s"} that ${skipped.length === 1 ? "isn't" : "aren't"} letters or digits.`, [view()]);
        }
        if (l >= r) break;
        const a = chars[l].toLowerCase();
        const b = chars[r].toLowerCase();
        T.step(`Compare '${a}' and '${b}'.`, [view({ [l]: "cmp", [r]: "cmp" })], { ask: yesNo(`Do '${a}' and '${b}' match?`, a === b) });
        if (a !== b) {
          T.step(`'${a}' ≠ '${b}'. **Not a palindrome → false**.`, [view({ [l]: "bad", [r]: "bad" })]);
          return false;
        }
        status[l] = "good";
        status[r] = "good";
        l += 1;
        r -= 1;
      }

      T.step("The pointers met without a single mismatch. **Palindrome → true**.", [
        arr("s", chars, { tones: { ...status, ...(l === r && isAlnum(chars[l] || "") ? { [l]: "good" } : {}) } }),
      ]);
      return true;
    },
    java: `public boolean isPalindrome(String s) {
    int l = 0, r = s.length() - 1;
    while (l < r) {
        while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;  // step over furniture
        while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
        if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;
        l++;
        r--;
    }
    return true;
}`,
    python: `def isPalindrome(self, s: str) -> bool:
    l, r = 0, len(s) - 1
    while l < r:
        while l < r and not s[l].isalnum():
            l += 1
        while l < r and not s[r].isalnum():
            r -= 1
        if s[l].lower() != s[r].lower():
            return False
        l, r = l + 1, r - 1
    return True`,
    quiz: {
      q: "What's the extra space used by the two-pointer approach?",
      options: [
        "O(1) — it compares in place without building a cleaned copy",
        "O(n), because of the two pointers",
        "O(n²)",
        "O(log n)",
      ],
      answer: 0,
      why: "Building a filtered, lowercased copy is O(n) space. Skipping in place with two indices avoids it entirely.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "longest-palindromic-substring",
    lc: 5,
    title: "Longest Palindromic Substring",
    world: "strings",
    difficulty: "Medium",
    pattern: "two-pointers",
    emoji: "🎯",
    statement: "Return the longest substring of s that is a palindrome.",
    story:
      "Drop a pebble in a pond and ripples spread out evenly in both directions. Every palindrome is a ripple around a center. Drop a pebble at every letter and every gap between letters, and watch how far each ripple spreads before the edges stop matching.",
    insight: "Try all 2n − 1 centers (letters and gaps). Expand outward while both ends match, and keep the longest.",
    complexity: { time: "O(n²)", space: "O(1)", why: "2n − 1 centers, each expanding up to n/2 steps." },
    inputs: [{ name: "s", kind: "string", minLen: 1, maxLen: 12, pattern: /^[A-Za-z0-9]+$/, patternHint: "Use letters and digits only." }],
    examples: [
      { input: { s: "babad" }, output: "bab" },
      { input: { s: "cbbd" }, output: "bb" },
      { input: { s: "racecar" }, output: "racecar" },
    ],
    trace({ s }, T) {
      const chars = s.split("");
      const n = chars.length;
      let best = [0, 0];
      const bestText = () => `"${s.slice(best[0], best[1] + 1)}"`;

      T.step("Every palindrome is a ripple around a center — a letter (odd length) or a gap (even length). Try every center.", [arr("s", chars)], {
        vars: { best: bestText() },
      });

      for (let c = 0; c < n; c += 1) {
        for (const even of [false, true]) {
          let l = c;
          let r = even ? c + 1 : c;
          if (r >= n) continue;
          const where = even ? `the gap after index ${c}` : `index ${c} ('${chars[c]}')`;
          if (chars[l] !== chars[r]) {
            T.step(`Center at ${where}: '${chars[l]}' ≠ '${chars[r]}', so no even ripple here.`, [
              arr("s", chars, { tones: { [l]: "bad", [r]: "bad" } }),
            ], { vars: { best: bestText() } });
            continue;
          }
          for (;;) {
            const canTry = l - 1 >= 0 && r + 1 < n;
            const grows = canTry && chars[l - 1] === chars[r + 1];
            const len = r - l + 1;
            const isBest = len > best[1] - best[0] + 1;
            if (isBest) best = [l, r];
            T.step(
              `Center at ${where}: "${s.slice(l, r + 1)}" is a palindrome of length ${len}.` + (isBest ? " Longest so far!" : ""),
              [
                arr("s", chars, {
                  window: [l, r],
                  pointers: { L: l, R: r },
                  tones: { ...paint(l, r, isBest ? "good" : "cmp"), ...(canTry ? { [l - 1]: "active", [r + 1]: "active" } : {}) },
                }),
              ],
              {
                vars: { best: bestText() },
                ask: canTry ? yesNo(`Do '${chars[l - 1]}' and '${chars[r + 1]}' match, so the ripple grows?`, grows) : undefined,
              }
            );
            if (!grows) break;
            l -= 1;
            r += 1;
          }
        }
      }

      T.step(`The longest palindrome is **${bestText()}**.`, [
        arr("s", chars, { window: [best[0], best[1]], tones: paint(best[0], best[1], "found") }),
      ], { vars: { best: bestText() } });
      return s.slice(best[0], best[1] + 1);
    },
    java: `public String longestPalindrome(String s) {
    int bestL = 0, bestR = 0;
    for (int c = 0; c < s.length(); c++) {
        for (int[] center : new int[][]{{c, c}, {c, c + 1}}) { // odd and even centers
            int l = center[0], r = center[1];
            while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) {
                l--;
                r++;
            }
            if (r - l - 1 > bestR - bestL + 1) {                // palindrome is l+1 .. r-1
                bestL = l + 1;
                bestR = r - 1;
            }
        }
    }
    return s.substring(bestL, bestR + 1);
}`,
    python: `def longestPalindrome(self, s: str) -> str:
    best = s[:1]
    for c in range(len(s)):
        for l, r in ((c, c), (c, c + 1)):   # odd and even centers
            while l >= 0 and r < len(s) and s[l] == s[r]:
                l, r = l - 1, r + 1
            if r - l - 1 > len(best):
                best = s[l + 1:r]
    return best`,
    levelUp: "Manacher's algorithm does this in O(n), but expand-around-center is what interviewers expect you to write.",
    quiz: {
      q: "Why are there 2n − 1 centers instead of n?",
      options: [
        "Even-length palindromes are centered on the gaps between letters",
        "Every letter gets checked twice for safety",
        "The last letter doesn't count",
        "Recursion doubles the work",
      ],
      answer: 0,
      why: "\"abba\" has no middle letter — its center is the gap between the two b's. n letters plus n − 1 gaps.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "palindromic-substrings",
    lc: 647,
    title: "Palindromic Substrings",
    world: "strings",
    difficulty: "Medium",
    pattern: "two-pointers",
    emoji: "🌊",
    statement: "Count how many substrings of s are palindromes. Substrings at different positions count separately.",
    story:
      "Same ripples as before, but now you're a lifeguard counting them. Every time a ripple spreads one more ring without breaking, that ring is one more palindrome.",
    insight: "Expand around all 2n − 1 centers. Every successful expansion step is exactly one new palindrome, so just count them.",
    complexity: { time: "O(n²)", space: "O(1)", why: "2n − 1 centers, each expanding up to n/2 steps." },
    inputs: [{ name: "s", kind: "string", minLen: 1, maxLen: 10, pattern: /^[a-z]+$/, patternHint: lettersHint }],
    examples: [
      { input: { s: "abc" }, output: 3 },
      { input: { s: "aaa" }, output: 6 },
      { input: { s: "abba" }, output: 6 },
    ],
    trace({ s }, T) {
      const chars = s.split("");
      const n = chars.length;
      let count = 0;
      T.step("Try every center. Each ring the ripple successfully spreads is one more palindrome.", [arr("s", chars)], { vars: { count } });

      for (let c = 0; c < n; c += 1) {
        for (const even of [false, true]) {
          let l = c;
          let r = even ? c + 1 : c;
          if (r >= n) continue;
          if (chars[l] !== chars[r]) {
            if (even) {
              T.step(`The gap after index ${c}: '${chars[l]}' ≠ '${chars[r]}', nothing here.`, [
                arr("s", chars, { tones: { [l]: "bad", [r]: "bad" } }),
              ], { vars: { count } });
            }
            continue;
          }
          while (l >= 0 && r < n && chars[l] === chars[r]) {
            count += 1;
            const canTry = l - 1 >= 0 && r + 1 < n;
            const grows = canTry && chars[l - 1] === chars[r + 1];
            T.step(`"${s.slice(l, r + 1)}" is a palindrome — count = **${count}**.`, [
              arr("s", chars, { window: [l, r], pointers: { L: l, R: r }, tones: { ...paint(l, r, "good"), ...(canTry ? { [l - 1]: "active", [r + 1]: "active" } : {}) } }),
            ], { vars: { count }, ask: canTry ? yesNo("Will this ripple spread one more ring?", grows) : undefined });
            l -= 1;
            r += 1;
          }
        }
      }

      T.step(`In total, **${count}** palindromic substrings.`, [arr("s", chars)], { vars: { count } });
      return count;
    },
    java: `public int countSubstrings(String s) {
    int count = 0;
    for (int c = 0; c < s.length(); c++) {
        count += expand(s, c, c) + expand(s, c, c + 1); // odd + even centers
    }
    return count;
}

private int expand(String s, int l, int r) {
    int found = 0;
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) {
        found++;                                         // one more ring, one more palindrome
        l--;
        r++;
    }
    return found;
}`,
    python: `def countSubstrings(self, s: str) -> int:
    count = 0
    for c in range(len(s)):
        for l, r in ((c, c), (c, c + 1)):
            while l >= 0 and r < len(s) and s[l] == s[r]:
                count += 1
                l, r = l - 1, r + 1
    return count`,
    quiz: {
      q: "Why does each successful expansion add exactly one to the count?",
      options: [
        "Each step outward reveals one new, longer palindrome with the same center",
        "It counts letters, not substrings",
        "Palindromes always come in pairs",
        "It's an estimate that happens to be exact",
      ],
      answer: 0,
      why: "Different centers or different radii are different substrings, so nothing is ever double counted.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "encode-and-decode-strings",
    lc: 271,
    title: "Encode and Decode Strings",
    world: "strings",
    difficulty: "Medium",
    pattern: "design",
    emoji: "📦",
    statement:
      "Design encode(list of strings) → one string, and decode(that string) → the original list. The strings may contain any character.",
    story:
      "You're shipping parcels on one conveyor belt. A plain separator fails the moment a parcel contains the separator. Instead, stamp each parcel's exact size on its label. The receiver reads the label, then grabs exactly that many characters — no guessing.",
    insight: "Encode each word as length + '#' + word. Decode by reading digits up to '#', then taking exactly that many characters.",
    complexity: { time: "O(total characters)", space: "O(total characters)", why: "Every character is written once and read once." },
    inputs: [{ name: "strs", kind: "stringArray", minLen: 1, maxLen: 5, maxItemLen: 6 }],
    examples: [
      { input: { strs: ["neet", "code", "love", "you"] }, output: ["neet", "code", "love", "you"] },
      { input: { strs: ["we", "say", ":", "yes"] }, output: ["we", "say", ":", "yes"] },
      { input: { strs: ["", "#3"] }, output: ["", "#3"] },
    ],
    trace({ strs }, T) {
      let encoded = "";
      T.step("Joining with a separator breaks as soon as a word contains it. Stamp each word with its **length** and a '#' instead.", [
        arr("words", strs),
        text("encoded", '""'),
      ]);
      strs.forEach((w, i) => {
        const piece = `${w.length}#${w}`;
        encoded += piece;
        T.step(`"${w}" becomes **${piece}**.`, [
          arr("words", strs, { pointers: { i }, tones: { ...paint(0, i - 1, "visited"), [i]: "active" } }),
          text("encoded", JSON.stringify(encoded)),
        ]);
      });

      const chars = encoded.split("");
      const out = [];
      const lengthAt = (start) => Number(encoded.slice(start, encoded.indexOf("#", start)));
      let i = 0;
      T.step("Now decode. Read digits up to '#' — that's the length — then take exactly that many characters, even if they include '#' or digits.", [
        arr("encoded", chars),
        arr("decoded", out),
      ], { ask: chars.length ? pickNumber("How long is the first word?", lengthAt(0)) : undefined });

      while (i < chars.length) {
        const j = encoded.indexOf("#", i);
        const len = Number(encoded.slice(i, j));
        const word = encoded.slice(j + 1, j + 1 + len);
        out.push(word);
        const next = j + 1 + len;
        T.step(`The label "${encoded.slice(i, j)}#" says the next word is **${len}** characters: "${word}".`, [
          arr("encoded", chars, {
            window: len > 0 ? [j + 1, j + len] : undefined,
            pointers: { i },
            tones: { ...paint(0, i - 1, "dim"), ...paint(i, j, "cmp"), ...paint(j + 1, j + len, "good") },
          }),
          arr("decoded", out, { tones: { [out.length - 1]: "good" } }),
        ], { ask: next < chars.length ? pickNumber("How long is the next word?", lengthAt(next)) : undefined });
        i = next;
      }

      T.step(`Decoded back to ${formatValue(out)} — a perfect round trip.`, [
        arr("encoded", chars, { tones: paint(0, chars.length - 1, "dim") }),
        arr("decoded", out, { tones: paint(0, out.length - 1, "found") }),
      ]);
      return out;
    },
    java: `public String encode(List<String> strs) {
    StringBuilder sb = new StringBuilder();
    for (String s : strs) sb.append(s.length()).append('#').append(s); // length#word
    return sb.toString();
}

public List<String> decode(String str) {
    List<String> out = new ArrayList<>();
    int i = 0;
    while (i < str.length()) {
        int j = str.indexOf('#', i);                  // digits before '#' are the length
        int len = Integer.parseInt(str.substring(i, j));
        out.add(str.substring(j + 1, j + 1 + len));   // take exactly len chars, whatever they are
        i = j + 1 + len;
    }
    return out;
}`,
    python: `def encode(self, strs: List[str]) -> str:
    return "".join(f"{len(s)}#{s}" for s in strs)

def decode(self, s: str) -> List[str]:
    out, i = [], 0
    while i < len(s):
        j = s.index("#", i)
        length = int(s[i:j])
        out.append(s[j + 1:j + 1 + length])
        i = j + 1 + length
    return out`,
    quiz: {
      q: "Why prefix lengths instead of joining with a delimiter like ','?",
      options: [
        "A delimiter can appear inside a word; a length says exactly how many characters to read",
        "Commas are slower to process",
        "Length prefixes compress the data",
        "Delimiters don't work in Java",
      ],
      answer: 0,
      why: "Try [\"a,b\", \"c\"] with commas and it decodes as three words. The length prefix makes the format unambiguous.",
    },
  },
];
