export const KEYS = { dsa: "rm.dsa.progress.v1", java: "rm.java.progress.v1", reviews: "rm.reviews.v1" };
export const MAX_BACKUP_BYTES = 1024 * 1024;
const DAY = 86400000;
const ID = /^[a-z0-9][a-z0-9:-]{0,119}$/;
const PATH = /^\/(dsa|java)\/[a-z0-9/-]+$/;
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
function requireValue(condition, message = "The backup contains invalid progress data.") {
  if (!condition) throw new Error(message);
}
function number(v) { requireValue(Number.isSafeInteger(v) && v >= 0); return v; }
function bool(v) { requireValue(typeof v === "boolean"); return v; }
function text(v, max = 240) { requireValue(typeof v === "string" && v.length <= max); return v; }
function fields(value, schema) {
  requireValue(isObject(value));
  const out = {};
  Object.entries(value).forEach(([key, item]) => {
    requireValue(Object.prototype.hasOwnProperty.call(schema, key));
    out[key] = schema[key](item);
  });
  return out;
}
function map(value, validate) {
  requireValue(isObject(value) && Object.keys(value).length <= 2000);
  return Object.fromEntries(Object.entries(value).map(([id, item]) => {
    requireValue(ID.test(id) && !["constructor", "prototype", "__proto__"].includes(id));
    return [id, validate(item)];
  }));
}
function list(value, validate, max = 2000) {
  requireValue(Array.isArray(value) && value.length <= max);
  return value.map(validate);
}
const days = (v) => list(v, (d) => { requireValue(/^\d{4}-\d{2}-\d{2}$/.test(d)); return d; }, 120);
const last = (v) => v === null ? null : text(v);
const record = (v) => fields(v, { seen: bool, watched: bool, mastered: bool, masteredAt: number, reviewedAt: number, reviews: number });
export function validateProgress(kind, value) {
  if (value === null) return null;
  let cleaned;
  if (kind === "dsa") {
    cleaned = fields(value, { xp: number, problems: (v) => map(v, record), days, predict: (v) => {
      const p = fields(v, { right: number, total: number });
      requireValue(p.right <= p.total); return p;
    }, radarBest: number, last });
    requireValue(["xp", "problems", "days", "predict", "radarBest", "last"].every((k) => k in cleaned));
  } else if (kind === "java") {
    cleaned = fields(value, { xp: number, concepts: (v) => map(v, bool), days, last,
      labs: (v) => map(v, (r) => { const lab = fields(r, { missions: (m) => list(m, (s) => { requireValue(ID.test(s)); return s; }), done: bool }); requireValue(Array.isArray(lab.missions) && typeof lab.done === "boolean"); return lab; }),
      bosses: (v) => map(v, (r) => { const boss = fields(r, { best: number, won: bool, perfect: bool }); requireValue(["best", "won", "perfect"].every((k) => k in boss)); return boss; }),
      games: (v) => map(v, number) });
    requireValue(["xp", "concepts", "labs", "bosses", "games", "days", "last"].every((k) => k in cleaned));
  } else if (kind === "reviews") {
    cleaned = map(value, (r) => {
      const review = fields(r, { title: text, href: (s) => { requireValue(PATH.test(s)); return s; }, attempts: number, wrong: number, streak: number, lastAt: number, dueAt: number, lastWrongAt: number });
      requireValue(["title", "href", "attempts", "wrong", "streak", "lastAt", "dueAt", "lastWrongAt"].every((k) => k in review));
      requireValue(review.wrong <= review.attempts && review.streak <= review.attempts);
      return review;
    });
  } else throw new Error("Unknown progress type.");
  return cleaned;
}

export function readProgress(kind) {
  try { return validateProgress(kind, JSON.parse(localStorage.getItem(KEYS[kind]) || "null")); }
  catch { return null; }
}

export function recordAnswer(id, title, href, correct, now = Date.now()) {
  if (!ID.test(id) || ["constructor", "prototype", "__proto__"].includes(id) || !PATH.test(href)) return false;
  const reviews = readProgress("reviews") || {};
  const old = reviews[id] || { attempts: 0, wrong: 0, streak: 0, lastAt: 0, dueAt: 0, lastWrongAt: 0 };
  // Repeated answers in one session do not lengthen the review interval.
  const streak = correct ? Math.max(1, old.streak + (now >= old.dueAt ? 1 : 0)) : 0;
  const interval = [1, 3, 7, 14, 30][Math.min(Math.max(streak - 1, 0), 4)];
  reviews[id] = { title: title.slice(0, 240), href, attempts: old.attempts + 1, wrong: old.wrong + (correct ? 0 : 1), streak, lastAt: now, lastWrongAt: correct ? old.lastWrongAt : now, dueAt: correct && now < old.dueAt ? old.dueAt : now + (correct ? interval : 1) * DAY };
  try { localStorage.setItem(KEYS.reviews, JSON.stringify(reviews)); return true; }
  catch { return false; }
}

export function recommendations(reviews, now = Date.now()) {
  return Object.entries(reviews || {}).map(([id, r]) => ({ id, ...r,
    reason: r.streak === 0 ? "Review after an incorrect answer" : r.dueAt <= now ? "Scheduled review is due" : "Next scheduled review",
    priority: r.streak === 0 ? 0 : r.dueAt <= now ? 1 : 2,
  })).sort((a, b) => a.priority - b.priority || a.dueAt - b.dueAt);
}

export function createBackup() {
  const data = {};
  for (const kind of Object.keys(KEYS)) {
    const raw = localStorage.getItem(KEYS[kind]);
    // Do not silently drop damaged data from a backup.
    data[kind] = validateProgress(kind, raw === null ? null : JSON.parse(raw));
  }
  return { format: "raja-learning-backup", version: 1, exportedAt: new Date().toISOString(), data };
}

export function parseBackup(raw) {
  requireValue(typeof raw === "string" && new Blob([raw]).size <= MAX_BACKUP_BYTES, "Backup must be smaller than 1 MB.");
  let backup;
  try { backup = JSON.parse(raw); } catch { throw new Error("This file is not valid JSON."); }
  requireValue(backup?.format === "raja-learning-backup" && backup.version === 1 && isObject(backup.data), "This is not a supported learning backup.");
  requireValue(Object.keys(backup.data).length === 3 && Object.keys(KEYS).every((k) => Object.prototype.hasOwnProperty.call(backup.data, k)));
  return { ...backup, data: Object.fromEntries(Object.keys(KEYS).map((kind) => [kind, validateProgress(kind, backup.data[kind])])) };
}

export function restoreBackup(backup) {
  const checked = parseBackup(JSON.stringify(backup));
  const previous = Object.fromEntries(Object.entries(KEYS).map(([kind, key]) => [kind, localStorage.getItem(key)]));
  const written = [];
  try {
    for (const [kind, key] of Object.entries(KEYS)) {
      if (checked.data[kind] === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(checked.data[kind]));
      written.push(kind);
    }
  } catch {
    for (const kind of written.reverse()) {
      try { if (previous[kind] === null) localStorage.removeItem(KEYS[kind]); else localStorage.setItem(KEYS[kind], previous[kind]); } catch { /* Storage can be revoked by the browser. */ }
    }
    throw new Error("Could not save the backup. Check browser storage permissions and available space.");
  }
}
