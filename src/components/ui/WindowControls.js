import "./WindowControls.css";

/** Only render controls with a real action; never decorative window buttons. */
export function WindowControls({ title, onClose, onMinimize, onResize, expanded = false }) {
  return <div className="window-controls" role="group" aria-label={title + " window controls"}>
    <button type="button" className="window-control window-control--close" onClick={onClose} aria-label={"Close " + title} title={"Close " + title}>
      <span aria-hidden="true">×</span>
    </button>
    {onMinimize && <button type="button" className="window-control window-control--minimize" onClick={onMinimize} aria-label={"Minimize " + title} title={"Minimize " + title}>
      <span aria-hidden="true">−</span>
    </button>}
    {onResize && <button type="button" className="window-control window-control--resize" onClick={onResize} aria-label={(expanded ? "Restore " : "Maximize ") + title} title={(expanded ? "Restore " : "Maximize ") + title} aria-pressed={expanded}>
      <svg aria-hidden="true" viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={expanded ? "M1 5h4V1M11 7H7v4" : "M1 5V1h4M11 7v4H7"} /></svg>
    </button>}
  </div>;
}
