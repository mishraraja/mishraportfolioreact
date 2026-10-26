const PREFIX = "rm-learning-";
export async function prepareOffline() {
  if (!window.isSecureContext || !("serviceWorker" in navigator) || !("caches" in window)) throw new Error("Offline saving needs a supported browser using HTTPS or localhost.");
  if (process.env.NODE_ENV !== "production") throw new Error("Offline saving is available on the deployed site or a local production build.");
  const reg = await navigator.serviceWorker.register("/offline-worker.js", { updateViaCache: "none" });
  await reg.update();
  const worker = reg.installing || reg.waiting || reg.active;
  if (!worker) throw new Error("Offline setup could not start. Please retry.");
  if (!["installed", "activated"].includes(worker.state)) await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error("Offline saving took too long. Check your connection and retry.")); }, 60000);
    const changed = () => {
      if (["installed", "activated"].includes(worker.state)) { cleanup(); resolve(); }
      else if (worker.state === "redundant") { cleanup(); reject(new Error("Offline saving failed. Check available storage and retry.")); }
    };
    function cleanup() { clearTimeout(timer); worker.removeEventListener("statechange", changed); }
    worker.addEventListener("statechange", changed);
    changed();
  });
  // Updating is explicit: never replace a running version during a lesson.
  reg.waiting?.postMessage({ type: "ACTIVATE_UPDATE" });
  return "Learning pages saved. Open a lesson once now, then it will also work without a connection. Saved content may be removed by your browser when storage is low.";
}

export async function removeOffline() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter((r) => [r.active, r.waiting, r.installing].some((w) => w && new URL(w.scriptURL).pathname === "/offline-worker.js")).map((r) => r.unregister()));
  }
  if ("caches" in window) await Promise.all((await caches.keys()).filter((key) => key.startsWith(PREFIX)).map((key) => caches.delete(key)));
  return "Offline downloads removed. Your learning progress is unchanged. Reload to stop the current offline worker.";
}

export async function hasOfflineCopy() {
  if (!("caches" in window)) return false;
  return (await caches.keys()).some((key) => key.startsWith(PREFIX));
}
