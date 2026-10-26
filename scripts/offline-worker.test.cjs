const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

function setup({ fail = false } = {}) {
  const events = {};
  const deleted = [];
  const saved = new Map([["/index.html", "saved app"], ["/static/app.js", "saved js"]]);
  const cache = { match: async (key) => saved.get(key), addAll: async () => { if (fail) throw new Error("download failed"); } };
  let claimed = false;
  const context = {
    OFFLINE_RELEASE: "new", OFFLINE_ASSETS: ["/index.html", "/static/app.js"],
    importScripts() {}, URL, Request: class { constructor(url) { this.url = url; } },
    fetch: async () => { throw new Error("offline"); },
    caches: { open: async () => cache, keys: async () => ["other-app", "rm-learning-old", "rm-learning-new"], delete: async (name) => deleted.push(name) },
    self: { location: { origin: "https://example.test" }, addEventListener: (name, handler) => { events[name] = handler; }, clients: { claim: async () => { claimed = true; } } },
  };
  vm.runInNewContext(fs.readFileSync("public/offline-worker.js", "utf8"), context);
  function fetchEvent(path, mode = "navigate", method = "GET") {
    let response;
    events.fetch({ request: { url: path.startsWith("http") ? "" + path : "https://example.test" + path, mode, method }, respondWith: (promise) => { response = promise; } });
    return response;
  }
  async function lifecycle(name) { let pending; events[name]({ waitUntil: (promise) => { pending = promise; } }); await pending; }
  return { fetchEvent, lifecycle, deleted, claimed: () => claimed };
}

test("offline deep links receive the cached app and JS receives its cached asset", async () => {
  const app = setup();
  assert.equal(await app.fetchEvent("/java/core-java"), "saved app");
  assert.equal(await app.fetchEvent("/dsa/two-sum?skipIntro=1"), "saved app");
  assert.equal(await app.fetchEvent("/static/app.js", "cors"), "saved js");
});
test("authentication, external traffic, API and writes bypass offline caching", () => {
  const app = setup();
  for (const url of ["/api/progress", "/__/auth/handler", "https://accounts.google.com/", "/data/github.json"]) assert.equal(app.fetchEvent(url), undefined);
  assert.equal(app.fetchEvent("/learning", "navigate", "POST"), undefined);
});
test("activation removes only stale caches owned by this app", async () => {
  const app = setup();
  await app.lifecycle("activate");
  assert.deepEqual(app.deleted, ["rm-learning-old"]);
  assert.equal(app.claimed(), true);
});
test("failed installation discards the partial new release", async () => {
  const app = setup({ fail: true });
  await assert.rejects(app.lifecycle("install"), /download failed/);
  assert.deepEqual(app.deleted, ["rm-learning-new"]);
});
