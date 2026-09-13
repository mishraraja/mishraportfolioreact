import { toneClass } from "./format";

const ROW = 32;

function niceTicks(min, max) {
  const span = Math.max(1, max - min);
  const raw = span / 6;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) || magnitude * 10;
  const out = [];
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) out.push(t);
  return out;
}

/** Intervals laid out on a shared timeline, one lane per row. */
export function IntervalView({ panel }) {
  const { items, min = 0, max = 10, rows, marker } = panel;
  const span = Math.max(1, max - min);
  const pct = (x) => ((x - min) / span) * 100;
  const rowCount = Math.max(rows ? rows.length : 0, ...items.map((it) => (it.row || 0) + 1), 1);
  const hasLabels = Boolean(rows && rows.some(Boolean));
  const ticks = niceTicks(min, max);

  return (
    <div className="ivw-scroll">
      <div className="ivw">
        {hasLabels ? (
          <div className="ivw__labels" aria-hidden="true">
            {Array.from({ length: rowCount }, (_, r) => (
              <span key={r} className="ivw__rowlabel">
                {rows[r] || ""}
              </span>
            ))}
          </div>
        ) : null}

        <div className="ivw__track" style={{ height: rowCount * ROW + 22 }}>
          {ticks.map((t) => (
            <span key={"g" + t} className="ivw__grid" style={{ left: pct(t) + "%" }} aria-hidden="true" />
          ))}
          {marker !== undefined ? (
            <span className="ivw__marker" style={{ left: pct(marker) + "%" }}>
              <span>{marker}</span>
            </span>
          ) : null}
          {items.length === 0 ? <span className="view-empty ivw__empty">no intervals</span> : null}
          {items.map((it) => (
            <span
              key={it.id}
              className={"ivw__bar" + toneClass(it.tone)}
              style={{ left: pct(it.s) + "%", width: `max(${pct(it.e) - pct(it.s)}%, 8px)`, top: (it.row || 0) * ROW }}
            >
              <span className="ivw__text">
                {it.tag ? it.tag + " " : ""}[{it.s}, {it.e}]
              </span>
            </span>
          ))}
          <div className="ivw__axis" style={{ top: rowCount * ROW }} aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} style={{ left: pct(t) + "%" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
