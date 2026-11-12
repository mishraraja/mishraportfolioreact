import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const build = resolve("build");
const manifest = JSON.parse(await readFile(resolve(build, "asset-manifest.json"), "utf8"));
const assets = [...new Set(["/index.html", "/favicon.svg", ...Object.values(manifest.files).filter((path) => /\.(js|css)$/.test(path))])].sort();
const hash = createHash("sha256");
let bytes = 0;
for (const asset of assets) {
  const data = await readFile(resolve(build, "." + asset));
  hash.update(asset); hash.update(data); bytes += data.length;
}
hash.update(await readFile(resolve(build, "offline-worker.js")));
const revision = hash.digest("hex").slice(0, 16);
await writeFile(resolve(build, "offline-assets.js"), `const OFFLINE_RELEASE = ${JSON.stringify(revision)};\nconst OFFLINE_ASSETS = ${JSON.stringify(assets)};\n`);
await writeFile(resolve(build, "offline-info.json"), JSON.stringify({ revision, files: assets.length, bytes }));
console.log(`Offline bundle: ${assets.length} files, ${(bytes / 1024 / 1024).toFixed(2)} MB before compression, release ${revision}`);
