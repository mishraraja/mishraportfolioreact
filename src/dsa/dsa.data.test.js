import { PROBLEMS } from "./data";
import { WORLDS } from "./data/worlds";
import { PATTERNS } from "./data/patterns";
import { ROADMAP } from "./data/roadmap";
import { runTrace, canonical, parseInputs, formatField, formatValue, MAX_FRAMES } from "./engine/trace";

const PANEL_TYPES = new Set(["array", "grid", "map", "stack", "text", "bits", "intervals", "tree", "list", "graph"]);
const TONES = new Set([undefined, "active", "cmp", "good", "bad", "found", "visited", "dim"]);

function tonesOf(panel) {
  const out = [];
  if (panel.tones) out.push(...Object.values(panel.tones));
  if (panel.tone) out.push(panel.tone);
  (panel.nodes || []).forEach((n) => out.push(n.tone));
  (panel.edges || []).forEach((e) => !Array.isArray(e) && out.push(e.tone));
  (panel.items || []).forEach((i) => i && typeof i === "object" && !Array.isArray(i) && out.push(i.tone));
  (panel.rows || []).forEach((r) => r && r.tones && out.push(...Object.values(r.tones)));
  return out;
}

describe("catalogue", () => {
  test("holds all 75 problems", () => {
    expect(PROBLEMS).toHaveLength(75);
  });

  test("slugs and LeetCode numbers are unique", () => {
    expect(new Set(PROBLEMS.map((p) => p.slug)).size).toBe(75);
    expect(new Set(PROBLEMS.map((p) => p.lc)).size).toBe(75);
  });

  test("every problem has everything the pages render", () => {
    const worlds = new Set(WORLDS.map((w) => w.id));
    const patterns = new Set(PATTERNS.map((p) => p.id));
    PROBLEMS.forEach((p) => {
      expect({ slug: p.slug, world: worlds.has(p.world) }).toEqual({ slug: p.slug, world: true });
      expect({ slug: p.slug, pattern: patterns.has(p.pattern) }).toEqual({ slug: p.slug, pattern: true });
      expect(["Easy", "Medium", "Hard"]).toContain(p.difficulty);
      ["title", "emoji", "statement", "story", "insight", "java", "python"].forEach((field) => {
        expect(typeof p[field]).toBe("string");
        expect(p[field].length).toBeGreaterThan(0);
      });
      expect(p.complexity.time && p.complexity.space && p.complexity.why).toBeTruthy();
      expect(p.inputs.length).toBeGreaterThan(0);
      expect(p.examples.length).toBeGreaterThan(0);
      expect(typeof p.trace).toBe("function");
      expect(p.quiz.options.length).toBeGreaterThanOrEqual(3);
      expect(p.quiz.answer).toBeGreaterThanOrEqual(0);
      expect(p.quiz.answer).toBeLessThan(p.quiz.options.length);
      expect(p.quiz.why).toBeTruthy();
    });
  });

  test("every pattern is used by at least one problem", () => {
    PATTERNS.forEach((pattern) => {
      expect({ pattern: pattern.id, used: PROBLEMS.some((p) => p.pattern === pattern.id) }).toEqual({ pattern: pattern.id, used: true });
    });
  });

  test("the roadmap covers every problem exactly once", () => {
    const slugs = ROADMAP.flatMap((w) => w.slugs);
    expect(slugs).toHaveLength(75);
    expect(new Set(slugs)).toEqual(new Set(PROBLEMS.map((p) => p.slug)));
  });
});

describe.each(PROBLEMS.map((p) => [p.slug, p]))("%s", (slug, problem) => {
  test("every example animates its way to the right answer", () => {
    problem.examples.forEach(({ input, output }) => {
      const { frames, result } = runTrace(problem, input);
      const norm = problem.unordered ? canonical : (x) => x;
      expect({ input, result: norm(result) }).toEqual({ input, result: norm(output) });
      expect(frames.length).toBeGreaterThanOrEqual(1);
      expect(frames.length).toBeLessThanOrEqual(MAX_FRAMES + 1);

      frames.forEach((frame, i) => {
        expect(typeof frame.say).toBe("string");
        expect(frame.say).not.toMatch(/undefined|NaN|\[object Object\]/);
        frame.panels.forEach((panel) => {
          expect(PANEL_TYPES.has(panel.type)).toBe(true);
          tonesOf(panel).forEach((tone) => expect(TONES.has(tone)).toBe(true));
        });
        if (frame.vars) Object.values(frame.vars).forEach((v) => expect(formatValue(v)).not.toMatch(/NaN|undefined/));
        if (frame.ask) {
          expect(i).toBeLessThan(frames.length - 1);
          expect(frame.ask.options.length).toBeGreaterThanOrEqual(2);
          expect(new Set(frame.ask.options).size).toBe(frame.ask.options.length);
          expect(frame.ask.answer).toBeGreaterThanOrEqual(0);
          expect(frame.ask.answer).toBeLessThan(frame.ask.options.length);
        }
      });
    });
  });

  test("every example survives a round trip through the playground inputs", () => {
    problem.examples.forEach(({ input }) => {
      const raw = Object.fromEntries(problem.inputs.map((spec) => [spec.name, formatField(spec, input[spec.name])]));
      const parsed = parseInputs(problem, raw);
      expect({ input, errors: parsed.errors }).toEqual({ input, errors: undefined });
      expect(parsed.input).toEqual(input);
    });
  });
});
