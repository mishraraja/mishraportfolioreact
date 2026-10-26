import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const manifest = JSON.parse(readFileSync("build/asset-manifest.json", "utf8"));
const size = (file) => gzipSync(readFileSync(path.join("build", file.replace(/^\//, "")))).length;
const entries = manifest.entrypoints;
const checks = [
  ["Initial JavaScript", entries.filter((p) => p.endsWith(".js")), 185 * 1024],
  ["Initial CSS", entries.filter((p) => p.endsWith(".css")), 25 * 1024],
  ["All JavaScript", [...new Set(Object.values(manifest.files).filter((p) => p.endsWith(".js")))], 800 * 1024],
];
for (const [label, files, budget] of checks) {
  const bytes = files.reduce((sum, file) => sum + size(file), 0);
  console.log(`${label}: ${(bytes / 1024).toFixed(1)} KiB gzip / ${budget / 1024} KiB budget`);
  if (bytes > budget) process.exitCode = 1;
}
