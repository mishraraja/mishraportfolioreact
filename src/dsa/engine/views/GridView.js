import { Fragment } from "react";
import { cellText, toneClass } from "./format";

/** A 2-D table with row/column labels, per-cell tones and a cursor ring. */
export function GridView({ panel }) {
  const { cells, tones = {}, rowLabels, colLabels, cursor } = panel;
  const rows = cells.length;
  const cols = rows ? cells[0].length : 0;
  if (!rows || !cols) return <p className="view-empty">empty</p>;

  const texts = cells.map((row) => row.map(cellText));
  const longest = texts.reduce((m, row) => row.reduce((mm, t) => Math.max(mm, [...t].length), m), 1);
  const size = Math.round(Math.min(64, Math.max(34, 16 + longest * 9)));
  const rLabels = rowLabels || Array.from({ length: rows }, (_, i) => i);
  const cLabels = colLabels || Array.from({ length: cols }, (_, i) => i);

  return (
    <div className="gv-scroll">
      <div className="gv" style={{ gridTemplateColumns: `auto repeat(${cols}, ${size}px)`, "--gsize": size + "px" }}>
        <span className="gv__corner" aria-hidden="true" />
        {cLabels.map((label, j) => (
          <span key={"c" + j} className="gv__label">
            {label}
          </span>
        ))}
        {texts.map((row, r) => (
          <Fragment key={r}>
            <span className="gv__label gv__label--row">{rLabels[r]}</span>
            {row.map((text, c) => {
              const k = r + "," + c;
              const isCursor = cursor && cursor[0] === r && cursor[1] === c;
              return (
                <span key={k} className={"gv__cell" + toneClass(tones[k]) + (isCursor ? " gv__cell--cursor" : "")}>
                  {text}
                </span>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
