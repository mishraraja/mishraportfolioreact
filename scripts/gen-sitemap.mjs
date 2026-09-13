#!/usr/bin/env node
/**
 * Writes sitemap.xml into the build output after every production build,
 * so search engines always see the current section list without anyone
 * maintaining the file by hand.
 */

import { writeFile, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILD = resolve(__dirname, "../build");
const SITE = process.env.SITE_URL || "https://rajamishra.vercel.app";

const ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
];

async function main() {
  try {
    await access(BUILD);
  } catch {
    console.log("No build directory yet — skipping sitemap.");
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const urls = ROUTES.map(
    (r) =>
      "  <url>\n" +
      "    <loc>" + SITE + r.path + "</loc>\n" +
      "    <lastmod>" + today + "</lastmod>\n" +
      "    <changefreq>" + r.changefreq + "</changefreq>\n" +
      "    <priority>" + r.priority + "</priority>\n" +
      "  </url>"
  ).join("\n");

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls +
    "\n</urlset>\n";

  await writeFile(resolve(BUILD, "sitemap.xml"), xml, "utf8");

  const robots =
    "User-agent: *\n" +
    "Allow: /\n\n" +
    "Sitemap: " + SITE + "/sitemap.xml\n";
  await writeFile(resolve(BUILD, "robots.txt"), robots, "utf8");

  console.log("Wrote sitemap.xml and robots.txt for " + SITE);
}

main().catch((err) => {
  console.error("Sitemap generation failed: " + err.message);
  process.exit(0);
});
