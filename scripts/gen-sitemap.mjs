#!/usr/bin/env node
/**
 * Writes sitemap.xml into the build output after every production build,
 * so search engines always see the current page list without anyone
 * maintaining the file by hand. Arcade problem pages are read straight from
 * the problem data, so a new problem shows up here automatically.
 */

import { writeFile, access, mkdir, readdir, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_SITE_URL } from "./site-config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILD = resolve(__dirname, "../build");
const PROBLEMS = resolve(__dirname, "../src/dsa/data/problems");
const JAVA = resolve(__dirname, "../src/java");
// Keep sitemap URLs on the bare-domain origin that serves the canonical pages.
// A stale Vercel SITE_URL override previously emitted www URLs that redirected.
const SITE = CANONICAL_SITE_URL;

const ROUTES = [
  { path: "/learning", priority: "0.7", changefreq: "monthly" },
  { path: "/engineering", priority: "0.7", changefreq: "monthly" },
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/dsa", priority: "0.9", changefreq: "weekly" },
  { path: "/dsa/learn/patterns", priority: "0.8", changefreq: "monthly" },
  { path: "/dsa/learn/roadmap", priority: "0.8", changefreq: "monthly" },
  { path: "/dsa/learn/big-o", priority: "0.7", changefreq: "monthly" },
  { path: "/dsa/learn/interview", priority: "0.7", changefreq: "monthly" },
  { path: "/dsa/radar", priority: "0.7", changefreq: "monthly" },
  { path: "/java", priority: "0.9", changefreq: "weekly" },
  { path: "/java/labs", priority: "0.8", changefreq: "monthly" },
  { path: "/java/revise", priority: "0.8", changefreq: "monthly" },
  { path: "/java/play/this-or-that", priority: "0.7", changefreq: "monthly" },
  { path: "/java/play/guess-output", priority: "0.7", changefreq: "monthly" },
];

/** Backend Arcade worlds and labs, read from their data files (top-level `id:` entries only). */
async function javaRoutes() {
  try {
    const worlds = await readFile(resolve(JAVA, "data/worlds.js"), "utf8");
    const labs = await readFile(resolve(JAVA, "labs/index.js"), "utf8");
    const ids = (source) => [...source.matchAll(/^ {4}id: "([^"]+)"/gm)].map((m) => m[1]);
    return [
      ...ids(worlds).map((id) => ({ path: "/java/" + id, priority: "0.7", changefreq: "monthly" })),
      ...ids(labs).map((id) => ({ path: "/java/lab/" + id, priority: "0.6", changefreq: "monthly" })),
    ];
  } catch (error) {
    throw new Error("Could not read Java routes", { cause: error });
  }
}

async function problemRoutes() {
  try {
    const files = (await readdir(PROBLEMS)).filter((f) => f.endsWith(".js"));
    const slugs = [];
    for (const file of files) {
      const source = await readFile(resolve(PROBLEMS, file), "utf8");
      for (const match of source.matchAll(/slug: "([^"]+)"/g)) slugs.push(match[1]);
    }
    return slugs.sort().map((slug) => ({ path: "/dsa/" + slug, priority: "0.6", changefreq: "monthly" }));
  } catch (error) {
    throw new Error("Could not read DSA routes", { cause: error });
  }
}

function pageLabel(path) {
  if (path === "/") return "Raja Mishra | Java Backend Developer";

  const parts = path.split("/").filter(Boolean);
  const words = (value) => value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  if (parts[0] === "dsa") {
    if (parts[1] === "learn") return `${words(parts.slice(2).join(" "))} | DSA Learning`;
    return `${words(parts.slice(1).join(" "))} | Data Structures & Algorithms`;
  }
  if (parts[0] === "java") {
    if (parts[1] === "lab") return `${words(parts.slice(2).join(" "))} | Java Lab`;
    if (parts[1] === "play") return `${words(parts.slice(2).join(" "))} | Java Practice`;
    return `${words(parts.slice(1).join(" "))} | Java Backend`;
  }
  if (path === "/learning") return "Interactive Learning Tools";
  if (path === "/engineering") return "Engineering Projects & Case Studies";
  return words(parts.join(" "));
}

function pageDescription(path, label) {
  if (path === "/") {
    return "Raja Mishra is a Java backend developer with 5+ years building reliable Spring Boot services using Kafka, PostgreSQL and AWS. Explore his work and projects.";
  }
  if (path.startsWith("/dsa")) {
    return `Explore ${label} with Raja Mishra: practical data structures and algorithms explanations, examples, and interactive practice.`.slice(0, 155);
  }
  if (path.startsWith("/java")) {
    return `Explore ${label} with Raja Mishra: Java backend concepts, practical examples, and interactive learning exercises.`.slice(0, 155);
  }
  if (path === "/engineering") {
    return "Read Raja Mishra's engineering case studies on backend systems, software projects, and technical decisions.";
  }
  if (path === "/learning") {
    return "Use Raja Mishra's interactive learning tools to review topics, practice, and track progress without an account.";
  }
  return `Explore ${label} and more software engineering work by Raja Mishra.`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function replaceMeta(html, attribute, key, content) {
  const selector = new RegExp(`<meta\\s+${attribute}="${key}"[^>]*>`, "s");
  if (!selector.test(html)) throw new Error(`Missing ${attribute}=${key} metadata`);
  return html.replace(selector, `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`);
}

async function writeRouteDocuments(routes) {
  const template = await readFile(resolve(BUILD, "index.html"), "utf8");
  const homeDescription =
    "Raja Mishra is a Java backend developer with 5+ years building reliable Spring Boot services using Kafka, PostgreSQL and AWS. Explore his work and projects.";
  const homeFallback =
    `<main><h1>Raja Mishra | Java Backend Developer</h1>` +
    `<p>${escapeHtml(homeDescription)}</p></main>`;
  await writeFile(
    resolve(BUILD, "index.html"),
    template.replace('<div id="root"></div>', `<div id="root">${homeFallback}</div>`),
    "utf8"
  );

  for (const route of routes) {
    if (route.path === "/") continue;

    const label = pageLabel(route.path);
    const title = `${label} | Raja Mishra`;
    const description = pageDescription(route.path, label);
    const canonical = SITE + route.path;
    const fallback =
      `<main><h1>${escapeHtml(label)}</h1>` +
      `<p>${escapeHtml(description)}</p></main>`;

    let html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
    html = html.replace(/<link rel="canonical" href="[^"]+" \/>/, `<link rel="canonical" href="${canonical}" />`);
    html = replaceMeta(html, "name", "description", description);
    html = replaceMeta(html, "property", "og:url", canonical);
    html = replaceMeta(html, "property", "og:title", title);
    html = replaceMeta(html, "property", "og:description", description);
    html = replaceMeta(html, "name", "twitter:title", title);
    html = replaceMeta(html, "name", "twitter:description", description);
    html = html.replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);

    const output = resolve(BUILD, route.path.slice(1) + ".html");
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, html, "utf8");
  }
}

async function main() {
  try {
    await access(BUILD);
  } catch {
    console.log("No build directory yet — skipping sitemap.");
    return;
  }

  const routes = [...ROUTES, ...(await problemRoutes()), ...(await javaRoutes())];

  await writeRouteDocuments(routes);

  const urls = routes.map(
    (r) =>
      "  <url>\n" +
      "    <loc>" + SITE + r.path + "</loc>\n" +
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

  console.log("Wrote sitemap.xml (" + routes.length + " pages), route metadata, and robots.txt for " + SITE);
}

main().catch((err) => {
  console.error("Sitemap generation failed: " + err.message);
  process.exitCode = 1;
});
