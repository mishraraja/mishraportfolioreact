/**
 * Runs a problem's tracer and turns what it records into playable frames, and
 * reads the playground's text inputs back into real values.
 */

/** Past this many frames the player stops recording and skips to the answer. */
export const MAX_FRAMES = 400;

function cleanNumbers(value) {
  if (typeof value === "number") return Object.is(value, -0) ? 0 : value;
  if (Array.isArray(value)) return value.map(cleanNumbers);
  return value;
}

export function runTrace(problem, input) {
  const frames = [];
  let overflow = null;

  const recorder = {
    step(say, panels, extra = {}) {
      const frame = { say, panels: panels.filter(Boolean), vars: extra.vars, ask: extra.ask };
      if (frames.length >= MAX_FRAMES) {
        overflow = frame;
        return;
      }
      frames.push(frame);
    },
  };

  // Tracers are free to mutate what they are given.
  const result = cleanNumbers(problem.trace(JSON.parse(JSON.stringify(input)), recorder));

  if (overflow) {
    frames.push({
      ...overflow,
      ask: undefined,
      say: "That run is too long to animate step by step, so here is where it ends up. " + overflow.say,
    });
  }

  if (frames.length === 0) {
    frames.push({ say: "Nothing to do here — the answer is **" + formatValue(result) + "**.", panels: [] });
  }

  // The final frame has no "next" to predict.
  frames[frames.length - 1] = { ...frames[frames.length - 1], ask: undefined };

  return { frames, result, truncated: Boolean(overflow) };
}

/* ------------------------------------------------------------------ */
/* Display formatting                                                  */
/* ------------------------------------------------------------------ */

export function formatValue(value) {
  if (value === null || value === undefined) return "null";
  if (value === Infinity) return "∞";
  if (value === -Infinity) return "−∞";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    const clean = Object.is(value, -0) ? 0 : value;
    return Number.isInteger(clean) ? String(clean) : String(Math.round(clean * 100000) / 100000);
  }
  if (Array.isArray(value)) return "[" + value.map(formatValue).join(", ") + "]";
  return String(value);
}

/** Order-insensitive canonical form, for answers LeetCode accepts "in any order". */
export function canonical(value) {
  if (!Array.isArray(value)) return value;
  return value.map(canonical).sort((a, b) => {
    const x = JSON.stringify(a);
    const y = JSON.stringify(b);
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

/* ------------------------------------------------------------------ */
/* Playground inputs                                                   */
/* ------------------------------------------------------------------ */

function fail(message) {
  throw new Error(message);
}

function parseJson(raw, hint) {
  try {
    return JSON.parse(raw);
  } catch {
    return fail(hint);
  }
}

/** Accepts `[1, 2, 3]` or just `1, 2, 3`. */
function parseLoose(raw, hint) {
  const s = raw.trim();
  if (s === "") return [];
  try {
    return JSON.parse(s);
  } catch {
    try {
      return JSON.parse("[" + s + "]");
    } catch {
      return fail(hint);
    }
  }
}

function checkLength(spec, length, noun) {
  if (spec.minLen !== undefined && length < spec.minLen) {
    fail("Needs at least " + spec.minLen + " " + noun + ".");
  }
  if (spec.maxLen !== undefined && length > spec.maxLen) {
    fail("Keep it to " + spec.maxLen + " " + noun + " or fewer so the animation stays readable.");
  }
}

function checkBounds(spec, n) {
  if (spec.min !== undefined && n < spec.min) fail("Values must be at least " + spec.min + ".");
  if (spec.max !== undefined && n > spec.max) fail("Values must be at most " + spec.max + ".");
}

const isInt = (x) => Number.isInteger(x);

function parseField(spec, raw) {
  const s = String(raw ?? "");

  switch (spec.kind) {
    case "int": {
      if (!/^\s*-?\d+\s*$/.test(s)) fail("Enter a whole number.");
      const n = Number(s.trim());
      checkBounds(spec, n);
      return n;
    }

    case "string": {
      let str = s;
      const t = s.trim();
      if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
        str = parseJson(t, "That quoted text isn't valid.");
      }
      checkLength(spec, str.length, "characters");
      if (spec.pattern && !spec.pattern.test(str)) fail(spec.patternHint || "That text has characters this problem doesn't allow.");
      return str;
    }

    case "intArray": {
      const v = parseLoose(s, "Use a list of whole numbers, like [1, 2, 3].");
      if (!Array.isArray(v) || !v.every(isInt)) fail("Use a list of whole numbers, like [1, 2, 3].");
      checkLength(spec, v.length, "numbers");
      v.forEach((n) => checkBounds(spec, n));
      return v;
    }

    case "stringArray": {
      const hint = 'Use a list of words, like ["eat", "tea"].';
      const v = parseJson(s.trim() || "[]", hint);
      if (!Array.isArray(v) || !v.every((w) => typeof w === "string")) fail(hint);
      checkLength(spec, v.length, "items");
      v.forEach((w) => {
        if (spec.maxItemLen !== undefined && w.length > spec.maxItemLen) {
          fail("Keep each item to " + spec.maxItemLen + " characters or fewer.");
        }
        if (spec.pattern && !spec.pattern.test(w)) fail(spec.patternHint || "One of those items isn't allowed here.");
      });
      return v;
    }

    case "matrix": {
      const hint = "Use rows of numbers, like [[1, 2], [3, 4]].";
      const v = parseJson(s.trim(), hint);
      if (!Array.isArray(v) || v.length === 0 || !v.every((row) => Array.isArray(row) && row.every(isInt))) fail(hint);
      if (!v.every((row) => row.length === v[0].length) || v[0].length === 0) fail("Every row needs the same, non-zero length.");
      if (spec.maxRows && v.length > spec.maxRows) fail("Keep it to " + spec.maxRows + " rows or fewer.");
      if (spec.maxCols && v[0].length > spec.maxCols) fail("Keep it to " + spec.maxCols + " columns or fewer.");
      if (spec.square && v.length !== v[0].length) fail("This one needs a square matrix.");
      v.forEach((row) => row.forEach((n) => checkBounds(spec, n)));
      return v;
    }

    case "charGrid": {
      const hint = 'Use rows of characters, like ["110", "011"].';
      const raw2 = parseJson(s.trim(), hint);
      if (!Array.isArray(raw2) || raw2.length === 0) fail(hint);
      const v = raw2.map((row) => {
        if (typeof row === "string") return row.split("");
        if (Array.isArray(row) && row.every((c) => typeof c === "string" && c.length === 1)) return row;
        return fail(hint);
      });
      if (!v.every((row) => row.length === v[0].length) || v[0].length === 0) fail("Every row needs the same, non-zero length.");
      if (spec.maxRows && v.length > spec.maxRows) fail("Keep it to " + spec.maxRows + " rows or fewer.");
      if (spec.maxCols && v[0].length > spec.maxCols) fail("Keep it to " + spec.maxCols + " columns or fewer.");
      if (spec.pattern && !v.every((row) => row.every((c) => spec.pattern.test(c)))) {
        fail(spec.patternHint || "That grid has characters this problem doesn't allow.");
      }
      return v;
    }

    case "tree": {
      const hint = "Use level order with null for gaps, like [3, 9, 20, null, null, 15, 7].";
      const v = parseLoose(s, hint);
      if (!Array.isArray(v) || !v.every((x) => x === null || isInt(x))) fail(hint);
      if (v.length && v[0] === null) fail("The root can't be null — use [] for an empty tree.");
      checkLength(spec, v.length, "slots");
      v.forEach((n) => n !== null && checkBounds(spec, n));
      return v;
    }

    case "pairs": {
      const hint = "Use pairs, like [[1, 3], [2, 6]].";
      const v = parseLoose(s, hint);
      if (!Array.isArray(v) || !v.every((p) => Array.isArray(p) && p.length === 2 && p.every(isInt))) fail(hint);
      checkLength(spec, v.length, "pairs");
      v.forEach((p) => p.forEach((n) => checkBounds(spec, n)));
      return v;
    }

    case "intLists": {
      const hint = "Use a list of lists, like [[1, 4, 5], [1, 3, 4]].";
      const v = parseLoose(s, hint);
      if (!Array.isArray(v) || !v.every((l) => Array.isArray(l) && l.every(isInt))) fail(hint);
      checkLength(spec, v.length, "lists");
      v.forEach((l) => {
        if (spec.maxItemLen !== undefined && l.length > spec.maxItemLen) {
          fail("Keep each list to " + spec.maxItemLen + " numbers or fewer.");
        }
        l.forEach((n) => checkBounds(spec, n));
      });
      return v;
    }

    default:
      return fail("Unknown input kind: " + spec.kind);
  }
}

/** value → the text shown in its input box */
export function formatField(spec, value) {
  if (spec.kind === "string") return value;
  if (spec.kind === "int") return String(value);
  if (spec.kind === "charGrid") return formatValue(value.map((row) => row.join("")));
  return formatValue(value);
}

/**
 * Parses every field. Returns { input } on success or { errors: {name: message} }.
 * A problem's own `validate(input)` runs last, for rules that span fields.
 */
export function parseInputs(problem, rawByName) {
  const input = {};
  const errors = {};

  problem.inputs.forEach((spec) => {
    try {
      input[spec.name] = parseField(spec, rawByName[spec.name]);
    } catch (err) {
      errors[spec.name] = err.message;
    }
  });

  if (Object.keys(errors).length === 0 && problem.validate) {
    const message = problem.validate(input);
    if (message) errors._form = message;
  }

  return Object.keys(errors).length ? { errors } : { input };
}
