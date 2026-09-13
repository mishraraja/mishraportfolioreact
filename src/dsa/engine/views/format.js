import { Fragment } from "react";
import { formatValue } from "../trace";

/** What a single cell shows. Blank for “not computed yet”. */
export function cellText(value) {
  if (value === null || value === undefined) return "";
  if (value === true) return "✓";
  if (value === false) return "✗";
  if (typeof value === "string") {
    if (value === "") return '""';
    if (value === " ") return "␣";
    return value;
  }
  return formatValue(value);
}

export function toneClass(tone) {
  return tone ? " tone-" + tone : "";
}

/** Narration supports **bold** and `code`, nothing else. */
export function rich(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .map((part, i) => {
      if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
      return <Fragment key={i}>{part}</Fragment>;
    });
}
