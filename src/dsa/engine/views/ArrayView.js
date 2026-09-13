import { cellText, toneClass } from "./format";

const BAR_H = 110;
const PTR_ROW = 19;

/** A row of cells with sliding pointers, an optional window and an optional bar chart. */
export function ArrayView({ panel }) {
  const { values, tones = {}, pointers = {}, window: win, sub, bars, water, indices = true, start = 0 } = panel;
  const n = values.length;
  if (n === 0) return <p className="view-empty">empty</p>;

  const texts = values.map(cellText);
  const longest = texts.reduce((m, t) => Math.max(m, [...t].length), 1);
  const compact = n > 14 && longest <= 2;
  const cell = compact ? 26 : Math.round(Math.min(110, Math.max(40, 18 + longest * 9)));
  const gap = compact ? 3 : 6;
  const step = cell + gap;

  const levels = {};
  const placed = [];
  Object.keys(pointers).forEach((name) => {
    const idx = pointers[name];
    if (!Number.isInteger(idx) || idx < 0 || idx > n) return;
    const level = levels[idx] || 0;
    levels[idx] = level + 1;
    placed.push({ name, idx, level });
  });
  const pointerRows = Math.max(0, ...Object.values(levels));
  const slots = placed.some((p) => p.idx === n) ? n + 1 : n;

  const numeric = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  const max = Math.max(1, ...numeric);
  const columns = { gridTemplateColumns: `repeat(${n}, ${cell}px)`, columnGap: gap };

  return (
    <div className="av-scroll">
      <div className={"av" + (compact ? " av--compact" : "")} style={{ width: slots * step - gap }}>
        <div className={"av__cells" + (bars ? " av__cells--bars" : "")} style={columns}>
          {win && win[0] <= win[1] ? (
            <span
              className="av__window"
              style={{ transform: `translateX(${win[0] * step - 4}px)`, width: (win[1] - win[0] + 1) * step - gap + 8 }}
              aria-hidden="true"
            />
          ) : null}
          {bars && water && water.r > water.l ? (
            <span
              className="av__water"
              style={{ transform: `translateX(${water.l * step + cell / 2}px)`, width: (water.r - water.l) * step, height: (water.h / max) * BAR_H }}
              aria-hidden="true"
            />
          ) : null}
          {values.map((v, i) =>
            bars ? (
              <div key={i} className={"av__col" + toneClass(tones[i])}>
                <span className="av__bar-val">{texts[i]}</span>
                <span className="av__bar" style={{ height: Math.max(3, ((Number(v) || 0) / max) * BAR_H) }} />
              </div>
            ) : (
              <div key={i} className={"av__cell" + toneClass(tones[i])}>
                {texts[i]}
              </div>
            )
          )}
        </div>

        {sub ? (
          <div className="av__row av__row--sub" style={columns}>
            {values.map((_, i) => (
              <span key={i}>{sub[i] ?? ""}</span>
            ))}
          </div>
        ) : null}

        {indices ? (
          <div className="av__row" style={columns} aria-hidden="true">
            {values.map((_, i) => (
              <span key={i}>{i + start}</span>
            ))}
          </div>
        ) : null}

        {placed.length ? (
          <div className="av__ptrs" style={{ height: pointerRows * PTR_ROW }}>
            {placed.map((p) => (
              <span key={p.name} className="av__ptr" style={{ transform: `translate(${p.idx * step + cell / 2}px, ${p.level * PTR_ROW}px)` }}>
                <span className="av__ptr-label">▲ {p.name}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
