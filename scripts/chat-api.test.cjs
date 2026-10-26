const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const entries = require("../src/chat/site-index.json");
const { search, fallback } = require("../src/chat/search.js");
const originalFetch = global.fetch;
const savedEnv = { CHAT_AI_ENABLED: process.env.CHAT_AI_ENABLED, GEMINI_API_KEY: process.env.GEMINI_API_KEY, GEMINI_MODEL: process.env.GEMINI_MODEL };
afterEach(() => { global.fetch = originalFetch; for (const [key, value] of Object.entries(savedEnv)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
function handler() { delete require.cache[require.resolve("../api/chat")]; return require("../api/chat"); }
async function call(run, body = { question: "Explain Two Sum", useAI: true }, options = {}) {
  const req = { method: "POST", headers: { host: "example.test", origin: "https://example.test", "content-type": "application/json", "x-forwarded-for": "127.0.0.1" }, body, ...options };
  const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await run(req, res); return res;
}
function enable() { process.env.CHAT_AI_ENABLED = "true"; process.env.GEMINI_API_KEY = "test-server-secret"; process.env.GEMINI_MODEL = "test-model"; }
function reply(answer = "Two Sum uses a hash map.", sourceIds = ["dsa:two-sum"]) { return { ok: true, json: async () => ({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ answer, sourceIds }) }] } }] }) }; }

test("index contains the public learning content and safe local links", () => {
  assert.equal(entries.filter((s) => s.id.startsWith("dsa:")).length, 75);
  assert.ok(entries.filter((s) => s.id.startsWith("java:")).length > 50);
  assert.ok(entries.every((s) => /^\/(?!\/)/.test(s.href) && s.text.length > 0));
});
test("common questions retrieve useful sources and unknown topics stay unknown", () => {
  assert.equal(search("Explain Two Sum", entries)[0].id, "dsa:two-sum");
  assert.equal(search("How do I contact Raja?", entries)[0].id, "contact");
  assert.deepEqual(search("Which technologies does Raja use?", entries).map((s) => s.id), ["skills"]);
  assert.match(search("Explain stack", entries)[0].title, /stack/i);
  assert.ok(search("What projects has Raja built?", entries).some((s) => s.id === "projects"));
  assert.equal(search("What is Raja's salary?", entries).length, 0);
  assert.equal(fallback("hello", entries).sources.length, 0);
});
test("missing configuration returns local results without contacting Google", async () => {
  delete process.env.GEMINI_API_KEY;
  global.fetch = async () => { throw new Error("Must not call provider"); };
  const result = await call(handler());
  assert.equal(result.body.mode, "local");
  assert.equal(result.body.sources[0].id, "dsa:two-sum");
});
test("consent and relevance are required before any AI request", async () => {
  enable(); let calls = 0;
  global.fetch = async () => { calls++; return reply(); };
  const run = handler();
  await call(run, { question: "Explain Two Sum", useAI: false });
  await call(run, { question: "What's the weather tomorrow?", useAI: true });
  assert.equal(calls, 0);
});
test("invalid requests, foreign origins and unsupported methods are rejected", async () => {
  const run = handler();
  for (const body of [null, { question: "x".repeat(601), useAI: true }, { question: "hello", useAI: "yes" }, { question: "hello", useAI: true, context: "invented" }]) assert.equal((await call(run, body)).code, 400);
  assert.equal((await call(run, undefined, { headers: { host: "example.test", origin: "https://other.test" } })).code, 403);
  assert.equal((await call(run, undefined, { method: "PUT" })).code, 405);
});
test("AI receives server-owned sources; secrets never appear in the response", async () => {
  enable(); let payload;
  global.fetch = async (url, options) => { assert.ok(!url.includes("test-server-secret")); assert.equal(options.headers["x-goog-api-key"], "test-server-secret"); payload = JSON.parse(options.body); return reply(); };
  const result = await call(handler());
  assert.equal(result.body.mode, "ai");
  assert.equal(result.body.sources[0].href, "/dsa/two-sum");
  assert.ok(payload.systemInstruction.parts[0].text.includes("only from"));
  assert.ok(!JSON.stringify(result.body).includes("test-server-secret"));
});
test("provider errors and invented citations fall back to excerpts", async () => {
  enable(); const run = handler();
  global.fetch = async () => ({ ok: false });
  assert.equal((await call(run)).body.mode, "local");
  global.fetch = async () => reply("Invented answer", ["unknown-source"]);
  assert.equal((await call(run)).body.mode, "local");
  global.fetch = async () => { throw new Error("network timeout"); };
  assert.equal((await call(run)).body.mode, "local");
});
test("provider can decline unsupported facts despite a partial search match", async () => {
  enable(); global.fetch = async () => reply("", []);
  assert.equal((await call(handler())).body.answer, "I don't have that information on this site.");
});
test("per-instance throttling stops repeated calls while preserving site results", async () => {
  enable(); let calls = 0; global.fetch = async () => { calls++; return reply(); };
  const run = handler();
  for (let i = 0; i < 6; i++) await call(run);
  assert.equal(calls, 5);
  assert.equal((await call(run)).body.mode, "local");
});
