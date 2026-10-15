import { rich } from "../../dsa/engine/views/format";
import { sfx } from "../../lib/sound";
import "./Labs.css";

/** The little building blocks every lab is made of. */

export function Panel({ title, className = "", children }) {
  return (
    <section className={"lab-panel " + className}>
      {title ? <h3 className="lab-panel__title">{title}</h3> : null}
      {children}
    </section>
  );
}

export function Btn({ variant, className = "", children, onClick, ...rest }) {
  return (
    <button
      type="button"
      className={"lab-btn" + (variant ? " lab-btn--" + variant : "") + (className ? " " + className : "")}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Narration. Supports **bold** and `code`, like the DSA Arcade's guide. */
export function Say({ tone, children }) {
  return (
    <p className={"lab-say" + (tone ? " lab-say--" + tone : "")} aria-live="polite">
      <span className="lab-say__guide" aria-hidden="true">
        {tone === "bad" ? "🙀" : tone === "good" ? "🥳" : "🧑‍🚀"}
      </span>
      <span>{rich(children)}</span>
    </p>
  );
}

export function Segmented({ label, options, value, onChange }) {
  return (
    <div className="lab-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={"lab-seg__opt" + (value === o.id ? " is-on" : "")}
          aria-pressed={value === o.id}
          onClick={() => {
            if (value !== o.id) sfx.click();
            onChange(o.id);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, children }) {
  return (
    <label className={"lab-toggle" + (checked ? " is-on" : "")}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="lab-toggle__track" aria-hidden="true">
        <span />
      </span>
      <span>{children}</span>
    </label>
  );
}
