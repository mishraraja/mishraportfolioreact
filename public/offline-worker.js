/* Generated asset list is written during the production build. */
/* global OFFLINE_RELEASE, OFFLINE_ASSETS */
importScripts("/offline-assets.js");
const CACHE = "rm-learning-" + OFFLINE_RELEASE;
const allowed = new Set(OFFLINE_ASSETS);
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll(OFFLINE_ASSETS.map((url) => new Request(url, { cache: "reload" })));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("rm-learning-") && name !== CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;
  // Do not intercept auth, API, GitHub snapshots or unrelated files.
  if (allowed.has(url.pathname) && url.pathname !== "/index.html") {
    event.respondWith(caches.open(CACHE).then(async (cache) => (await cache.match(url.pathname)) || fetch(event.request)));
  } else if (event.request.mode === "navigate" && /^(\/|\/learning\/?|\/engineering\/?|\/dsa(?:\/.*)?|\/java(?:\/.*)?)$/.test(url.pathname)) {
    event.respondWith(fetch(event.request).catch(async () => (await caches.open(CACHE)).match("/index.html")));
  }
});
