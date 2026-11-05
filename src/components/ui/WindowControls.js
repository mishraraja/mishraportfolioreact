import "./WindowControls.css";

/** Only render controls with a real action; never decorative window buttons. */
export function WindowControls({ title, onClose, onMinimize, onResize, expanded = false }) {
  return <div className="window-controls" role="group" aria-label={title + " window controls"}>
    <button type="button" className="window-control window-control--close" onClick={onClose} aria-label={"Close " + title} title={"Close " + title}>
      <svg aria-hidden="true" viewBox="0 0 12 12" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 3 6 6m0-6-6 6" /></svg>
    </button>
    {onMinimize && <button type="button" className="window-control window-control--minimize" onClick={onMinimize} aria-label={"Minimize " + title} title={"Minimize " + title}>
      <svg aria-hidden="true" viewBox="0 0 12 12" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6h8" /></svg>
    </button>}
    {onResize && <button type="button" className="window-control window-control--resize" onClick={onResize} aria-label={(expanded ? "Restore " : "Maximize ") + title} title={(expanded ? "Restore " : "Maximize ") + title} aria-pressed={expanded}>
      <svg aria-hidden="true" viewBox="0 0 12 12" width="8" height="8" fill="currentColor"><path d={expanded ? "M1 5h4V1ZM11 7H7v4Z" : "M2 2h5L2 7ZM10 10H5l5-5Z"} /></svg>
    </button>}
  </div>;
}
