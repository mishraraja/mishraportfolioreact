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
import { parse } from "@babel/parser";
import { CANONICAL_SITE_URL } from "./site-config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILD = resolve(__dirname, "../build");
const PROBLEMS = resolve(__dirname, "../src/dsa/data/problems");
const JAVA = resolve(__dirname, "../src/java");
// Keep sitemap URLs on the bare-domain origin that serves the canonical pages.
// A stale Vercel SITE_URL override previously emitted www URLs that redirected.
const SITE = CANONICAL_SITE_URL;

function readLiteral(node) {
  if (!node) return undefined;
  if (["StringLiteral", "NumericLiteral", "BooleanLiteral"].includes(node.type)) return node.value;
  if (node.type === "NullLiteral") return null;
  if (node.type === "TemplateLiteral" && !node.expressions.length) return node.quasis[0].value.cooked;
  if (node.type === "ArrayExpression") return node.elements.map(readLiteral);
  if (node.type === "ObjectExpression") {
    return Object.fromEntries(node.properties
      .filter((property) => property.type === "ObjectProperty" && !property.computed)
      .map((property) => [property.key.name || property.key.value, readLiteral(property.value)]));
  }
  return undefined;
}

async function exportedData(file) {
  const source = await readFile(file, "utf8");
  const ast = parse(source, { sourceType: "module" });
  return Object.fromEntries(ast.program.body
    .filter((item) => item.type === "ExportNamedDeclaration" && item.declaration?.type === "VariableDeclaration")
    .flatMap((item) => item.declaration.declarations.map((declaration) => [declaration.id.name, readLiteral(declaration.init)])));
}

const ROUTES = [
  { path: "/learning", priority: "0.7", changefreq: "monthly" },
  { path: "/engineering", priority: "0.7", changefreq: "monthly" },
  { path: "/java/guide", priority: "0.8", changefreq: "monthly" },
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
    const worldData = await exportedData(resolve(JAVA, "data/worlds.js"));
    const labs = await readFile(resolve(JAVA, "labs/index.js"), "utf8");
    const ids = (source) => [...source.matchAll(/^ {4}id: "([^"]+)"/gm)].map((m) => m[1]);
    const worldTopics = await Promise.all((worldData.WORLDS || []).map(async (world) => {
      const data = await exportedData(resolve(JAVA, "data/topics", world.id + ".js"));
      return [world.id, { world, concepts: data.concepts || [] }];
    }));
    return [
      ...worldTopics.map(([id, content]) => ({
        path: "/java/" + id,
        priority: "0.7",
        changefreq: "monthly",
        description: `${content.world.name}: ${content.world.blurb}`.slice(0, 155),
        fallbackHtml: javaWorldFallback(content.world, content.concepts),
      })),
      ...ids(labs).map((id) => ({ path: "/java/lab/" + id, priority: "0.6", changefreq: "monthly" })),
    ];
  } catch (error) {
    throw new Error("Could not read Java routes", { cause: error });
  }
}

async function problemRoutes() {
  try {
    const files = (await readdir(PROBLEMS)).filter((f) => f.endsWith(".js"));
    const problems = [];
    for (const file of files) {
      const data = await exportedData(resolve(PROBLEMS, file));
      for (const value of Object.values(data)) {
        if (Array.isArray(value)) problems.push(...value.filter((problem) => problem && problem.slug && problem.title));
      }
    }
    return problems.sort((a, b) => a.slug.localeCompare(b.slug)).map((problem) => ({
      path: "/dsa/" + problem.slug,
      priority: "0.6",
      changefreq: "monthly",
      description: `${problem.title}: ${problem.statement}`.slice(0, 155),
      fallbackHtml: problemFallback(problem),
    }));
  } catch (error) {
    throw new Error("Could not read DSA routes", { cause: error });
  }
}

function problemFallback(problem) {
  const complexity = problem.complexity || {};
  const example = problem.examples?.[0];
  const parts = [
    `<main><h1>${escapeHtml(problem.title)}</h1>`,
    `<p>${escapeHtml(problem.statement || "")}</p>`,
    problem.story && `<section><h2>A way to picture it</h2><p>${escapeHtml(problem.story)}</p></section>`,
    problem.insight && `<section><h2>How to approach it</h2><p>${escapeHtml(problem.insight)}</p></section>`,
    example && `<section><h2>Example</h2><p>Input: <code>${escapeHtml(JSON.stringify(example.input))}</code>. Output: <code>${escapeHtml(JSON.stringify(example.output))}</code>.</p></section>`,
    (complexity.time || complexity.space) && `<p>Complexity: ${escapeHtml(complexity.time || "")}${complexity.space ? ` time and ${escapeHtml(complexity.space)} space` : ""}. ${escapeHtml(complexity.why || "")}</p>`,
    `<p>This page includes an animated walkthrough, Java and Python solutions, and a question to check your understanding.</p></main>`,
  ];
  return parts.filter(Boolean).join("");
}

function javaWorldFallback(world, concepts) {
  const parts = [
    `<main><h1>${escapeHtml(world.name)}</h1>`,
    `<p>${escapeHtml(world.tagline)} ${escapeHtml(world.blurb)}</p>`,
    `<section><h2>Topics in this section</h2>`,
    ...concepts.slice(0, 6).map((concept) => {
      const explanation = concept.simple || concept.points?.[0] || concept.say || "";
      return `<article><h3>${escapeHtml(concept.title)}</h3><p>${escapeHtml(explanation)}</p></article>`;
    }),
    `</section><p>Each topic pairs a plain-language explanation with code, interview questions, and related practice where available.</p></main>`,
  ];
  return parts.join("");
}

function pageLabel(path) {
  if (path === "/") return "Raja Mishra | Java Backend Developer";
  if (path === "/java/guide") return "How Java Projects Work";

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
    return "Raja Mishra is a Java backend developer working with Spring Boot, PostgreSQL, and AWS. Explore selected projects, experience, and Java learning tools.";
  }
  if (path === "/java/guide") {
    return "Follow a Java application from source code through JVM memory, Spring, HTTP requests, databases, deployment, and production troubleshooting.";
  }
  if (path.startsWith("/dsa")) {
    if (path === "/dsa") return "Practice data structures and algorithms with worked examples, interactive problem traces, and Java and Python solutions.";
    return `Learn ${label.toLowerCase()} with worked examples and interactive practice in Raja Mishra's DSA Arcade.`.slice(0, 155);
  }
  if (path.startsWith("/java")) {
    return `Read about ${label.toLowerCase()} with Java examples, interview questions, and interactive exercises.`.slice(0, 155);
  }
  if (path === "/engineering") {
    return "Case studies from Raja Mishra's software work, with the problem, implementation, and technical choices in each project.";
  }
  if (path === "/learning") {
    return "Practice software engineering concepts with short interactive tools and check what you understand as you go.";
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
    "Raja Mishra is a Java backend developer working with Spring Boot, PostgreSQL, and AWS. Explore selected projects, experience, and Java learning tools.";
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
    const description = route.description || pageDescription(route.path, label);
    const canonical = SITE + route.path;
    const fallback = route.fallbackHtml ||
      `<main><h1>${escapeHtml(label)}</h1>` +
      `<p>${escapeHtml(description)}</p></main>`;

    let html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
    // The Person JSON-LD in index.html describes the homepage profile. Do not
    // copy its homepage mainEntityOfPage value onto unrelated route documents.
    html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, "");
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
