import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { navItems } from "../data/nav";
import { profile } from "../data/profile";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";
import { useExperience } from "../context/ExperienceContext";
import { sfx } from "../lib/sound";
import "./CommandPalette.css";

const LEARN = [
  { id: "dsa", label: "Open the DSA Arcade — 75 playable interview problems", icon: "🕹", path: "/dsa" },
  { id: "dsa-radar", label: "Play Pattern Radar", icon: "📡", path: "/dsa/radar" },
  { id: "dsa-roadmap", label: "DSA: the 8-week roadmap", icon: "🗺", path: "/dsa/learn/roadmap" },
  { id: "dsa-patterns", label: "DSA: the pattern playbook", icon: "🧠", path: "/dsa/learn/patterns" },
  { id: "dsa-bigo", label: "DSA: the Big-O lab", icon: "⚡", path: "/dsa/learn/big-o" },
  { id: "dsa-interview", label: "DSA: the interview playbook", icon: "🎤", path: "/dsa/learn/interview" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const {
    unlock, cycleTheme, setTheme, themes, theme, toggleSound, soundOn,
    setTerminalOpen, setTrophyOpen, setChessOpen, toggleRetro, retro,
  } = useExperience();

  useLockBodyScroll(open);

  function close() {
    setOpen(false);
    setQuery("");
    setCursor(0);
  }

  function scrollToId(id) {
    if (pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
    close();
  }

  const commands = useMemo(() => {
    const go = navItems.map((item) => ({
      id: "go-" + item.id,
      label: "Go to " + item.label,
      group: "Navigate",
      icon: "→",
      action: () => scrollToId(item.id),
    }));

    const learn = LEARN.map((item) => ({
      ...item,
      group: "Learn",
      action: () => {
        close();
        navigate(item.path);
      },
    }));

    const actions = [
      {
        id: "terminal",
        label: "Open terminal",
        hint: "`",
        group: "Play",
        icon: "▸",
        action: () => {
          close();
          setTerminalOpen(true);
        },
      },
      {
        id: "chess",
        label: "Play the mate-in-one puzzle",
        group: "Play",
        icon: "♞",
        action: () => {
          close();
          setChessOpen(true);
        },
      },
      {
        id: "secrets",
        label: "Show what is hidden on this site",
        hint: "?",
        group: "Play",
        icon: "🏆",
        action: () => {
          close();
          setTrophyOpen(true);
        },
      },
      {
        id: "retro",
        label: retro ? "Leave 1983" : "Boot the CRT (retro mode)",
        group: "Play",
        icon: "🕹",
        action: () => {
          close();
          toggleRetro();
        },
      },
      {
        id: "sound",
        label: soundOn ? "Turn sound off" : "Turn sound on",
        group: "Settings",
        icon: "🔊",
        action: () => {
          toggleSound();
          close();
        },
      },
      {
        id: "cycle-theme",
        label: "Cycle to the next theme",
        hint: "T",
        group: "Settings",
        icon: "🎨",
        action: () => {
          cycleTheme();
          close();
        },
      },
      ...themes.map((t) => ({
        id: "theme-" + t.id,
        label: "Theme: " + t.label + (theme === t.id ? " (current)" : ""),
        group: "Settings",
        icon: "●",
        swatch: t.swatch,
        action: () => {
          setTheme(t.id);
          close();
        },
      })),
    ];

    const links = [
      profile.social.email && {
        id: "email",
        label: "Email " + profile.name.split(" ")[0],
        group: "Contact",
        icon: "✉",
        action: () => {
          window.location.href = "mailto:" + profile.social.email;
          close();
        },
      },
      profile.resumeUrl && {
        id: "resume",
        label: "Open resume",
        group: "Contact",
        icon: "📄",
        action: () => {
          window.open(profile.resumeUrl, "_blank", "noopener");
          close();
        },
      },
      profile.social.github && {
        id: "github",
        label: "Open GitHub",
        group: "Contact",
        icon: "◆",
        action: () => {
          window.open(profile.social.github, "_blank", "noopener");
          close();
        },
      },
      {
        id: "linkedin",
        label: "Open LinkedIn",
        group: "Contact",
        icon: "◆",
        action: () => {
          window.open(profile.social.linkedin, "_blank", "noopener");
          close();
        },
      },
    ].filter(Boolean);

    return [...go, ...learn, ...actions, ...links];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themes, theme, soundOn, retro, cycleTheme, setTheme, toggleSound, toggleRetro, pathname, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
  }, [commands, query]);

  /* Group the filtered list while keeping a flat index for the cursor. */
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((cmd, i) => {
      if (!map.has(cmd.group)) map.set(cmd.group, []);
      map.get(cmd.group).push({ ...cmd, flatIndex: i });
    });
    return [...map.entries()];
  }, [filtered]);

  useEffect(() => {
    function onKeyDown(e) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          const next = !v;
          if (next) {
            sfx.open();
            unlock("commander");
          } else sfx.close();
          return next;
        });
      }
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [unlock]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  function onInputKey(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, filtered.length - 1));
      sfx.type();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
      sfx.type();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[cursor];
      if (cmd) {
        sfx.click();
        cmd.action();
      }
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-index="' + cursor + '"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="cmdk-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
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
            <div className="cmdk__input-wrap">
              <span className="cmdk__prompt" aria-hidden="true">
                ⌘
              </span>
              <input
                autoFocus
                className="cmdk__input"
                placeholder="Jump somewhere, change the theme, open a shell…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  sfx.type();
                }}
                onKeyDown={onInputKey}
                aria-label="Command search"
                spellCheck="false"
              />
              <span className="cmdk__count">{filtered.length}</span>
            </div>

            <div className="cmdk__list" ref={listRef}>
              {filtered.length === 0 ? (
                <p className="cmdk__empty">
                  Nothing matches “{query}”. Try the terminal instead — press <kbd>`</kbd>.
                </p>
              ) : (
                grouped.map(([group, items]) => (
                  <div key={group} className="cmdk__group">
                    <span className="cmdk__group-label">{group}</span>
                    <ul>
                      {items.map((cmd) => (
                        <li key={cmd.id}>
                          <button
                            type="button"
                            data-index={cmd.flatIndex}
                            className={"cmdk__item " + (cursor === cmd.flatIndex ? "cmdk__item--on" : "")}
                            onClick={() => {
                              sfx.click();
                              cmd.action();
                            }}
                            onPointerEnter={() => setCursor(cmd.flatIndex)}
                          >
                            <span
                              className="cmdk__icon"
                              style={cmd.swatch ? { color: cmd.swatch } : undefined}
                              aria-hidden="true"
                            >
                              {cmd.icon}
                            </span>
                            <span className="cmdk__label">{cmd.label}</span>
                            {cmd.hint ? <kbd className="cmdk__hint-key">{cmd.hint}</kbd> : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>

            <div className="cmdk__hint">
              <span>↑↓ navigate</span>
              <span>↵ run</span>
              <span>esc close</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
