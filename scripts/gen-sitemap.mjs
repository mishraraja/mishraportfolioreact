#!/usr/bin/env node
/**
 * Writes sitemap.xml into the build output after every production build,
 * so search engines always see the current page list without anyone
 * maintaining the file by hand. Arcade problem pages are read straight from
 * the problem data, so a new problem shows up here automatically.
 */

import { writeFile, access, readdir, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILD = resolve(__dirname, "../build");
const PROBLEMS = resolve(__dirname, "../src/dsa/data/problems");
const SITE = process.env.SITE_URL || "https://rajamishra.vercel.app";

const ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/dsa", priority: "0.9", changefreq: "weekly" },
  { path: "/dsa/learn/patterns", priority: "0.8", changefreq: "monthly" },
  { path: "/dsa/learn/roadmap", priority: "0.8", changefreq: "monthly" },
  { path: "/dsa/learn/big-o", priority: "0.7", changefreq: "monthly" },
  { path: "/dsa/learn/interview", priority: "0.7", changefreq: "monthly" },
  { path: "/dsa/radar", priority: "0.7", changefreq: "monthly" },
];

async function problemRoutes() {
  try {
    const files = (await readdir(PROBLEMS)).filter((f) => f.endsWith(".js"));
    const slugs = [];
    for (const file of files) {
      const source = await readFile(resolve(PROBLEMS, file), "utf8");
      for (const match of source.matchAll(/slug: "([^"]+)"/g)) slugs.push(match[1]);
    }
    return slugs.sort().map((slug) => ({ path: "/dsa/" + slug, priority: "0.6", changefreq: "monthly" }));
  } catch {
    return [];
  }
}

async function main() {
  try {
    await access(BUILD);
  } catch {
    console.log("No build directory yet — skipping sitemap.");
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const routes = [...ROUTES, ...(await problemRoutes())];

  const urls = routes.map(
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

  console.log("Wrote sitemap.xml (" + routes.length + " pages) and robots.txt for " + SITE);
}

main().catch((err) => {
  console.error("Sitemap generation failed: " + err.message);
  process.exit(0);
});
