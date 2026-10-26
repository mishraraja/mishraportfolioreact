import { KEYS, createBackup, parseBackup, restoreBackup, recordAnswer, readProgress, recommendations, validateProgress } from "./storage";

const DAY = 86400000;
const dsa = { xp: 35, problems: { "two-sum": { seen: true, watched: true, mastered: true, masteredAt: 100, reviewedAt: 100, reviews: 0 } }, days: ["2026-10-15"], predict: { right: 1, total: 2 }, radarBest: 3, last: "two-sum" };
const java = { xp: 10, concepts: { "jvm:stack": true }, labs: { "hello-java": { missions: ["compile"], done: false } }, bosses: { jvm: { best: 2, won: false, perfect: false } }, games: { output: 3 }, days: [], last: "/java/jvm" };
beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

test("round trips all learning records without exporting unrelated storage or tokens", () => {
  localStorage.setItem(KEYS.dsa, JSON.stringify(dsa));
  localStorage.setItem(KEYS.java, JSON.stringify(java));
  localStorage.setItem("auth-token", "must-not-export");
  recordAnswer("dsa:two-sum", "Two Sum", "/dsa/two-sum", false, DAY);
  const backup = parseBackup(JSON.stringify(createBackup()));
  expect(JSON.stringify(backup)).not.toContain("must-not-export");
  localStorage.clear();
  restoreBackup(backup);
  expect(readProgress("dsa")).toEqual(dsa);
  expect(readProgress("java")).toEqual(java);
  expect(readProgress("reviews")["dsa:two-sum"].wrong).toBe(1);
});

test.each([
  { ...dsa, xp: -1 },
  { ...dsa, predict: { right: 5, total: 2 } },
  { ...dsa, problems: { x: { mastered: "yes" } } },
  { ...dsa, unknown: true },
  { ...dsa, problems: JSON.parse('{"__proto__":{"mastered":true}}') },
])("rejects malformed progress before any storage writes", (invalid) => {
  const backup = createBackup();
  backup.data.dsa = invalid;
  localStorage.setItem(KEYS.java, JSON.stringify(java));
  expect(() => restoreBackup(backup)).toThrow();
  expect(readProgress("java")).toEqual(java);
  expect(localStorage.getItem(KEYS.dsa)).toBeNull();
});

test("rejects unsupported, oversized and broken backups", () => {
  expect(() => parseBackup("{" )).toThrow("not valid JSON");
  expect(() => parseBackup("x".repeat(1024 * 1024 + 1))).toThrow("1 MB");
  expect(() => parseBackup(JSON.stringify({ ...createBackup(), version: 2 }))).toThrow("not a supported");
});

test("rolls back earlier writes when a later section cannot be saved", () => {
  localStorage.setItem(KEYS.dsa, JSON.stringify(dsa));
  const backup = createBackup();
  backup.data.dsa.xp = 999;
  backup.data.java = java;
  const original = Storage.prototype.setItem;
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(function(key, value) {
    if (key === KEYS.java) throw new Error("quota");
    return original.call(this, key, value);
  });
  expect(() => restoreBackup(backup)).toThrow("Could not save");
  expect(readProgress("dsa")).toEqual(dsa);
});

test("an empty section explicitly clears the old section", () => {
  const empty = createBackup();
  localStorage.setItem(KEYS.dsa, JSON.stringify(dsa));
  restoreBackup(empty);
  expect(readProgress("dsa")).toBeNull();
});

test("wrong answers are prioritized and early repeats cannot extend intervals", () => {
  recordAnswer("dsa:a", "A", "/dsa/a", true, DAY);
  recordAnswer("dsa:b", "B", "/dsa/b", false, DAY);
  recordAnswer("dsa:a", "A", "/dsa/a", true, DAY + 100);
  expect(readProgress("reviews")["dsa:a"]).toMatchObject({ streak: 1, dueAt: 2 * DAY });
  expect(recommendations(readProgress("reviews"), DAY)[0].id).toBe("dsa:b");
  recordAnswer("dsa:b", "B", "/dsa/b", true, DAY + 100);
  expect(readProgress("reviews")["dsa:b"]).toMatchObject({ streak: 1, dueAt: 2 * DAY });
  expect(recommendations(readProgress("reviews"), DAY).every((r) => r.priority === 2)).toBe(true);
  recordAnswer("dsa:a", "A", "/dsa/a", true, 2 * DAY);
  expect(readProgress("reviews")["dsa:a"]).toMatchObject({ streak: 2, dueAt: 5 * DAY });
  recordAnswer("dsa:a", "A", "/dsa/a", false, 5 * DAY);
  expect(readProgress("reviews")["dsa:a"]).toMatchObject({ streak: 0, dueAt: 6 * DAY });
});

test("damaged or blocked storage does not crash quiz recording", () => {
  localStorage.setItem(KEYS.dsa, "broken");
  expect(readProgress("dsa")).toBeNull();
  expect(() => createBackup()).toThrow();
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  expect(recordAnswer("dsa:a", "A", "/dsa/a", true)).toBe(false);
});

test("review links cannot redirect visitors outside learning routes", () => {
  recordAnswer("dsa:a", "A", "/dsa/a", true, DAY);
  const reviews = readProgress("reviews");
  reviews["dsa:a"].href = "https://example.com";
  expect(() => validateProgress("reviews", reviews)).toThrow();
});

test("reserved record IDs cannot corrupt answer history", () => {
  expect(recordAnswer("constructor", "A", "/dsa/a", true)).toBe(false);
  expect(localStorage.getItem(KEYS.reviews)).toBeNull();
});
