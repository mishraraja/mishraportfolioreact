import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExperience } from "../context/ExperienceContext";
import { sfx } from "../lib/sound";
import "./ControlDock.css";

function IconSound({ on }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      {on ? (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      ) : (
        <path d="M22 9l-6 6M16 9l6 6" />
      )}
    </svg>
  );
}

function IconTerminal() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
      <path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4.5v1A3.5 3.5 0 0 0 8 10.5M17 6h2.5v1a3.5 3.5 0 0 1-3.5 3.5" />
      <path d="M12 14v3M9 20h6M10 17h4v3h-4z" />
    </svg>
  );
}

function IconPalette() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 9 0 1 0 0 18c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.7 1.7-1.7H16a5 5 0 0 0 5-5c0-4-4-7.2-9-7.2z" />
      <circle cx="7.5" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * The always-there control rail. Small on purpose: it hints that the site has
 * hidden depth without spelling any of it out.
 */
export function ControlDock() {
  const {
    themes, theme, setTheme, soundOn, toggleSound,
    setTerminalOpen, setTrophyOpen, unlockedCount, total,
  } = useExperience();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const pct = Math.round((unlockedCount / total) * 100);

  return (
    <div className="dock" role="toolbar" aria-label="Site controls">
      {/* Theme picker */}
      <div className="dock__group">
        <button
          type="button"
          className={"dock__btn " + (paletteOpen ? "dock__btn--active" : "")}
          onClick={() => {
            setPaletteOpen((v) => !v);
            sfx.click();
          }}
          onPointerEnter={sfx.hover}
          aria-expanded={paletteOpen}
          aria-label="Change colour theme"
          data-tip="Theme"
        >
          <IconPalette />
        </button>

        <AnimatePresence>
          {paletteOpen ? (
            <motion.div
              className="dock__palette"
              initial={{ opacity: 0, x: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={"dock__swatch " + (theme === t.id ? "dock__swatch--on" : "")}
                  style={{ "--swatch": t.swatch }}
                  onClick={() => setTheme(t.id)}
                  onPointerEnter={sfx.hover}
                  aria-label={"Theme: " + t.label}
                  aria-pressed={theme === t.id}
                >
                  <span className="dock__swatch-dot" aria-hidden="true" />
                  <span className="dock__swatch-label">{t.label}</span>
                </button>
              ))}
              <p className="dock__palette-hint">Press T to cycle</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <button
        type="button"
        className={"dock__btn " + (soundOn ? "dock__btn--active" : "")}
        onClick={toggleSound}
        onPointerEnter={sfx.hover}
        aria-pressed={soundOn}
        aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
        data-tip={soundOn ? "Sound on" : "Sound off"}
      >
        <IconSound on={soundOn} />
      </button>

      <button
        type="button"
        className="dock__btn"
        onClick={() => {
          setTerminalOpen(true);
          sfx.open();
        }}
        onPointerEnter={sfx.hover}
        aria-label="Open terminal"
        data-tip="Terminal ( ` )"
      >
        <IconTerminal />
      </button>

      <button
        type="button"
        className="dock__btn dock__btn--trophy"
        onClick={() => {
          setTrophyOpen(true);
          sfx.open();
        }}
        onPointerEnter={sfx.hover}
        aria-label={"Secrets found: " + unlockedCount + " of " + total}
        data-tip="Secrets"
      >
        <IconTrophy />
        {unlockedCount > 0 ? <span className="dock__badge">{unlockedCount}</span> : null}
        <svg className="dock__ring" viewBox="0 0 40 40" aria-hidden="true">
          <circle className="dock__ring-track" cx="20" cy="20" r="18" />
          <circle
            className="dock__ring-fill"
            cx="20"
            cy="20"
            r="18"
            style={{ strokeDasharray: 113, strokeDashoffset: 113 - (113 * pct) / 100 }}
          />
        </svg>
      </button>
    </div>
  );
}
