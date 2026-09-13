import { motion } from "framer-motion";
import { formatValue } from "../trace";
import { cellText, toneClass } from "./format";

const keyText = (k) => (typeof k === "string" ? (k === "" ? '""' : k) : formatValue(k));
const valueText = (v) => (typeof v === "string" ? v : formatValue(v));

/** Key → value chips (or bare chips for a set). */
export function MapView({ panel }) {
  const { entries, set, hot, tone } = panel;
  if (!entries.length) return <p className="view-empty">empty</p>;
  return (
    <div className="mv">
      {entries.map(([k, v], i) => {
        const isHot = hot !== undefined && k === hot;
        return (
          <motion.span
            key={String(k) + ":" + i}
            className={"mv__chip" + (isHot ? toneClass(tone || "active") : "")}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <span className="mv__k">{keyText(k)}</span>
            {set ? null : (
              <>
                <span className="mv__arrow" aria-hidden="true">
                  →
                </span>
                <span className="mv__v">{valueText(v)}</span>
              </>
            )}
          </motion.span>
        );
      })}
    </div>
  );
}

/** A vertical stack (top first) or a horizontal queue (front first). */
export function StackView({ panel }) {
  const { items, kind, tone } = panel;
  const isQueue = kind === "queue";
  if (!items.length) return <p className="view-empty">empty</p>;
  const shown = isQueue ? items.map((v, i) => ({ v, key: "q" + i })) : [...items].map((v, i) => ({ v, key: "s" + i })).reverse();
  return (
    <div className={"sv sv--" + (isQueue ? "queue" : "stack")}>
      <span className="sv__end">{isQueue ? "front" : "top"}</span>
      {shown.map((item, i) => (
        <span key={item.key} className={"sv__item" + (i === 0 ? toneClass(tone) : "")}>
          {cellText(item.v)}
        </span>
      ))}
      {isQueue ? <span className="sv__end">back</span> : null}
    </div>
  );
}

export function TextView({ panel }) {
  return <pre className={"txv" + toneClass(panel.tone)}>{panel.value}</pre>;
}

/** Rows of bits, most significant on the left, decimal on the right. */
export function BitsView({ panel }) {
  return (
    <div className="bv">
      {panel.rows.map((row) => {
        const width = row.width;
        const text = (row.value >>> 0).toString(2).padStart(width, "0").slice(-width);
        const compact = width > 16;
        return (
          <div key={row.name} className={"bv__row" + (compact ? " bv__row--compact" : "")}>
            <span className="bv__name">{row.name}</span>
            <span className="bv__bits">
              {text.split("").map((bit, i) => {
                const index = width - 1 - i;
                return (
                  <span
                    key={i}
                    className={"bv__bit" + (bit === "1" ? " bv__bit--on" : "") + (i > 0 && i % 4 === 0 ? " bv__bit--gap" : "") + toneClass(row.tones[index])}
                  >
                    {bit}
                  </span>
                );
              })}
            </span>
            <span className="bv__dec">{formatValue(row.value)}</span>
          </div>
        );
      })}
    </div>
  );
}
