import { readFile, writeFile } from "node:fs/promises";

// Keep the offline bundle and size checks on the same manifest contract.
const vite = JSON.parse(await readFile("build/.vite/manifest.json", "utf8"));
const files = {};
for (const [key, chunk] of Object.entries(vite)) {
  files[key] = "/" + chunk.file;
  for (const asset of [...(chunk.css || []), ...(chunk.assets || [])]) files[asset] = "/" + asset;
}
const entrypoints = new Set();
const visited = new Set();
function visit(key) {
  if (visited.has(key)) return;
  visited.add(key);
  const chunk = vite[key];
  if (!chunk) throw new Error(`Missing build chunk: ${key}`);
  for (const dependency of chunk.imports || []) visit(dependency);
  entrypoints.add(chunk.file);
  for (const css of chunk.css || []) entrypoints.add(css);
}
for (const [key, chunk] of Object.entries(vite)) if (chunk.isEntry) visit(key);
if (!entrypoints.size) throw new Error("Production build has no entrypoint.");
await writeFile("build/asset-manifest.json", JSON.stringify({ files, entrypoints: [...entrypoints] }, null, 2));
