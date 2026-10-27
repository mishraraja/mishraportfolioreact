// Read literal public content without executing lesson code or importing secrets.
const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("@babel/parser");
function literal(node) {
  if (!node) return undefined;
  if (["StringLiteral", "NumericLiteral", "BooleanLiteral"].includes(node.type)) return node.value;
  if (node.type === "TemplateLiteral" && !node.expressions.length) return node.quasis[0].value.cooked;
  if (node.type === "ArrayExpression") return node.elements.map(literal);
  if (node.type === "ObjectExpression") return Object.fromEntries(node.properties.filter((p) => p.type === "ObjectProperty" && !p.computed).map((p) => [p.key.name || p.key.value, literal(p.value)]));
  return undefined;
}
function data(file) {
  const ast = parse(fs.readFileSync(file, "utf8"), { sourceType: "module" });
  return Object.fromEntries(ast.program.body.filter((n) => n.type === "ExportNamedDeclaration" && n.declaration?.type === "VariableDeclaration").flatMap((n) => n.declaration.declarations.map((d) => [d.id.name, literal(d.init)])));
}
const entries = [];
function add(id, title, href, content) {
  const text = content.filter((s) => typeof s === "string" && s.trim()).join(" ").replace(/\s+/g, " ").trim();
  if (!text) throw new Error("Missing public text: " + id);
  entries.push({ id, title, href, text });
}
const { profile, focusAreas } = data("src/data/profile.js");
add("profile", "About Raja", "/#about", [profile.positioning, ...profile.bio, profile.education.degree, "Education: " + profile.education.period, "Interests: " + profile.hobbies.join(", ")]);
add("skills", "Skills", "/#skills", focusAreas.map((a) => a.label + ": " + a.detail));
add("contact", "Contact Raja", "/#contact", ["Email: " + profile.social.email, "LinkedIn: " + profile.social.linkedin, "GitHub: " + profile.social.github, profile.openToWork ? "Raja is open to work." : "Check the contact section for availability."]);
add("resume", "Resume", profile.resumeUrl, ["Download Raja Mishra's resume from the resume link on the portfolio."]);
const { projects } = data("src/data/projects.js");
add("projects", "Projects overview", "/#projects", ["Projects: " + projects.map((p) => p.title).join(", ") + "."]);
for (const p of projects) add("project:" + p.id, p.title, "/#projects", [p.description, p.problem, p.solution, "Role: " + p.role, "Stack: " + p.stack.join(", "), p.period]);
for (const file of fs.readdirSync("src/dsa/data/problems").filter((f) => f.endsWith(".js")).sort()) {
  for (const values of Object.values(data(path.join("src/dsa/data/problems", file)))) {
    if (!Array.isArray(values)) continue;
    for (const p of values.filter((p) => p?.slug)) add("dsa:" + p.slug, p.title, "/dsa/" + p.slug, [p.statement, p.insight, "Pattern: " + p.pattern, p.complexity && `Time: ${p.complexity.time}. Space: ${p.complexity.space}. ${p.complexity.why}`]);
  }
}
for (const file of fs.readdirSync("src/java/data/topics").filter((f) => f.endsWith(".js")).sort()) {
  for (const c of data(path.join("src/java/data/topics", file)).concepts || []) add("java:" + c.id, c.title, "/java/" + file.replace(/\.js$/, ""), [c.say, ...(c.points || [])]);
}
add("dsa", "DSA Arcade", "/dsa", ["DSA Arcade contains animated interview problems, Java and Python solutions, quizzes, a pattern playbook, an eight-week roadmap and browser-saved progress."]);
add("java", "Java Backend Arcade", "/java", ["Java Backend Arcade includes topic worlds, concept cards, interactive labs, topic quizzes, games and a revision sheet. Labs are browser simulations, not a Java runtime."]);
add("learning", "Progress, backups and offline learning", "/learning", ["Learning tools provide revision based on quiz answers, JSON progress backups and optional offline downloads. Learning progress stays in your browser. Google sign-in is optional and requires configuration; it does not sync progress between devices."]);
add("engineering", "How this site works", "/engineering", ["This portfolio uses React, JavaScript and CSS on Vercel. Arcades load as separate chunks. Browser storage saves learning progress. The technical case study explains the architecture and its limitations."]);
if (new Set(entries.map((e) => e.id)).size !== entries.length) throw new Error("Duplicate chat source IDs");
fs.mkdirSync("src/chat", { recursive: true });
fs.writeFileSync("src/chat/site-index.json", JSON.stringify(entries, null, 2) + "\n");
console.log(`Chat index: ${entries.length} public sources`);
