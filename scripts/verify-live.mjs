import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

// Verify actual asset bytes, not just that a SPA rewrite returns HTTP 200.
const site = new URL(process.env.SITE_URL || "https://www.rajamishra.me");
const local = JSON.parse(await readFile("build/asset-manifest.json", "utf8"));
async function get(path) {
  const response = await fetch(new URL(path, site), { signal: AbortSignal.timeout(20000), cache: "no-store" });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response;
}
const home = await get("/");
const html = await home.text();
if (!html.includes("<title>Raja Mishra")) throw new Error("The live page does not identify this portfolio.");
console.log(`Live site: ${home.url} (HTTP ${home.status})`);
const remote = await (await get("/asset-manifest.json")).json();
if (JSON.stringify(local) !== JSON.stringify(remote)) throw new Error("Live assets differ from this production build. Deployment may still be pending.");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const assets = [...new Set([...Object.values(local.files), "/data/github.json", "/favicon.svg", "/manifest.json", "/offline-worker.js", "/offline-assets.js", "/offline-info.json"])];
let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < assets.length) {
    const asset = assets[next++];
    const [expected, response] = await Promise.all([readFile(`build/${asset.replace(/^\//, "")}`), get(asset)]);
    if (hash(expected) !== hash(new Uint8Array(await response.arrayBuffer()))) throw new Error(`Live asset bytes differ: ${asset}`);
  }
}));
console.log(`Verified SHA-256: ${assets.length} scripts, styles and public assets`);
for (const path of ["/dsa/two-sum", "/java/core-java", "/learning", "/engineering"]) {
  const content = await (await get(path)).text();
  if (!local.entrypoints.some((asset) => asset.endsWith(".js") && content.includes(asset))) throw new Error(`Unexpected route document: ${path}`);
  console.log(`Verified route document: ${path}`);
}
const deployment = await (await get("/deployment.json")).json();
const expectedCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (deployment.sourceCommit && deployment.sourceCommit !== expectedCommit) throw new Error(`Deployed source commit differs: ${deployment.sourceCommit}`);
console.log(`Deployment source commit: ${deployment.sourceCommit || "not provided by host"}`);
console.log("Live site matches this build. Route interactions are covered by the browser suite.");
