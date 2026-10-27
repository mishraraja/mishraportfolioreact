const STOP = new Set("a an the is are was were be been has have had built use uses using do does did can could would should i you your me my he his she it its this that these those and or to of for in on with about tell explain please what how which where when who any anything know give show raja mishra site website portfolio".split(" "));
function tokens(text) {
  return [...new Set(text.toLowerCase().replace(/\b(contact|email|reach|hire|hiring)\b/g, "contact").replace(/\b(projects?)\b/g, "project").replace(/\b(skills?|technologies|tech)\b/g, "skill").match(/[a-z0-9]+/g) || [])].filter((t) => t.length > 1 && !STOP.has(t));
}
function search(question, entries) {
  let words = tokens(question);
  if (!words.length && /\b(who|about)\b/i.test(question) && /raja|you|developer|portfolio/i.test(question)) words = ["experience"];
  if (!words.length) return [];
  const ranked = entries.map((entry) => {
    const title = new Set(tokens(entry.title + " " + entry.id));
    const body = new Set(tokens(entry.text));
    const matched = words.filter((w) => title.has(w) || body.has(w));
    return { entry, matches: matched.length, score: matched.reduce((s, w) => s + (title.has(w) ? 4 : 1), 0) };
  }).filter((r) => r.matches / words.length >= 0.5).sort((a, b) => b.score - a.score);
  return ranked.filter((r) => r.score >= (ranked[0]?.score || 0) / 2).slice(0, 3).map((r) => r.entry);
}
function fallback(question, entries) {
  if (/^(hi|hello|hey|thanks|thank you)[!.\s]*$/i.test(question.trim())) return { mode: "local", answer: "Hi! Ask about Raja's work, projects, Java topics or DSA problems.", sources: [] };
  const sources = search(question, entries);
  return { mode: "local", answer: sources.length ? "Here are the closest passages from this site:" : "I don't have that information on this site. Try a project name, a Java topic, a DSA problem, or ask how to contact Raja.", sources: sources.map(({ id, title, href, text }) => ({ id, title, href, text: text.slice(0, 1100) + (text.length > 1100 ? "…" : "") })) };
}
export { search, fallback };
