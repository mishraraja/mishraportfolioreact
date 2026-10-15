import { WORLDS } from "./data/worlds";
import { CONCEPTS, bossFor, conceptsInWorld, getConcept } from "./data";
import { VERSUS } from "./data/versus";
import { PUZZLES } from "./data/outputs";
import { LABS, getLab, labsInWorld } from "./labs";
import { bucketIndex, javaHash, spread } from "./labs/hash";
import { LEVELS, passMark } from "./progress";
import { seededOrder } from "./shuffle";

const LANGS = ["java", "sql", "shell", "yaml", "gherkin"];

describe("worlds and concept cards", () => {
  test("there are ten worlds with unique ids", () => {
    expect(WORLDS).toHaveLength(10);
    expect(new Set(WORLDS.map((w) => w.id)).size).toBe(10);
  });

  test("every world has at least five cards and a five-question boss", () => {
    WORLDS.forEach((w) => {
      expect(conceptsInWorld(w.id).length).toBeGreaterThanOrEqual(5);
      expect(bossFor(w.id)).toHaveLength(5);
    });
  });

  test("concept ids are unique across every world", () => {
    const ids = CONCEPTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getConcept(ids[0])).not.toBeNull();
  });

  test("every card has what the three tabs render", () => {
    CONCEPTS.forEach((c) => {
      expect(c.title).toBeTruthy();
      expect(c.emoji).toBeTruthy();
      expect(c.simple.length).toBeGreaterThan(40);
      expect(c.points.length).toBeGreaterThan(1);
      expect(c.say).toBeTruthy();
      expect(c.trap).toBeTruthy();
      if (c.lang) expect(LANGS).toContain(c.lang);
      if (c.lab) expect(getLab(c.lab)).not.toBeNull();
    });
  });

  test("markdown-ish emphasis in cards is balanced", () => {
    CONCEPTS.forEach((c) => {
      [c.simple, c.say, c.trap, ...c.points].forEach((text) => {
        expect((text.match(/\*\*/g) || []).length % 2).toBe(0);
        expect((text.match(/`/g) || []).length % 2).toBe(0);
      });
    });
  });

  test("boss answers point at a real, unique option and explain why", () => {
    WORLDS.forEach((w) => {
      bossFor(w.id).forEach((q) => {
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(4);
        expect(q.why).toBeTruthy();
      });
    });
  });
});

describe("games", () => {
  test("every This or That clue answers a or b", () => {
    VERSUS.forEach((pair) => {
      expect(WORLDS.map((w) => w.id)).toContain(pair.world);
      expect(pair.a).not.toBe(pair.b);
      pair.clues.forEach((clue) => {
        expect(["a", "b"]).toContain(clue.answer);
        expect(clue.text).toBeTruthy();
        expect(clue.why).toBeTruthy();
      });
    });
  });

  test("puzzles have unique ids, valid answers and a known level", () => {
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
    PUZZLES.forEach((p) => {
      expect(WORLDS.map((w) => w.id)).toContain(p.world);
      expect(["Warm-up", "Tricky", "Evil"]).toContain(p.level);
      expect(p.options).toHaveLength(4);
      expect(new Set(p.options).size).toBe(4);
      expect(p.options[p.answer]).toBeDefined();
      expect(p.why).toBeTruthy();
      if (p.lang) expect(LANGS).toContain(p.lang);
    });
  });
});

describe("labs", () => {
  test("every lab belongs to a world and has missions and takeaways", () => {
    expect(new Set(LABS.map((l) => l.id)).size).toBe(LABS.length);
    LABS.forEach((lab) => {
      expect(WORLDS.map((w) => w.id)).toContain(lab.world);
      expect(lab.missions.length).toBeGreaterThan(1);
      expect(new Set(lab.missions.map((m) => m.id)).size).toBe(lab.missions.length);
      expect(lab.takeaways.length).toBeGreaterThan(0);
      expect(typeof lab.Component).toBe("function");
    });
  });

  test("every lab is linked from at least one concept card", () => {
    LABS.forEach((lab) => {
      expect(CONCEPTS.some((c) => c.lab === lab.id)).toBe(true);
    });
  });

  test("labsInWorld splits the labs without losing any", () => {
    const total = WORLDS.reduce((n, w) => n + labsInWorld(w.id).length, 0);
    expect(total).toBe(LABS.length);
  });
});

describe("the HashMap lab's arithmetic", () => {
  test("javaHash matches Java's String.hashCode", () => {
    expect(javaHash("")).toBe(0);
    expect(javaHash("hello")).toBe(99162322);
    expect(javaHash("java")).toBe(3254818);
    expect(javaHash("Aa")).toBe(2112);
    expect(javaHash("BB")).toBe(2112);
    // overflows exactly to Integer.MIN_VALUE in Java
    expect(javaHash("polygenelubricants")).toBe(-2147483648);
  });

  test("the bucket index is the spread hash masked by capacity − 1", () => {
    const h = javaHash("pen");
    expect(bucketIndex(h, 16)).toBe(spread(h) & 15);
    expect(bucketIndex(javaHash("Aa"), 16)).toBe(bucketIndex(javaHash("BB"), 16));
  });
});

describe("progress rules", () => {
  test("a boss allows exactly one mistake", () => {
    expect(passMark(5)).toBe(4);
  });

  test("levels start at zero and climb", () => {
    expect(LEVELS[0].min).toBe(0);
    LEVELS.slice(1).forEach((level, i) => expect(level.min).toBeGreaterThan(LEVELS[i].min));
  });

  test("seeded order is a stable permutation", () => {
    const a = seededOrder(4, "seed");
    expect(a).toEqual(seededOrder(4, "seed"));
    expect([...a].sort()).toEqual([0, 1, 2, 3]);
  });
});
