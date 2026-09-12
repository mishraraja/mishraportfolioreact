import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { navItems } from "../data/nav";
import { profile } from "../data/profile";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";
import "./CommandPalette.css";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useLockBodyScroll(open);

  const commands = useMemo(() => {
    const sectionCommands = navItems.map((item) => ({
      id: item.id,
      label: `Go to ${item.label}`,
      action: () => scrollToId(item.id),
    }));

    const linkCommands = [
      profile.social.github && { id: "github", label: "Open GitHub", action: () => window.open(profile.social.github, "_blank") },
      { id: "linkedin", label: "Open LinkedIn", action: () => window.open(profile.social.linkedin, "_blank") },
      profile.resumeUrl && { id: "resume", label: "Open Resume", action: () => window.open(profile.resumeUrl, "_blank") },
    ].filter(Boolean);

    return [...sectionCommands, ...linkCommands];
  }, []);

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function onKeyDown(e) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function scrollToId(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
    setQuery("");
  }

  function run(cmd) {
    cmd.action();
    setOpen(false);
    setQuery("");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cmdk-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="cmdk"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              className="cmdk__input"
              placeholder="Jump to a section or link…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Command search"
            />
            <ul className="cmdk__list">
              {filtered.length === 0 && <li className="cmdk__empty">No matches</li>}
              {filtered.map((cmd) => (
                <li key={cmd.id}>
                  <button className="cmdk__item" onClick={() => run(cmd)}>
                    {cmd.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="cmdk__hint">
              <span>↑↓ navigate</span>
              <span>esc close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
